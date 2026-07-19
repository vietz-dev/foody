import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { genericOAuth } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { prisma } from './prisma';

const fallbackURL = env.BETTER_AUTH_URL ?? 'http://localhost:5173';

// In dev, derive baseURL from the request host so the app is reachable both via
// localhost and via the machine's LAN IP (e.g. testing from a phone). In prod we
// keep the fixed BETTER_AUTH_URL. Note: any LAN IP used here must also be a
// registered redirect URI in the Pocket ID OAuth client.
const baseURL = dev
	? {
			allowedHosts: [
				'localhost:5173',
				'127.0.0.1:5173',
				'192.168.*', // private LAN (matches host incl. port)
				'10.*',
				'172.16.*'
			],
			fallback: fallbackURL,
			protocol: 'http' as const
		}
	: fallbackURL;

export const auth = betterAuth({
	baseURL,
	secret: env.BETTER_AUTH_SECRET,
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	user: {
		additionalFields: {
			householdId: {
				type: 'string',
				required: false,
				input: false
			}
		}
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const household = await prisma.household.create({
						data: { name: 'Zuhause' }
					});
					return { data: { ...user, householdId: household.id } };
				}
			}
		}
	},
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: 'pocket-id',
					clientId: env.OIDC_CLIENT_ID ?? '',
					clientSecret: env.OIDC_CLIENT_SECRET ?? '',
					discoveryUrl: `${env.OIDC_ISSUER ?? 'https://auth.vietz.dev'}/.well-known/openid-configuration`,
					scopes: ['openid', 'profile', 'email']
				}
			]
		}),
		// Must stay last: lets better-auth set cookies via SvelteKit's cookie API.
		sveltekitCookies(getRequestEvent)
	]
});

export type Auth = typeof auth;
