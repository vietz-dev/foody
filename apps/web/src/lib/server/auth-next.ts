import { nextCookies } from 'better-auth/next-js';
import { authConfigFromEnv, createAuth, defineContext } from '@vietz-dev/auth';
import { prisma } from './prisma';

const householdContext = defineContext({
	field: 'householdId',
	create: async () => (await prisma.household.create({ data: { name: 'Zuhause' } })).id
});

export const auth = createAuth(
	authConfigFromEnv(process.env, {
		prisma,
		context: householdContext,
		oidcProviderId: 'pocket-id',
		plugins: [nextCookies()]
	})
);
