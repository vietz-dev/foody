<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { enhance } from '$app/forms';
	import { Checkbox } from '@ark-ui/svelte';
	import Header from '$lib/components/Header.svelte';
	import { card, ghostButton, input as inputClass, primaryButton, sectionTitle } from '$lib/styles';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	interface Suggestion {
		id: string;
		name: string;
	}

	let pendingIds = $state(untrack(() => new SvelteSet(data.pending.map((p) => p.id))));
	let names = $state(untrack(() => Object.fromEntries(data.pending.map((p) => [p.id, p.name]))));
	let staples = $state(
		untrack(() => Object.fromEntries(data.pending.map((p) => [p.id, p.isStaple])))
	);
	let mergeTargets = $state(
		untrack(() => Object.fromEntries(data.pending.map((p) => [p.id, ''])))
	) as Record<string, string>;

	let visiblePending = $derived(data.pending.filter((p) => pendingIds.has(p.id)));

	function suggestionFor(id: string): Suggestion | null {
		return (data.suggestions as Record<string, Suggestion | null>)[id] ?? null;
	}
</script>

<svelte:head>
	<title>Zutaten-Katalog – Foody</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-surface-0">
	<Header backHref="/recipes" backLabel="← Rezepte" title="Zutaten-Katalog" userName={data.user.name} />

	<main class="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
		{#if visiblePending.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<p class="m-0 text-[15px] text-secondary">Keine offenen Einträge.</p>
			</div>
		{:else}
			<h2 class={sectionTitle}>Offene Zutaten ({visiblePending.length})</h2>
			<ul class="m-0 flex list-none flex-col gap-4 p-0">
				{#each visiblePending as entry (entry.id)}
					{@const suggestion = suggestionFor(entry.id)}
					<li class={card}>
						<div class="flex flex-col gap-3">
							<div class="flex items-center gap-3">
								<input
									type="text"
									bind:value={names[entry.id]}
									class="{inputClass} flex-1"
									aria-label="Name der Zutat"
								/>
								<Checkbox.Root
									checked={staples[entry.id]}
									onCheckedChange={(details) => (staples[entry.id] = !!details.checked)}
									class="flex cursor-pointer items-center gap-2"
								>
									<Checkbox.Control
										class="flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] border-secondary data-[state=checked]:border-brand data-[state=checked]:bg-brand"
									>
										<Checkbox.Indicator class="text-xs font-bold text-white">✓</Checkbox.Indicator>
									</Checkbox.Control>
									<Checkbox.Label class="text-[13px] text-secondary">Vorrat</Checkbox.Label>
									<Checkbox.HiddenInput />
								</Checkbox.Root>
							</div>

							{#if suggestion}
								<form
									method="POST"
									action="?/merge"
									use:enhance={() => {
										return async ({ result, update }) => {
											if (result.type === 'success') {
												pendingIds.delete(entry.id);
											}
											await update({ reset: false });
										};
									}}
									class="flex items-center gap-2 rounded-lg bg-surface-0 p-3"
								>
									<input type="hidden" name="sourceId" value={entry.id} />
									<input type="hidden" name="targetId" value={suggestion.id} />
									<p class="m-0 flex-1 text-[13px] text-secondary">
										Zusammenführen mit «{suggestion.name}»?
									</p>
									<button type="submit" class={primaryButton}>Übernehmen</button>
								</form>
							{/if}

							<div class="flex flex-wrap items-center gap-2">
								<form
									method="POST"
									action="?/confirm"
									use:enhance={() => {
										return async ({ result, update }) => {
											if (result.type === 'success') {
												pendingIds.delete(entry.id);
											}
											await update({ reset: false });
										};
									}}
								>
									<input type="hidden" name="id" value={entry.id} />
									<input type="hidden" name="name" value={names[entry.id]} />
									<input type="hidden" name="isStaple" value={staples[entry.id] ? 'on' : ''} />
									<button type="submit" class={primaryButton}>Bestätigen</button>
								</form>

								{#if data.confirmed.length > 0}
									<form
										method="POST"
										action="?/merge"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													pendingIds.delete(entry.id);
												}
												await update({ reset: false });
											};
										}}
										class="flex items-center gap-2"
									>
										<input type="hidden" name="sourceId" value={entry.id} />
										<select
											name="targetId"
											bind:value={mergeTargets[entry.id]}
											class="{inputClass} w-auto"
										>
											<option value="">In bestehende Zutat zusammenführen …</option>
											{#each data.confirmed as target (target.id)}
												<option value={target.id}>{target.name}</option>
											{/each}
										</select>
										<button type="submit" class={ghostButton} disabled={!mergeTargets[entry.id]}>
											Zusammenführen
										</button>
									</form>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</main>
</div>
