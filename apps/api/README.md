# Foody API

The API is contract-first: request and response schemas live in
`@foody/contracts`, while this package exposes them over Hono and oRPC at
`/rpc/*`.

`createApp(resolveContext)` receives the authenticated household context. The
default export deliberately rejects RPC requests until the deployment wires
its Better Auth session resolver; no household identifier is accepted from an
untrusted client header.

The API uses Effect layers for dependency injection. Prisma is created once as
a scoped `PrismaService`, repositories contain database access, and services
contain the household-scoped business logic. The Hono/oRPC handlers execute
service effects through the managed runtime adapter from `@foody/hono-effect`.
Generate the Prisma client from `apps/web` before building
(`pnpm --filter web exec prisma generate`).

Database modules live below `src/repositories`, while household-scoped business
logic lives below `src/services`. Each repository and service has its own module
directory with purpose-specific files such as `repository.ts` or `service.ts`,
`types.ts`, `errors.ts`, `internal.ts`, and `deps.ts`. `src/dependencies`
composes the runtime, `src/infrastructure` contains Prisma wiring, and
`src/index.ts` only defines the transport boundary.
