<script lang="ts">
	import { Checkbox } from '@ark-ui/svelte';
	import PortionStepper from './PortionStepper.svelte';

	interface RecipeWithPlan {
		id: string;
		name: string;
		planned: boolean;
		prepTimeMinutes: number | null;
		portions?: number;
		declaredServings?: number | null;
	}

	let {
		recipe,
		pending = false,
		ontoggle,
		onportionschange
	}: {
		recipe: RecipeWithPlan;
		pending?: boolean;
		ontoggle: () => void;
		onportionschange?: (portions: number) => void;
	} = $props();

	let portions = $derived(recipe.portions ?? 2);

	let standardServings = $derived(recipe.declaredServings ?? 2);
</script>

<li class="flex items-center gap-3 rounded-[10px] bg-surface-1 px-3 py-2.5" class:opacity-60={pending}>
	<Checkbox.Root
		checked={recipe.planned}
		disabled={pending}
		onCheckedChange={() => ontoggle()}
		class="inline-flex shrink-0"
	>
		<Checkbox.Control
			class="flex h-[22px] w-[22px] items-center justify-center rounded-md outline-[1.5px] transition-colors {recipe.planned
				? 'bg-brand outline-brand'
				: 'bg-surface-0 outline-black/15 hover:outline-brand dark:outline-white/20'}"
		>
			<Checkbox.Indicator class="text-[13px] leading-none font-bold text-white">✓</Checkbox.Indicator>
		</Checkbox.Control>
		<Checkbox.HiddenInput
			aria-label={recipe.planned ? 'Aus Wochenplan entfernen' : 'Zum Wochenplan hinzufügen'}
		/>
	</Checkbox.Root>

	<a href="/recipes/{recipe.id}" class="min-w-0 flex-1 text-inherit no-underline">
		<span
			class="block overflow-hidden text-ellipsis whitespace-nowrap text-[15px] text-primary"
			class:font-semibold={recipe.planned}
		>
			{recipe.name}
		</span>
		{#if recipe.prepTimeMinutes}
			<span class="text-xs text-secondary">⏱ {recipe.prepTimeMinutes} Min.</span>
		{/if}
	</a>

	{#if recipe.planned}
		<div class="flex shrink-0 flex-col items-end gap-0.5">
			<PortionStepper bind:value={portions} min={1} onchange={(value) => onportionschange?.(value)} />
			<span class="text-[11px] text-secondary">Standard: {standardServings}</span>
		</div>
	{/if}
</li>
