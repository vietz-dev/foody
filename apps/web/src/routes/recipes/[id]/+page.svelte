<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import PortionStepper from '$lib/components/PortionStepper.svelte';
	import { ghostButton, primaryButton } from '$lib/styles';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let portionCount = $state(1);

	function formatQuantity(quantity: number | null) {
		if (quantity == null) return '';
		const scaled = quantity * portionCount;
		return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '');
	}
</script>

<svelte:head>
	<title>{data.recipe.name} – Foody</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-surface-0">
	<Header
		backHref="/recipes"
		backLabel="← Rezepte"
		title={data.recipe.name}
		userName={data.user.name}
	>
		{#snippet actions()}
			<a href="/recipes/{data.recipe.id}/edit" class={primaryButton}>Bearbeiten</a>
		{/snippet}
	</Header>

	<main class="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
		<div class="mb-4 rounded-xl bg-surface-1 p-5">
			<div class="flex flex-wrap items-center gap-4">
				{#if data.recipe.sourceType === 'book' && data.recipe.bookTitle}
					<span class="rounded-full bg-surface-0 px-2.5 py-1 text-[13px] text-secondary">
						📖 {data.recipe.bookTitle}{data.recipe.bookPage ? `, S. ${data.recipe.bookPage}` : ''}
					</span>
				{/if}
				{#if data.recipe.prepTimeMinutes}
					<span class="rounded-full bg-surface-0 px-2.5 py-1 text-[13px] text-secondary">
						⏱ {data.recipe.prepTimeMinutes} Min.
					</span>
				{/if}
				{#if data.recipe.notes}
					<p class="m-0 mt-3 w-full text-sm leading-relaxed text-secondary">{data.recipe.notes}</p>
				{/if}
			</div>
		</div>

		<div class="mb-4 flex items-center gap-4 rounded-xl bg-surface-1 p-4">
			<span class="text-sm font-medium text-primary">Portionen:</span>
			<PortionStepper bind:value={portionCount} />
		</div>

		{#if data.recipe.ingredients.length > 0}
			<section class="mb-4 rounded-xl bg-surface-1 p-5">
				<h2 class="m-0 mb-4 text-[15px] font-semibold text-primary">Zutaten</h2>
				<ul class="m-0 flex list-none flex-col gap-2 p-0">
					{#each data.recipe.ingredients as ingredient (ingredient.id)}
						<li
							class="flex items-baseline gap-2 border-b border-black/5 py-1.5 text-sm dark:border-white/5"
						>
							<span class="min-w-10 text-right font-semibold text-brand">
								{formatQuantity(ingredient.quantity)}
							</span>
							<span class="min-w-8 text-secondary">{ingredient.unit}</span>
							<span class="text-primary">{ingredient.name}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if data.recipe.steps.length > 0}
			<section class="mb-4 rounded-xl bg-surface-1 p-5">
				<h2 class="m-0 mb-4 text-[15px] font-semibold text-primary">Zubereitung</h2>
				<ol class="m-0 flex list-none flex-col gap-4 p-0">
					{#each data.recipe.steps as step, i (step.id)}
						<li class="flex items-start gap-4">
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white"
							>
								{i + 1}
							</span>
							<p class="m-0 pt-1 text-sm leading-relaxed text-primary">{step.description}</p>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		<div class="flex justify-end">
			<a href="/recipes" class={ghostButton}>← Alle Rezepte</a>
		</div>
	</main>
</div>
