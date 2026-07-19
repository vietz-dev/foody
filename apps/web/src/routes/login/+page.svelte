<script lang="ts">
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { primaryButton } from '$lib/styles';

	let signingIn = $state(false);
	let errorMessage = $state('');

	async function signIn() {
		signingIn = true;
		errorMessage = '';
		const returnTo = page.url.searchParams.get('returnTo') ?? '/';
		const { error } = await authClient.signIn.oauth2({
			providerId: 'pocket-id',
			callbackURL: returnTo
		});
		if (error) {
			errorMessage = error.message ?? 'Anmeldung fehlgeschlagen.';
			signingIn = false;
		}
	}
</script>

<svelte:head>
	<title>Anmelden – Foody</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-surface-0 p-6">
	<div class="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl bg-surface-1 p-10 shadow-card">
		<h1 class="m-0 text-3xl font-extrabold tracking-tight text-primary">Foody</h1>
		<div class="flex w-full flex-col items-center gap-5">
			<p class="m-0 text-center text-sm text-secondary">Mahlzeitenplanung für euch als Paar.</p>
			<button
				type="button"
				class="{primaryButton} px-6 py-2.5"
				disabled={signingIn}
				onclick={signIn}
			>
				{signingIn ? 'Weiterleitung…' : 'Mit Pocket ID anmelden'}
			</button>
			{#if errorMessage}
				<p class="m-0 text-sm text-danger">⚠ {errorMessage}</p>
			{/if}
		</div>
	</div>
</main>
