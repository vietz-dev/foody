'use client';
import { useState } from 'react';
import { Button, Input, InputGroup } from '@chakra-ui/react';
import type { PlanRecipe } from '@foody/contracts';
import { PortionStepper } from '../../components/portion-stepper';
import { CheckIcon, PlusIcon, SearchIcon } from '../../components/icons';
import { setPortions, togglePlan } from './actions';

export function PlanList({ initial }: { initial: PlanRecipe[] }) {
	// ponytail: optimistic local state; on action error the page re-renders from the server.
	const [items, setItems] = useState(initial);
	const [query, setQuery] = useState('');
	const update = (id: string, patch: Partial<PlanRecipe>) =>
		setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

	const toggle = (item: PlanRecipe) => {
		update(item.id, { planned: !item.planned });
		togglePlan(item.id).then((planned) => update(item.id, { planned }));
	};
	const portions = (item: PlanRecipe, value: number) => {
		update(item.id, { portions: value });
		setPortions(item.id, value).then((portions) => update(item.id, { portions }));
	};

	const visible = items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()));
	const selected = visible.filter((i) => i.planned);
	const rest = visible.filter((i) => !i.planned);

	return (
		<>
			<InputGroup startElement={<SearchIcon size={18} />}>
				<Input
					size="lg"
					rounded="2xl"
					bg="white"
					placeholder="Rezept suchen …"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</InputGroup>

			<Section
				title="Diese Woche"
				empty={selected.length === 0 ? 'Noch nichts geplant – wähle unten Rezepte aus.' : undefined}
			>
				{selected.map((item) => (
					<Row key={item.id} item={item} onToggle={() => toggle(item)}>
						<PortionStepper value={item.portions} onChange={(v) => portions(item, v)} />
					</Row>
				))}
			</Section>

			<Section
				title="Weitere Rezepte"
				empty={rest.length === 0 ? 'Keine weiteren Rezepte gefunden.' : undefined}
			>
				{rest.map((item) => (
					<Row key={item.id} item={item} onToggle={() => toggle(item)}>
						<Button
							size="sm"
							rounded="full"
							colorPalette="brand"
							variant="subtle"
							fontWeight="bold"
							onClick={() => toggle(item)}
						>
							Planen
						</Button>
					</Row>
				))}
			</Section>
		</>
	);
}

function Section({
	title,
	empty,
	children
}: {
	title: string;
	empty?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-7">
			<h2 className="mb-2 px-1 text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
				{title}
			</h2>
			{empty ? (
				<p className="rounded-2xl border border-dashed border-[var(--line)] p-5 text-center text-sm text-[var(--muted)]">
					{empty}
				</p>
			) : (
				<ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
					{children}
				</ul>
			)}
		</section>
	);
}

function Row({
	item,
	onToggle,
	children
}: {
	item: PlanRecipe;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	const meta = [
		item.prepTimeMinutes ? `${item.prepTimeMinutes} Min` : null,
		item.planned ? `${item.portions} Portionen` : null
	]
		.filter(Boolean)
		.join(' · ');
	return (
		<li className="flex min-h-16 items-center gap-3 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0">
			<button
				type="button"
				onClick={onToggle}
				aria-pressed={item.planned}
				aria-label={item.planned ? `${item.name} aus dem Plan entfernen` : `${item.name} planen`}
				className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition active:scale-95 ${item.planned ? 'bg-[var(--green)] text-white' : 'bg-[#f1f2ee] text-[var(--muted)]'}`}
			>
				{item.planned ? <CheckIcon size={20} /> : <PlusIcon size={20} />}
			</button>
			<div className="min-w-0 flex-1">
				<p className="line-clamp-2 leading-snug font-bold">{item.name}</p>
				{meta && <p className="mt-0.5 text-xs text-[var(--muted)]">{meta}</p>}
			</div>
			{children}
		</li>
	);
}
