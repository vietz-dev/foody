'use client';
import { useState } from 'react';
import { Checkbox } from '@chakra-ui/react';
import type { ShoppingListItem } from '@foody/contracts';

// Häkchen leben nur im Browser-State: die Liste wird aus dem Plan berechnet, nicht gespeichert.
export function ShoppingGroup({
	title,
	items,
	muted,
	showRecipeCount
}: {
	title: string;
	items: ShoppingListItem[];
	muted?: boolean;
	showRecipeCount?: boolean;
}) {
	const format = showRecipeCount ? formatRecipeCount : formatQuantities;
	const [done, setDone] = useState<Set<string>>(new Set());
	if (items.length === 0) return null;
	const toggle = (key: string) =>
		setDone((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});

	return (
		<section className="mt-6">
			<h2
				className={`mb-2 px-1 text-xs font-bold tracking-widest uppercase ${muted ? 'text-[var(--muted)]' : 'text-[var(--green)]'}`}
			>
				{title}
			</h2>
			<ul className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
				{items.map((item) => {
					const key = item.ingredientId ?? item.name;
					const checked = done.has(key);
					return (
						<li key={key} className="border-b border-[var(--line)] last:border-b-0">
							<Checkbox.Root
								size="lg"
								colorPalette="brand"
								checked={checked}
								onCheckedChange={() => toggle(key)}
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
								<span className="text-sm text-[var(--muted)] tabular-nums">{format(item)}</span>
							</Checkbox.Root>
						</li>
					);
				})}
			</ul>
		</section>
	);
}

function formatQuantities(item: ShoppingListItem) {
	const parts = item.quantities.map((q) => `${formatAmount(q.amount)} ${q.unit}`.trim());
	if (item.unquantified) parts.push('nach Bedarf');
	return parts.join(' · ');
}

const formatRecipeCount = (item: ShoppingListItem) =>
	`für ${item.recipeCount} ${item.recipeCount === 1 ? 'Rezept' : 'Rezepte'}`;

const formatAmount = (n: number) =>
	Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
