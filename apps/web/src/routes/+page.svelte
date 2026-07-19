<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { ghostButton, primaryButton } from '$lib/styles';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function initials(name: string) {
		return name
			.split(' ')
			.map((part) => part[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	async function signOut() {
		await authClient.signOut();
		location.href = '/';
	}
</script>

<svelte:head>
	<title>Foody</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-surface-0 p-6">
	<div
		class="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl bg-surface-1 p-10 shadow-card"
	>
		<h1 class="m-0 text-3xl font-extrabold tracking-tight text-primary">Foody</h1>

		{#if data.user}
			<div class="flex w-full flex-col items-center gap-5">
				<div class="flex items-center gap-2.5">
					{#if data.user.image}
						<img
							src={data.user.image}
							alt={data.user.name}
							class="h-8 w-8 rounded-full object-cover"
						/>
					{:else}
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white"
						>
							{initials(data.user.name)}
						</span>
					{/if}
					<span class="text-[15px] font-medium text-primary">{data.user.name}</span>
				</div>
				<p class="m-0 text-center text-sm text-secondary">Guten Hunger!</p>
				<a href="/plan" class={primaryButton}>Wochenplan</a>
				<a href="/recipes" class={ghostButton}>Alle Rezepte</a>
				<button type="button" class={ghostButton} onclick={signOut}>Abmelden</button>
			</div>
		{:else}
			<div class="flex w-full flex-col items-center gap-5">
				<p class="m-0 text-center text-sm text-secondary">Mahlzeitenplanung für euch als Paar.</p>
				<a href="/login" class={primaryButton}>Anmelden</a>
			</div>
		{/if}
	</div>
</main>
