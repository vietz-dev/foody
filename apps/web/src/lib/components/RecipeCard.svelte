<script lang="ts">
	interface RecipeSummary {
		id: string;
		name: string;
		sourceType: string;
		bookTitle: string | null;
		bookPage: number | null;
		prepTimeMinutes: number | null;
	}

	let { recipe }: { recipe: RecipeSummary } = $props();

	let sourceIcon = $derived(
		recipe.sourceType === 'book' ? '📖' : recipe.sourceType === 'video' ? '▶' : '🌐'
	);
	let sourceLabel = $derived(
		recipe.sourceType === 'book'
			? recipe.bookTitle
				? `${recipe.bookTitle}${recipe.bookPage ? `, S. ${recipe.bookPage}` : ''}`
				: 'Buch'
			: recipe.sourceType === 'video'
				? 'Video'
				: 'Webseite'
	);
</script>

<a
	href="/recipes/{recipe.id}"
	class="block rounded-xl border-[1.5px] border-transparent bg-surface-1 p-5 no-underline transition-[border-color,box-shadow] hover:border-brand hover:shadow-[0_2px_8px_rgba(16,185,129,0.12)]"
>
	<h2 class="m-0 mb-2 text-base leading-tight font-semibold text-primary">{recipe.name}</h2>
	<p class="m-0 flex items-center gap-1.5 text-sm text-secondary">
		<span>{sourceIcon}</span>
		<span>{sourceLabel}</span>
	</p>
	{#if recipe.prepTimeMinutes}
		<p class="m-0 mt-1.5 text-sm text-secondary">⏱ {recipe.prepTimeMinutes} Min.</p>
	{/if}
</a>
