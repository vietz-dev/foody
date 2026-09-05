'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Checkbox } from '@chakra-ui/react';
import type { PicnicProductRef, ShoppingListItem } from '@foody/contracts';
import { PortionStepper } from '../../../components/portion-stepper';
import { mapPicnicProduct, pushToPicnic } from './actions';
import { PicnicPicker } from './picnic-picker';

type PicnicMode = { connected: boolean };

// Häkchen leben nur im Browser-State: die Liste wird aus dem Plan berechnet, nicht gespeichert.
export function ShoppingGroup({
	title,
	items,
	muted,
	showRecipeCount,
	picnic
}: {
	title: string;
	items: ShoppingListItem[];
	muted?: boolean;
	showRecipeCount?: boolean;
	/** Set on the "Einkaufen" group: shows Picnic mapping and the push button. */
	picnic?: PicnicMode;
}) {
	const format = showRecipeCount ? formatRecipeCount : formatQuantities;
	const [done, setDone] = useState<Set<string>>(new Set());
	const [counts, setCounts] = useState<Record<string, number>>({});
	const [picking, setPicking] = useState<ShoppingListItem | null>(null);
	const [pushing, setPushing] = useState(false);
	const [notice, setNotice] = useState('');
	if (items.length === 0) return null;
	const toggle = (key: string) =>
		setDone((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});

	const countFor = (item: ShoppingListItem) =>
		counts[item.ingredientId ?? ''] ?? item.picnic?.count ?? 1;
	const mapped = items.filter((item) => item.picnic && !done.has(item.ingredientId ?? item.name));
	const unmapped = items.length - items.filter((item) => item.picnic).length;

	const push = async () => {
		setPushing(true);
		setNotice('');
		try {
			const result = await pushToPicnic(
				mapped.map((item) => ({ productId: item.picnic!.id, count: countFor(item) }))
			);
			setNotice(
				result.added === 0
					? 'Alles schon im Warenkorb.'
					: `${result.added} Artikel hinzugefügt – ${result.cartCount} im Picnic-Warenkorb.`
			);
		} catch (e) {
			setNotice(e instanceof Error ? e.message : 'Übertragen fehlgeschlagen');
		} finally {
			setPushing(false);
		}
	};

	const pick = async (item: ShoppingListItem, product: PicnicProductRef | null) => {
		setPicking(null);
		if (item.ingredientId) await mapPicnicProduct(item.ingredientId, product);
	};

	return (
		<section className="mt-6">
			<div className="mb-2 flex items-center justify-between px-1">
				<h2
					className={`text-xs font-bold tracking-widest uppercase ${muted ? 'text-[var(--muted)]' : 'text-[var(--green)]'}`}
				>
					{title}
				</h2>
				{picnic?.connected && (
					<Button
						size="sm"
						rounded="full"
						colorPalette="brand"
						fontWeight="bold"
						loading={pushing}
						disabled={mapped.length === 0}
						onClick={push}
					>
						In Picnic-Warenkorb ({mapped.length})
					</Button>
				)}
			</div>
			{picnic && !picnic.connected && (
				<p className="mb-2 px-1 text-xs text-[var(--muted)]">
					<Link href="/settings" className="font-bold text-[var(--green)]">
						Picnic verbinden
					</Link>
					, um die Liste in den Warenkorb zu legen.
				</p>
			)}
			{picnic?.connected && unmapped > 0 && (
				<p className="mb-2 px-1 text-xs text-[var(--muted)]">
					{unmapped} {unmapped === 1 ? 'Zutat' : 'Zutaten'} ohne Picnic-Produkt – die besorgt ihr
					manuell.
				</p>
			)}
			{notice && <p className="mb-2 px-1 text-sm font-semibold">{notice}</p>}
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
							{picnic?.connected && item.ingredientId && (
								<div className="flex items-center gap-2 px-4 pb-2.5 pl-[3.25rem]">
									<button
										type="button"
										onClick={() => setPicking(item)}
										className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-[var(--green)]"
									>
										{item.picnic
											? `${item.picnic.name} · ${item.picnic.unitQuantity}`
											: '+ Picnic-Produkt wählen'}
									</button>
									{item.picnic && !checked && (
										<PortionStepper
											value={countFor(item)}
											onChange={(v) => setCounts((c) => ({ ...c, [item.ingredientId!]: v }))}
										/>
									)}
								</div>
							)}
						</li>
					);
				})}
			</ul>
			{picking && (
				<PicnicPicker
					ingredientName={picking.name}
					current={picking.picnic}
					onPick={(product) => pick(picking, product)}
					onClose={() => setPicking(null)}
				/>
			)}
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
