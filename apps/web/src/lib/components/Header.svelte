<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		backHref,
		backLabel,
		title,
		userName,
		actions
	}: {
		backHref: string;
		backLabel: string;
		title: string;
		userName: string;
		actions?: Snippet;
	} = $props();
</script>

<header
	class="flex h-14 shrink-0 items-center justify-between border-b border-black/5 bg-surface-1 px-6 dark:border-white/10"
>
	<div class="flex items-center gap-3">
		<a href={backHref} class="text-sm text-secondary no-underline hover:text-primary">
			{backLabel}
		</a>
		<h1 class="m-0 text-xl font-bold text-primary">{title}</h1>
	</div>
	<div class="flex items-center gap-3">
		{#if actions}
			{@render actions()}
		{/if}
		<span class="text-sm text-secondary">{userName}</span>
	</div>
</header>
