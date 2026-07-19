<script lang="ts">
	import { enhance } from '$app/forms';
	import Header from '$lib/components/Header.svelte';
	import { card, primaryButton, sectionTitle } from '$lib/styles';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin – Foody</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-surface-0">
	<Header backHref="/recipes" backLabel="← Rezepte" title="Admin" userName={data.user.name} />

	<main class="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
		<section class={card}>
			<h2 class={sectionTitle}>Backfill der Altdaten</h2>
			<p class="m-0 mb-4 text-[13px] text-secondary">
				Verknüpft alte Rezept-Zutaten (vor Einführung des Katalogs) mit dem Zutaten-Katalog.
				Unbekannte Namen landen als offene Einträge im Katalog zur Review. Der Vorgang ist
				gefahrlos wiederholbar.
			</p>

			<form
				method="POST"
				action="?/backfill"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<button type="submit" class={primaryButton} disabled={submitting}>
					{submitting ? 'Scanne …' : 'Backfill scannen'}
				</button>
			</form>

			{#if form?.success}
				<p class="mt-4 text-[13px] text-primary">
					{form.linkedCount} Zutaten verknüpft, {form.pendingCount} warten auf Review
					{#if form.pendingCount > 0}
						<a href="/katalog" class="text-brand no-underline">→ Zum Katalog</a>
					{/if}
				</p>
			{:else if data.pendingCount > 0}
				<p class="mt-4 text-[13px] text-secondary">
					Aktuell {data.pendingCount} offene Katalog-Einträge.
					<a href="/katalog" class="text-brand no-underline">→ Zum Katalog</a>
				</p>
			{/if}
		</section>

		<section>
			<h2 class={sectionTitle}>
				Rezepte mit Standard-Portionszahl ({data.defaultServingRecipes.length})
			</h2>
			{#if data.defaultServingRecipes.length === 0}
				<p class="m-0 text-[13px] text-secondary">Keine Rezepte zur Kontrolle.</p>
			{:else}
				<ul class="m-0 flex list-none flex-col gap-2 p-0">
					{#each data.defaultServingRecipes as recipe (recipe.id)}
						<li class="flex items-center justify-between rounded-lg bg-surface-1 px-4 py-3">
							<div class="flex flex-col">
								<span class="text-sm text-primary">{recipe.name}</span>
								<span class="text-[13px] text-secondary">
									Portionen: {recipe.declaredServings ?? 'unbekannt'}
								</span>
							</div>
							<a href="/recipes/{recipe.id}/edit" class="text-sm text-brand no-underline">
								Bearbeiten
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</main>
</div>
