# Foody API

The API is contract-first: request and response schemas live in
`@foody/contracts`, while this package exposes them over Hono and oRPC at
`/rpc/*`.

`createApp(resolveContext)` receives the authenticated household context. The
default export resolves it from the Better Auth session cookie forwarded by the
web app (`@vietz/auth`, shared with the web app), so `BETTER_AUTH_SECRET` and
`BETTER_AUTH_URL` must match `apps/web`. No household identifier is accepted
from an untrusted client header. Local development loads secrets from the root
`fnox.toml` through the root `pnpm dev` script; `.env` is only for non-secret
local overrides. See the root README for age-key and secret setup.

The API uses Effect layers for dependency injection. Prisma is created once as
a scoped `PrismaService`, repositories contain database access, and services
contain the household-scoped business logic. The Hono/oRPC handlers execute
service effects through the managed runtime adapter from `@foody/hono-effect`.
Prisma belongs to the API. `pnpm dev`, `pnpm build`, `pnpm check-types` and
`pnpm test` generate the client first (turbo task `prisma:generate`). For a
disposable development database, apply development migrations with
`fnox exec -- pnpm --filter api run prisma:migrate`. Against an existing
database, inspect migration status first with
`fnox exec -- pnpm --filter api exec prisma migrate status`.
The API listens on port `3001` by default; override it with `PORT` when needed.

Database modules live below `src/repositories`, while household-scoped business
logic lives below `src/services`. Each repository and service has its own module
directory with purpose-specific files such as `repository.ts` or `service.ts`,
`types.ts`, `errors.ts`, `internal.ts`, and `deps.ts`. `src/dependencies`
composes the runtime, `src/infrastructure` contains Prisma wiring, and
`src/index.ts` only defines the transport boundary.
