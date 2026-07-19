import type { auth } from '$lib/server/auth';

type AuthSession = typeof auth.$Infer.Session;

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: AuthSession['user'] | null;
			session: AuthSession['session'] | null;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
