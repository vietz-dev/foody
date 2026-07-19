<script lang="ts">
	import { NumberInput } from '@ark-ui/svelte';

	let {
		value = $bindable(1),
		min = 1,
		onchange
	}: { value?: number; min?: number; onchange?: (value: number) => void } = $props();
</script>

<NumberInput.Root
	value={String(value)}
	{min}
	onValueChange={(details) => {
		value = details.valueAsNumber || min;
		onchange?.(value);
	}}
	class="inline-flex items-center gap-3"
>
	<NumberInput.DecrementTrigger
		class="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-secondary text-lg text-primary transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
	>
		−
	</NumberInput.DecrementTrigger>
	<NumberInput.Input
		class="w-8 border-0 bg-transparent text-center text-lg font-bold text-primary outline-none"
	/>
	<NumberInput.IncrementTrigger
		class="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-secondary text-lg text-primary transition-colors hover:border-brand hover:text-brand"
	>
		+
	</NumberInput.IncrementTrigger>
</NumberInput.Root>
