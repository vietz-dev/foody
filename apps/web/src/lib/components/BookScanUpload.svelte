<script lang="ts">
	import { FileUpload } from '@ark-ui/svelte';
	import { card, ghostButton, primaryButton, sectionTitle } from '$lib/styles';

	interface ExtractedRecipe {
		name: string;
		servings: number;
		prepTimeMinutes?: number;
		notes?: string;
		ingredients: Array<{ quantity: number; unit: string; name: string }>;
		steps: Array<{ description: string }>;
	}

	let { onExtracted }: { onExtracted: (data: ExtractedRecipe) => void } = $props();

	let acceptedFiles = $state<File[]>([]);
	let scanning = $state(false);
	let errorMessage = $state('');

	async function scan() {
		if (acceptedFiles.length === 0) {
			errorMessage = 'Bitte zuerst Fotos auswählen.';
			return;
		}
		scanning = true;
		errorMessage = '';

		const formData = new FormData();
		for (const file of acceptedFiles) {
			formData.append('images', file);
		}

		try {
			const res = await fetch('/recipes/scan', { method: 'POST', body: formData });
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				throw new Error(`Fehler ${res.status}${text ? ': ' + text : ''}`);
			}
			const data: ExtractedRecipe = await res.json();
			onExtracted(data);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			scanning = false;
		}
	}
</script>

<section class={card}>
	<h2 class={sectionTitle}>📖 Aus Buch scannen (optional)</h2>
	<p class="m-0 mb-4 text-[13px] text-secondary">
		Lade Fotos der Zutaten- und Schritte-Seiten hoch. Claude extrahiert das Rezept automatisch.
	</p>

	<FileUpload.Root accept="image/*" bind:acceptedFiles maxFiles={10} class="flex flex-col gap-3">
		<FileUpload.Dropzone
			class="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-black/15 px-4 py-6 text-center text-sm text-secondary transition-colors hover:border-brand dark:border-white/15"
		>
			<span>Fotos hierher ziehen oder</span>
			<FileUpload.Trigger class="{ghostButton} cursor-pointer">Dateien auswählen</FileUpload.Trigger>
		</FileUpload.Dropzone>
		<FileUpload.HiddenInput />

		{#if acceptedFiles.length > 0}
			<FileUpload.ItemGroup class="flex flex-col gap-1.5">
				{#each acceptedFiles as file (file.name + file.size)}
					<FileUpload.Item
						{file}
						class="flex items-center justify-between rounded-lg bg-surface-0 px-3 py-1.5 text-[13px] text-primary"
					>
						<FileUpload.ItemName class="truncate" />
						<FileUpload.ItemDeleteTrigger
							class="ml-2 shrink-0 cursor-pointer border-0 bg-transparent text-secondary hover:text-danger"
						>
							×
						</FileUpload.ItemDeleteTrigger>
					</FileUpload.Item>
				{/each}
			</FileUpload.ItemGroup>
		{/if}
	</FileUpload.Root>

	<button type="button" disabled={scanning} class="{primaryButton} mt-3" onclick={scan}>
		{scanning ? 'Scannt…' : 'Rezept scannen'}
	</button>

	{#if errorMessage}
		<p class="mt-2 text-[13px] text-danger">⚠ {errorMessage}</p>
	{/if}
</section>
