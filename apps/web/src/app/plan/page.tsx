'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, IconButton, Input, InputGroup } from '@chakra-ui/react';
import { AppShell, PageHeader } from '../../components/app-shell';
import { CartIcon, CheckIcon, MinusIcon, PlusIcon, SearchIcon } from '../../components/icons';

type Item = { id: number; name: string; minutes: number; selected: boolean; portions: number };

const initial: Item[] = [
	{ id: 1, name: 'Cremige Tomatenpasta', minutes: 25, selected: true, portions: 2 },
	{ id: 2, name: 'Ofengemüse mit Halloumi', minutes: 40, selected: true, portions: 2 },
	{ id: 3, name: 'Thai-Curry', minutes: 30, selected: true, portions: 3 },
	{ id: 4, name: 'Kartoffelgratin', minutes: 60, selected: false, portions: 2 },
	{ id: 5, name: 'Tacos mit Bohnen', minutes: 20, selected: false, portions: 2 }
];

export default function PlanPage() {
	const [items, setItems] = useState(initial);
	const [query, setQuery] = useState('');
	const update = (id: number, patch: Partial<Item>) =>
		setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));

	const visible = items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()));
	const selected = visible.filter((i) => i.selected);
	const rest = visible.filter((i) => !i.selected);
	const count = items.filter((i) => i.selected).length;

	return (
		<AppShell
			action={
				<Button
					asChild
					size="sm"
					rounded="full"
					variant="subtle"
					colorPalette="brand"
					fontWeight="bold"
				>
					<Link href="/plan/einkaufsliste">
						<CartIcon size={16} /> Einkaufsliste
					</Link>
				</Button>
			}
		>
			<PageHeader
				eyebrow="Gemeinsam kochen"
				title="Wochenplan"
				aside={
					<Badge colorPalette="brand" variant="subtle" rounded="full" px="3" py="1" fontSize="sm">
						{count} geplant
					</Badge>
				}
			/>

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
					<Row key={item.id} item={item} onToggle={() => update(item.id, { selected: false })}>
						<div className="flex items-center gap-1 rounded-full bg-[#f1f2ee] p-0.5">
							<IconButton
								aria-label="Weniger Portionen"
								size="xs"
								rounded="full"
								variant="ghost"
								disabled={item.portions <= 1}
								onClick={() => update(item.id, { portions: item.portions - 1 })}
							>
								<MinusIcon size={14} />
							</IconButton>
							<span className="w-5 text-center text-sm font-bold tabular-nums">
								{item.portions}
							</span>
							<IconButton
								aria-label="Mehr Portionen"
								size="xs"
								rounded="full"
								variant="ghost"
								onClick={() => update(item.id, { portions: item.portions + 1 })}
							>
								<PlusIcon size={14} />
							</IconButton>
						</div>
					</Row>
				))}
			</Section>

			<Section
				title="Weitere Rezepte"
				empty={rest.length === 0 ? 'Keine weiteren Rezepte gefunden.' : undefined}
			>
				{rest.map((item) => (
					<Row key={item.id} item={item} onToggle={() => update(item.id, { selected: true })}>
						<Button
							size="sm"
							rounded="full"
							colorPalette="brand"
							variant="subtle"
							fontWeight="bold"
							onClick={() => update(item.id, { selected: true })}
						>
							Planen
						</Button>
					</Row>
				))}
			</Section>
		</AppShell>
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
	item: Item;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<li className="flex min-h-16 items-center gap-3 border-b border-[var(--line)] px-3 py-2.5 last:border-b-0">
			<button
				type="button"
				onClick={onToggle}
				aria-pressed={item.selected}
				aria-label={item.selected ? `${item.name} aus dem Plan entfernen` : `${item.name} planen`}
				className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition active:scale-95 ${item.selected ? 'bg-[var(--green)] text-white' : 'bg-[#f1f2ee] text-[var(--muted)]'}`}
			>
				{item.selected ? <CheckIcon size={20} /> : <PlusIcon size={20} />}
			</button>
			<div className="min-w-0 flex-1">
				<p className="line-clamp-2 leading-snug font-bold">{item.name}</p>
				<p className="mt-0.5 text-xs text-[var(--muted)]">
					{item.minutes} Min{item.selected ? ` · ${item.portions} Portionen` : ''}
				</p>
			</div>
			{children}
		</li>
	);
}
