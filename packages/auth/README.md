# @vietz/auth

Shared Better Auth stack (Prisma, OIDC sign-in, default tenant context) with an
Effect service for backends that only validate sessions.

```ts
// app with sign-in (Next.js)
const auth = createAuth(
  authConfigFromEnv(process.env, {
    prisma,
    context: defineContext({
      field: 'teamId',
      create: async () => (await prisma.team.create({ data: {} })).id
    }),
    oidcProviderId: 'my-idp',
    plugins: [nextCookies()]
  })
);

// service validating forwarded session cookies (Effect)
const Auth = AuthTag<'teamId'>();
const layer = AuthLive(authConfigFromEnv(process.env, { prisma, context }));
Effect.flatMap(Auth, (auth) => auth.resolveContext(request.headers)); // { teamId } | null
```

Env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`,
`OIDC_CLIENT_SECRET`. Every app on the same database must share secret and URL.
The user model needs the context column (`teamId String?`) plus the Better Auth
tables (`npx @better-auth/cli generate`).
