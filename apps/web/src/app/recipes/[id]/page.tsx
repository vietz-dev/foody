import { notFound } from 'next/navigation';
import { AppShell, PageHeader } from '../../../components/app-shell';
import { BookIcon, ClockIcon } from '../../../components/icons';
import { api } from '@/lib/server/api';
import { requireUser } from '@/lib/server/session';
import { BackToRecipesLink } from '../back-to-recipes-link';
import { Ingredients } from './ingredients';

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
	await requireUser();
	const { id } = await params;
	const recipe = await api.recipes.get({ id });
	if (!recipe) notFound();

	return (
		<AppShell action={<BackToRecipesLink />}>
			<PageHeader eyebrow="Rezept" title={recipe.name} />

			<div className="flex flex-wrap gap-2">
				{recipe.bookTitle && (
					<Chip icon={<BookIcon size={14} />}>
						{recipe.bookTitle}
						{recipe.bookPage ? `, S. ${recipe.bookPage}` : ''}
					</Chip>
				)}
				{recipe.prepTimeMinutes && (
					<Chip icon={<ClockIcon size={14} />}>{recipe.prepTimeMinutes} Min</Chip>
				)}
			</div>

			{recipe.notes && (
				<p className="mt-4 rounded-2xl bg-[#e8f4eb] p-4 text-sm leading-6 text-[var(--ink)]">
					{recipe.notes}
				</p>
			)}

			<Ingredients
				ingredients={recipe.ingredients}
				initialPortions={recipe.declaredServings ?? 2}
			/>

			<section className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--line)] sm:p-5">
				<h2 className="text-xs font-bold tracking-widest text-[var(--green)] uppercase">
					Zubereitung
				</h2>
				<ol className="mt-3 flex flex-col gap-4">
					{recipe.steps.map((s, i) => (
						<li key={s.id} className="flex items-start gap-3">
							<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--green)] text-xs font-bold text-white">
								{i + 1}
							</span>
							<p className="pt-1 text-sm leading-6">{s.description}</p>
						</li>
					))}
				</ol>
			</section>
		</AppShell>
	);
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)] ring-1 ring-[var(--line)]">
			{icon}
			{children}
		</span>
	);
}
