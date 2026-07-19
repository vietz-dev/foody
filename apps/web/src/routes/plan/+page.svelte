<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import WeeklyPlanRow from '$lib/components/WeeklyPlanRow.svelte';
	import { input as inputClass } from '$lib/styles';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	interface PlanItem {
		id: string;
		name: string;
		planned: boolean;
		plannedAt: Date | null;
		prepTimeMinutes: number | null;
		portions: number;
		declaredServings: number | null;
	}

	let items = $state<PlanItem[]>(data.recipes.map((r) => ({ ...r })));
	let search = $state('');
	let pending = $state(new Set<string>());

	async function toggle(recipeId: string) {
		if (pending.has(recipeId)) return;
		const item = items.find((r) => r.id === recipeId);
		if (!item) return;

		pending.add(recipeId);
		item.planned = !item.planned;
		item.plannedAt = item.planned ? new Date() : null;

		try {
			const res = await fetch(`/plan/${recipeId}/toggle`, { method: 'POST' });
			if (res.ok) {
				const result = (await res.json()) as { selected: boolean };
				item.planned = result.selected;
				if (!result.selected) item.plannedAt = null;
			} else {
				item.planned = !item.planned;
				item.plannedAt = item.planned ? new Date() : null;
			}
		} catch {
			item.planned = !item.planned;
			item.plannedAt = item.planned ? new Date() : null;
		} finally {
			pending.delete(recipeId);
		}
	}

	async function setPortions(recipeId: string, portions: number) {
		const item = items.find((r) => r.id === recipeId);
		if (!item) return;

		const previous = item.portions;
		item.portions = portions;

		try {
			const res = await fetch(`/plan/${recipeId}/portions`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ portions })
			});
			if (!res.ok) {
				item.portions = previous;
			}
		} catch {
			item.portions = previous;
		}
	}

	let filtered = $derived(
		search.trim()
			? items.filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
			: items
	);
	let planned = $derived(
		filtered
			.filter((r) => r.planned)
			.sort((a, b) => (b.plannedAt?.getTime() ?? 0) - (a.plannedAt?.getTime() ?? 0))
	);
	let unplanned = $derived(filtered.filter((r) => !r.planned));
</script>

<svelte:head>
	<title>Wochenplan – Foody</title>
</svelte:head>

<div class="bg-surface-0 flex min-h-screen flex-col">
	<Header backHref="/" backLabel="← Foody" title="Wochenplan" userName={data.user.name}>
		{#snippet actions()}
			<a href="/plan/einkaufsliste" class="text-secondary hover:text-primary text-sm no-underline"
				>Einkaufsliste</a
			>
			<a href="/recipes" class="text-secondary hover:text-primary text-sm no-underline">Rezepte</a>
		{/snippet}
	</Header>

	<main class="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
		<div class="mb-6">
			<input
				type="search"
				placeholder="Rezept suchen …"
				bind:value={search}
				class="{inputClass} max-w-[360px]"
			/>
		</div>

		{#if planned.length > 0}
			<section class="mb-8">
				<h2
					class="text-secondary m-0 mb-3 flex items-center gap-2 text-[13px] font-semibold tracking-wide uppercase"
				>
					Diese Woche
					<span
						class="bg-brand inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
					>
						{planned.length}
					</span>
				</h2>
				<ul class="m-0 flex list-none flex-col gap-2 p-0">
					{#each planned as recipe (recipe.id)}
						<WeeklyPlanRow
							{recipe}
							pending={pending.has(recipe.id)}
							ontoggle={() => toggle(recipe.id)}
							onportionschange={(portions) => setPortions(recipe.id, portions)}
						/>
					{/each}
				</ul>
			</section>
		{/if}

		{#if planned.length > 0 && unplanned.length > 0}
			<div class="mb-6 border-t border-black/10 dark:border-white/10"></div>
		{/if}

		{#if unplanned.length > 0}
			<section>
				<h2 class="text-secondary m-0 mb-3 text-[13px] font-semibold tracking-wide uppercase">
					{planned.length > 0 ? 'Weitere Rezepte' : 'Alle Rezepte'}
				</h2>
				<ul class="m-0 flex list-none flex-col gap-2 p-0">
					{#each unplanned as recipe (recipe.id)}
						<WeeklyPlanRow
							{recipe}
							pending={pending.has(recipe.id)}
							ontoggle={() => toggle(recipe.id)}
							onportionschange={(portions) => setPortions(recipe.id, portions)}
						/>
					{/each}
				</ul>
			</section>
		{/if}

		{#if filtered.length === 0}
			<div class="text-secondary py-12 text-center text-sm">
				{#if items.length === 0}
					Noch keine Rezepte vorhanden. <a href="/recipes/new" class="text-brand no-underline"
						>Erstes Rezept hinzufügen</a
					>
				{:else}
					Kein Rezept gefunden.
				{/if}
			</div>
		{/if}
	</main>
</div>
