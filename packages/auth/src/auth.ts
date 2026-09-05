import { betterAuth, type Session as BaseSession, type User } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { genericOAuth } from 'better-auth/plugins';
import type { AuthConfig } from './config';

type ContextField<Field extends string> = {
  [K in Field]: { type: 'string'; required: false; input: false };
};

/**
 * Creates the Better Auth instance. Every new user gets a default context
 * (see `DefaultContext`). All apps sharing one database must use the same
 * `secret` and `baseURL`, otherwise session cookies do not validate across them.
 */
export const createAuth = <Field extends string>(config: AuthConfig<Field>) => {
  const { field, create } = config.context;
  return betterAuth({
    baseURL: config.baseURL,
    secret: config.secret,
    database: prismaAdapter(config.prisma, { provider: 'postgresql' }),
    user: {
      additionalFields: {
        [field]: { type: 'string', required: false, input: false }
      } as ContextField<Field>
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({ data: { ...user, [field]: await create(user) } })
        }
      }
    },
    plugins: [
      ...(config.oidc
        ? [
            genericOAuth({
              config: [
                {
                  providerId: config.oidc.providerId,
                  clientId: config.oidc.clientId,
                  clientSecret: config.oidc.clientSecret,
                  discoveryUrl: `${config.oidc.issuer}/.well-known/openid-configuration`,
                  scopes: config.oidc.scopes ?? ['openid', 'profile', 'email']
                }
              ]
            })
          ]
        : []),
      ...(config.plugins ?? [])
    ]
  });
};

export type AuthInstance<Field extends string = string> = ReturnType<typeof createAuth<Field>>;
/** Session as returned by `getSession`; `user[field]` holds the default context id. */
export type Session<Field extends string = string> = {
  session: BaseSession;
  user: User & Partial<Record<Field, string | null>>;
};
