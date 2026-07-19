<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import { primaryButton } from '$lib/styles';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Rezepte – Foody</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-surface-0">
	<Header backHref="/" backLabel="← Foody" title="Rezepte" userName={data.user.name}>
		{#snippet actions()}
			<a href="/recipes/new" class={primaryButton}>+ Neues Rezept</a>
		{/snippet}
	</Header>

	<main class="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
		{#if data.recipes.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<p class="m-0 mb-4 text-[15px] text-secondary">Noch keine Rezepte vorhanden.</p>
				<a href="/recipes/new" class={primaryButton}>Erstes Rezept hinzufügen</a>
			</div>
		{:else}
			<div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
				{#each data.recipes as recipe (recipe.id)}
					<RecipeCard {recipe} />
				{/each}
			</div>
		{/if}
	</main>
</div>
