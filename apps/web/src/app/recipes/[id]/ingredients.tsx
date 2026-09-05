'use client';
import { useState } from 'react';
import { PortionStepper } from '../../../components/portion-stepper';
import type { RecipeDetails } from '@foody/contracts';

function formatQuantity(quantity: number | null, portions: number) {
	if (quantity == null) return '';
	const scaled = quantity * portions;
	return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
}

export function Ingredients({
	ingredients,
	initialPortions
}: {
	ingredients: RecipeDetails['ingredients'];
	initialPortions: number;
}) {
	const [portions, setPortions] = useState(initialPortions);
	return (
		<section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--line)] sm:p-5">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-xs font-bold tracking-widest text-[var(--green)] uppercase">Zutaten</h2>
				<div className="flex items-center gap-2 text-sm text-[var(--muted)]">
					Portionen
					<PortionStepper value={portions} onChange={setPortions} />
				</div>
			</div>
			<ul className="mt-3 divide-y divide-[var(--line)]">
				{ingredients.map((i) => (
					<li key={i.id} className="flex items-baseline gap-3 py-2 text-sm">
						<span className="w-12 shrink-0 text-right font-bold text-[var(--green)] tabular-nums">
							{formatQuantity(i.quantity, portions)}
						</span>
						<span className="w-8 shrink-0 text-[var(--muted)]">{i.unit ?? ''}</span>
						<span className="font-medium">{i.name}</span>
					</li>
				))}
			</ul>
		</section>
	);
}
