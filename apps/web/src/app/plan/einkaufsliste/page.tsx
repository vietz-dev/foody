'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Checkbox } from '@chakra-ui/react';
import { AppShell, PageHeader } from '../../../components/app-shell';
import { ArrowLeftIcon } from '../../../components/icons';

type Item = { id: string; name: string; amount?: string; staple?: boolean };

const items: Item[] = [
	{ id: 'tomaten', name: 'Tomaten', amount: '800 g' },
	{ id: 'pasta', name: 'Pasta', amount: '500 g' },
	{ id: 'halloumi', name: 'Halloumi', amount: '2 Pck.' },
	{ id: 'paprika', name: 'Paprika', amount: '3 Stk.' },
	{ id: 'kokosmilch', name: 'Kokosmilch', amount: '400 ml' },
	{ id: 'kichererbsen', name: 'Kichererbsen', amount: '1 Dose' },
	{ id: 'olivenoel', name: 'Olivenöl', staple: true },
	{ id: 'salz', name: 'Salz', staple: true },
	{ id: 'knoblauch', name: 'Knoblauch', staple: true }
];

export default function ShoppingListPage() {
	const [done, setDone] = useState<Set<string>>(new Set());
	const toggle = (id: string) =>
		setDone((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const shopping = items.filter((i) => !i.staple);
	const staples = items.filter((i) => i.staple);
	const open = shopping.filter((i) => !done.has(i.id)).length;

	return (
		<AppShell
			action={
				<Button asChild size="sm" rounded="full" variant="ghost" fontWeight="bold">
					<Link href="/plan">
						<ArrowLeftIcon size={16} /> Wochenplan
					</Link>
				</Button>
			}
		>
			<PageHeader
				eyebrow="Aus eurem Wochenplan"
				title="Einkaufsliste"
				aside={
					<Badge
						colorPalette={open === 0 ? 'green' : 'brand'}
						variant="subtle"
						rounded="full"
						px="3"
						py="1"
						fontSize="sm"
					>
						{open === 0 ? 'Alles da' : `${open} offen`}
					</Badge>
				}
			/>

			<Group title="Einkaufen" items={shopping} done={done} onToggle={toggle} />
			<Group title="Vorrat prüfen" items={staples} done={done} onToggle={toggle} muted />

			{done.size > 0 && (
				<Button mt="6" w="full" variant="ghost" rounded="xl" onClick={() => setDone(new Set())}>
					Häkchen zurücksetzen
				</Button>
			)}
		</AppShell>
	);
}

function Group({
	title,
	items,
	done,
	onToggle,
	muted
}: {
	title: string;
	items: Item[];
	done: Set<string>;
	onToggle: (id: string) => void;
	muted?: boolean;
}) {
	return (
		<section className="mt-6">
			<h2
				className={`mb-2 px-1 text-xs font-bold tracking-widest uppercase ${muted ? 'text-[var(--muted)]' : 'text-[var(--green)]'}`}
			>
				{title}
			</h2>
			<ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
				{items.map((item) => {
					const checked = done.has(item.id);
					return (
						<li key={item.id} className="border-b border-[var(--line)] last:border-b-0">
							<Checkbox.Root
								size="lg"
								colorPalette="brand"
								checked={checked}
								onCheckedChange={() => onToggle(item.id)}
								display="flex"
								alignItems="center"
								gap="3"
								w="full"
								minH="14"
								px="4"
								cursor="pointer"
							>
								<Checkbox.HiddenInput />
								<Checkbox.Control rounded="md" />
								<Checkbox.Label
									flex="1"
									fontWeight="semibold"
									textDecoration={checked ? 'line-through' : 'none'}
									color={checked ? 'var(--muted)' : 'var(--ink)'}
								>
									{item.name}
								</Checkbox.Label>
								<span className="text-sm text-[var(--muted)] tabular-nums">
									{item.amount ?? 'nach Bedarf'}
								</span>
							</Checkbox.Root>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
