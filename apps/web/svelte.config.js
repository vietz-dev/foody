import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// Self-hosted Node server (personal app, no managed-platform deploy target).
		// BODY_SIZE_LIMIT env var must be raised for book-photo uploads, see .env.example.
		adapter: adapter()
	}
};

export default config;
