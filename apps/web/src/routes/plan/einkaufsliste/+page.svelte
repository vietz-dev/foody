<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { card, sectionTitle } from '$lib/styles';
	import type { PageProps } from './$types';
	import type { ShoppingLineItem } from '$lib/server/shopping-list/get-shopping-list';

	let { data }: PageProps = $props();

	const list = $derived(data.list);
	const isEmpty = $derived(
		list.einkaufen.length === 0 && list.vorrat.length === 0 && list.nichtZugeordnet.length === 0
	);

	function formatQuantities(item: ShoppingLineItem): string {
		const parts = item.quantities.map((q) => `${q.amount} ${q.unit}`.trim());
		if (item.unquantified) parts.push('nach Bedarf');
		return parts.join(' · ');
	}
</script>

<svelte:head>
	<title>Einkaufsliste – Foody</title>
</svelte:head>

<div class="bg-surface-0 flex min-h-screen flex-col">
	<Header
		backHref="/plan"
		backLabel="← Wochenplan"
		title="Einkaufsliste"
		userName={data.user.name}
	/>

	<main class="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
		{#if isEmpty}
			<div class="text-secondary py-12 text-center text-sm">
				Keine Rezepte für diese Woche ausgewählt.
				<br />
				<a href="/plan" class="text-brand no-underline">Zurück zum Wochenplan</a>
			</div>
		{:else}
			{#if list.einkaufen.length > 0}
				<section class={card}>
					<h2 class={sectionTitle}>Einkaufen</h2>
					<ul class="m-0 flex list-none flex-col gap-2 p-0">
						{#each list.einkaufen as item (item.ingredientId)}
							<li class="text-primary flex items-center justify-between gap-3 text-sm">
								<span>{item.name}</span>
								<span class="text-secondary shrink-0">{formatQuantities(item)}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if list.vorrat.length > 0}
				<section class={card}>
					<h2 class={sectionTitle}>Vorrat</h2>
					<ul class="m-0 flex list-none flex-col gap-2 p-0">
						{#each list.vorrat as item (item.ingredientId)}
							<li class="text-primary flex items-center justify-between gap-3 text-sm">
								<span>{item.name}</span>
								<span class="text-secondary shrink-0">
									für {item.recipeCount}
									{item.recipeCount === 1 ? 'Rezept' : 'Rezepte'}
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if list.nichtZugeordnet.length > 0}
				<section class={card}>
					<h2 class={sectionTitle}>Nicht zugeordnet</h2>
					<p class="text-secondary mb-3 text-[13px]">
						Diese Zutaten sind noch keinem Katalog-Eintrag zugeordnet. <a
							href="/katalog"
							class="text-brand no-underline">Im Katalog zuordnen</a
						>
					</p>
					<ul class="m-0 flex list-none flex-col gap-2 p-0">
						{#each list.nichtZugeordnet as item (`raw:${item.name}`)}
							<li class="text-primary flex items-center justify-between gap-3 text-sm">
								<span>{item.name}</span>
								<span class="text-secondary shrink-0">{formatQuantities(item)}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/if}
	</main>
</div>
