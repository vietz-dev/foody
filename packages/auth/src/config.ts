import type { BetterAuthOptions } from 'better-auth';
import type { prismaAdapter } from 'better-auth/adapters/prisma';
import type { DefaultContext } from './context';

export type AuthDatabase = Parameters<typeof prismaAdapter>[0];

export type OidcConfig = {
  /** Id used by the client: `authClient.signIn.oauth2({ providerId })`. */
  providerId: string;
  /** Issuer base URL; `/.well-known/openid-configuration` is appended. */
  issuer: string;
  clientId: string;
  clientSecret: string;
  scopes?: string[];
};

export type AuthConfig<Field extends string = string> = {
  prisma: AuthDatabase;
  context: DefaultContext<Field>;
  secret: string | undefined;
  baseURL: string;
  /** OIDC sign-in. Omit for services that only validate sessions. */
  oidc?: OidcConfig;
  /** Framework plugins, e.g. `nextCookies()` in Next.js. */
  plugins?: NonNullable<BetterAuthOptions['plugins']>;
};

/**
 * Builds the config from env vars:
 * `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (default http://localhost:3000),
 * `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`.
 * OIDC is enabled when `OIDC_CLIENT_ID` and `OIDC_ISSUER` are set.
 *
 * ```ts
 * createAuth(authConfigFromEnv(process.env, { prisma, context, oidcProviderId: 'my-idp' }));
 * ```
 */
export const authConfigFromEnv = <const Field extends string>(
  env: Record<string, string | undefined>,
  rest: {
    prisma: AuthDatabase;
    context: DefaultContext<Field>;
    plugins?: AuthConfig['plugins'];
    oidcProviderId?: string;
    oidcScopes?: string[];
  }
): AuthConfig<Field> => {
  const { oidcProviderId, oidcScopes, ...config } = rest;
  return {
    ...config,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    oidc:
      env.OIDC_CLIENT_ID && env.OIDC_ISSUER
        ? {
            providerId: oidcProviderId ?? 'oidc',
            issuer: env.OIDC_ISSUER,
            clientId: env.OIDC_CLIENT_ID,
            clientSecret: env.OIDC_CLIENT_SECRET ?? '',
            scopes: oidcScopes
          }
        : undefined
  };
};
