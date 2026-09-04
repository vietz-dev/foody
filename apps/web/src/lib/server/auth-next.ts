import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { genericOAuth } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from './prisma';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  user: { additionalFields: { householdId: { type: 'string', required: false, input: false } } },
  databaseHooks: { user: { create: { before: async (user) => { const household = await prisma.household.create({ data: { name: 'Zuhause' } }); return { data: { ...user, householdId: household.id } }; } } } },
  plugins: [genericOAuth({ config: [{ providerId: 'pocket-id', clientId: process.env.OIDC_CLIENT_ID ?? '', clientSecret: process.env.OIDC_CLIENT_SECRET ?? '', discoveryUrl: `${process.env.OIDC_ISSUER ?? 'https://auth.vietz.dev'}/.well-known/openid-configuration`, scopes: ['openid', 'profile', 'email'] }] }), nextCookies()]
});
