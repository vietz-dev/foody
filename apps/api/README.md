# Foody API

The API is contract-first: request and response schemas live in
`@foody/contracts`, while this package exposes them over Hono and oRPC at
`/rpc/*`.

`createApp(resolveContext)` receives the authenticated household context. The
default export resolves it from the Better Auth session cookie forwarded by the
web app (`@vietz-dev/auth`, shared with the web app), so `BETTER_AUTH_SECRET` and
`BETTER_AUTH_URL` must match `apps/web`. No household identifier is accepted
from an untrusted client header. Copy `.env.example` to `.env`; `pnpm dev` and
`pnpm start` load it.

The API uses Effect layers for dependency injection. Prisma is created once as
a scoped `PrismaService`, repositories contain database access, and services
contain the household-scoped business logic. The Hono/oRPC handlers execute
service effects through the managed runtime adapter from `@vietz-dev/hono-effect`.
Prisma belongs to the API. `pnpm dev`, `pnpm build`, `pnpm check-types` and
`pnpm test` generate the client first (turbo task `prisma:generate`); apply
development migrations with `pnpm --filter api run prisma:migrate`.
The API listens on port `3001` by default; override it with `PORT` when needed.

Database modules live below `src/repositories`, while household-scoped business
logic lives below `src/services`. Each repository and service has its own module
directory with purpose-specific files such as `repository.ts` or `service.ts`,
`types.ts`, `errors.ts`, `internal.ts`, and `deps.ts`. `src/dependencies`
composes the runtime, `src/infrastructure` contains Prisma wiring, and
`src/index.ts` only defines the transport boundary.
