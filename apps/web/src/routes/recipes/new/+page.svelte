<script lang="ts">
	import BookScanUpload from '$lib/components/BookScanUpload.svelte';
	import Header from '$lib/components/Header.svelte';
	import {
		card,
		ghostButton,
		input as inputClass,
		label as labelClass,
		primaryButton,
		sectionTitle
	} from '$lib/styles';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	interface IngredientRow {
		quantity: string;
		unit: string;
		name: string;
	}
	interface StepRow {
		description: string;
	}
	interface ExtractedRecipe {
		name: string;
		servings: number;
		prepTimeMinutes?: number;
		notes?: string;
		ingredients: Array<{ quantity: number; unit: string; name: string }>;
		steps: Array<{ description: string }>;
	}

	let name = $state('');
	let servings = $state('1');
	let prepTimeMinutes = $state('');
	let bookTitle = $state('');
	let bookPage = $state('');
	let notes = $state('');
	let ingredients = $state<IngredientRow[]>([{ quantity: '', unit: '', name: '' }]);
	let steps = $state<StepRow[]>([{ description: '' }]);

	function addIngredient() {
		ingredients.push({ quantity: '', unit: '', name: '' });
	}
	function removeIngredient(i: number) {
		if (ingredients.length === 1) return;
		ingredients.splice(i, 1);
	}
	function addStep() {
		steps.push({ description: '' });
	}
	function removeStep(i: number) {
		if (steps.length === 1) return;
		steps.splice(i, 1);
	}

	function onExtracted(extracted: ExtractedRecipe) {
		name = extracted.name;
		servings = String(extracted.servings);
		if (extracted.prepTimeMinutes) prepTimeMinutes = String(extracted.prepTimeMinutes);
		if (extracted.notes) notes = extracted.notes;
		ingredients = extracted.ingredients.map((ing) => ({
			quantity: String(ing.quantity),
			unit: ing.unit,
			name: ing.name
		}));
		steps = extracted.steps.map((s) => ({ description: s.description }));
	}
</script>

<svelte:head>
	<title>Neues Rezept – Foody</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-surface-0">
	<Header backHref="/recipes" backLabel="← Rezepte" title="Neues Rezept" userName={data.user.name} />

	<main class="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
		<BookScanUpload {onExtracted} />

		<form method="post">
			<section class={card}>
				<h2 class={sectionTitle}>Rezept-Details</h2>
				<div class="flex flex-col gap-3">
					<div>
						<label class={labelClass} for="name">Name *</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							bind:value={name}
							placeholder="z.B. Spaghetti Bolognese"
							class={inputClass}
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={labelClass} for="servings">Portionen im Rezept *</label>
							<input
								id="servings"
								name="servings"
								type="number"
								min="1"
								required
								bind:value={servings}
								class={inputClass}
							/>
						</div>
						<div>
							<label class={labelClass} for="prepTimeMinutes">Zubereitungszeit (Min.)</label>
							<input
								id="prepTimeMinutes"
								name="prepTimeMinutes"
								type="number"
								min="1"
								bind:value={prepTimeMinutes}
								class={inputClass}
							/>
						</div>
					</div>
				</div>
			</section>

			<section class={card}>
				<h2 class={sectionTitle}>Quelle (Buch)</h2>
				<div class="grid grid-cols-[2fr_1fr] gap-3">
					<div>
						<label class={labelClass} for="bookTitle">Buchtitel</label>
						<input
							id="bookTitle"
							name="bookTitle"
							type="text"
							bind:value={bookTitle}
							placeholder="z.B. Das große Kochbuch"
							class={inputClass}
						/>
					</div>
					<div>
						<label class={labelClass} for="bookPage">Seite</label>
						<input
							id="bookPage"
							name="bookPage"
							type="number"
							min="1"
							bind:value={bookPage}
							class={inputClass}
						/>
					</div>
				</div>
			</section>

			<section class={card}>
				<h2 class={sectionTitle}>Zutaten</h2>
				<p class="m-0 mb-3 -mt-1 text-xs text-secondary">Werden auf 1 Portion normalisiert gespeichert.</p>
				<div class="flex flex-col gap-2">
					{#each ingredients as ingredient, i (i)}
						<div class="grid grid-cols-[80px_80px_1fr_auto] items-center gap-2">
							<input
								name="ingredients[{i}][quantity]"
								type="number"
								step="any"
								min="0"
								bind:value={ingredient.quantity}
								placeholder="Menge"
								class={inputClass}
							/>
							<input
								name="ingredients[{i}][unit]"
								type="text"
								bind:value={ingredient.unit}
								placeholder="Einheit"
								class={inputClass}
							/>
							<input
								name="ingredients[{i}][name]"
								type="text"
								required
								bind:value={ingredient.name}
								placeholder="Zutat"
								class={inputClass}
							/>
							<button
								type="button"
								disabled={ingredients.length === 1}
								class="flex h-[38px] w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-black/10 text-base text-secondary transition-colors hover:not-disabled:border-danger hover:not-disabled:text-danger disabled:opacity-30 dark:border-white/10"
								onclick={() => removeIngredient(i)}
							>
								×
							</button>
						</div>
					{/each}
				</div>
				<button type="button" class="{ghostButton} mt-2.5" onclick={addIngredient}>
					+ Zutat hinzufügen
				</button>
			</section>

			<section class={card}>
				<h2 class={sectionTitle}>Zubereitung</h2>
				<div class="flex flex-col gap-2">
					{#each steps as step, i (i)}
						<div class="grid grid-cols-[1fr_auto] items-start gap-2">
							<div>
								<label class="mb-1 block text-[11px] text-secondary" for="step-{i}">Schritt {i + 1}</label>
								<textarea
									id="step-{i}"
									name="steps[{i}][description]"
									required
									rows="2"
									bind:value={step.description}
									placeholder="Beschreibung dieses Schritts…"
									class="{inputClass} resize-y font-sans"
								></textarea>
							</div>
							<button
								type="button"
								disabled={steps.length === 1}
								class="mt-5.5 flex h-[38px] w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-black/10 text-base text-secondary transition-colors hover:not-disabled:border-danger hover:not-disabled:text-danger disabled:opacity-30 dark:border-white/10"
								onclick={() => removeStep(i)}
							>
								×
							</button>
						</div>
					{/each}
				</div>
				<button type="button" class="{ghostButton} mt-2.5" onclick={addStep}>
					+ Schritt hinzufügen
				</button>
			</section>

			<section class={card}>
				<h2 class={sectionTitle}>Notizen</h2>
				<textarea
					name="notes"
					rows="3"
					bind:value={notes}
					placeholder="Tipps, Variationen, Hinweise…"
					class="{inputClass} resize-y font-sans"
				></textarea>
			</section>

			{#if form?.error}
				<p class="mb-4 text-sm text-danger">⚠ {form.error}</p>
			{/if}

			<div class="flex justify-end gap-3 pt-2">
				<a href="/recipes" class={ghostButton}>Abbrechen</a>
				<button type="submit" class={primaryButton}>Rezept speichern</button>
			</div>
		</form>
	</main>
</div>
