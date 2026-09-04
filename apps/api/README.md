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
contain the household-scoped business logic. The Hono/oRPC handlers only run
the service effects through the managed runtime. Generate the Prisma client
from `apps/web` before building (`pnpm --filter web exec prisma generate`).

Domain code lives below `src/domains`: `recipes`, `planning`, `catalog`, and
`shopping-list` each expose a repository port/implementation and a service.
`src/infrastructure` contains Prisma wiring; `src/index.ts` only composes the
runtime and transports requests.
