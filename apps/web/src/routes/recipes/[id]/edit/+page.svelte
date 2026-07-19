<script lang="ts">
	import DeleteRecipeDialog from '$lib/components/DeleteRecipeDialog.svelte';
	import Header from '$lib/components/Header.svelte';
	import {
		card,
		dangerButton,
		ghostButton,
		input as inputClass,
		label as labelClass,
		primaryButton,
		sectionTitle
	} from '$lib/styles';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	interface IngredientRow {
		quantity: string;
		unit: string;
		name: string;
	}
	interface StepRow {
		description: string;
	}

	let ingredients = $state<IngredientRow[]>(
		data.recipe.ingredients.map((ing) => ({
			quantity: ing.quantity != null ? String(ing.quantity) : '',
			unit: ing.unit ?? '',
			name: ing.name
		}))
	);
	let steps = $state<StepRow[]>(data.recipe.steps.map((s) => ({ description: s.description })));
	let deleteDialogOpen = $state(false);
	let deleteFormEl: HTMLFormElement | undefined = $state();

	const removeButton =
		'flex h-[38px] w-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-black/10 text-base text-secondary transition-colors hover:not-disabled:border-danger hover:not-disabled:text-danger disabled:opacity-30 dark:border-white/10';

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
</script>

<svelte:head>
	<title>{data.recipe.name} bearbeiten – Foody</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-surface-0">
	<Header
		backHref="/recipes/{data.recipe.id}"
		backLabel="← {data.recipe.name}"
		title="Bearbeiten"
		userName={data.user.name}
	/>

	<main class="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
		<form method="post" action="?/update">
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
							value={data.recipe.name}
							class={inputClass}
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={labelClass} for="servings">Portionen *</label>
							<input
								id="servings"
								name="servings"
								type="number"
								min="1"
								required
								value={1}
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
								value={data.recipe.prepTimeMinutes ?? ''}
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
							value={data.recipe.bookTitle ?? ''}
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
							value={data.recipe.bookPage ?? ''}
							class={inputClass}
						/>
					</div>
				</div>
			</section>

			<section class={card}>
				<h2 class={sectionTitle}>Zutaten</h2>
				<p class="m-0 mb-3 -mt-1 text-xs text-secondary">
					Mengen pro Portion. Beim Speichern durch „Portionen" dividiert.
				</p>
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
								class={removeButton}
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
								<label class="mb-1 block text-[11px] text-secondary" for="step-{i}">
									Schritt {i + 1}
								</label>
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
								class="{removeButton} mt-5.5"
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
					value={data.recipe.notes ?? ''}
					placeholder="Tipps, Variationen, Hinweise…"
					class="{inputClass} resize-y font-sans"
				></textarea>
			</section>

			<div class="flex justify-end gap-3 pt-2">
				<a href="/recipes/{data.recipe.id}" class={ghostButton}>Abbrechen</a>
				<button type="submit" class={primaryButton}>Änderungen speichern</button>
			</div>
		</form>

		<section class="{card} mt-8 border-t-2 border-danger/20">
			<h2 class="m-0 mb-2 text-[15px] font-semibold text-danger">Rezept löschen</h2>
			<p class="m-0 mb-4 text-[13px] text-secondary">
				Das Rezept und alle seine Zutaten und Schritte werden dauerhaft gelöscht.
			</p>
			<button type="button" class={dangerButton} onclick={() => (deleteDialogOpen = true)}>
				Rezept löschen
			</button>
		</section>

		<form method="post" action="?/delete" bind:this={deleteFormEl} class="hidden"></form>
	</main>
</div>

<DeleteRecipeDialog
	bind:open={deleteDialogOpen}
	recipeName={data.recipe.name}
	onConfirm={() => deleteFormEl?.requestSubmit()}
/>
