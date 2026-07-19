<script lang="ts">
	import { Dialog } from '@ark-ui/svelte';
	import { dangerButton, ghostButton } from '$lib/styles';

	let {
		open = $bindable(false),
		recipeName,
		onConfirm
	}: { open?: boolean; recipeName: string; onConfirm: () => void } = $props();
</script>

<Dialog.Root {open} onOpenChange={(details) => (open = details.open)}>
	<Dialog.Backdrop class="fixed inset-0 bg-black/40" />
	<Dialog.Positioner class="fixed inset-0 z-10 flex items-center justify-center p-4">
		<Dialog.Content class="w-full max-w-sm rounded-2xl bg-surface-1 p-6 shadow-card">
			<Dialog.Title class="m-0 text-base font-semibold text-danger">Rezept löschen</Dialog.Title>
			<Dialog.Description class="mt-2 text-sm leading-relaxed text-secondary">
				„{recipeName}" und alle Zutaten und Schritte werden dauerhaft gelöscht. Diese Aktion kann
				nicht rückgängig gemacht werden.
			</Dialog.Description>
			<div class="mt-6 flex justify-end gap-3">
				<Dialog.CloseTrigger class="{ghostButton} cursor-pointer">Abbrechen</Dialog.CloseTrigger>
				<button type="button" class="{dangerButton} cursor-pointer" onclick={onConfirm}>
					Ja, endgültig löschen
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Positioner>
</Dialog.Root>
