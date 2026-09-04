# Foody API

The API is contract-first: request and response schemas live in
`@foody/contracts`, while this package exposes them over Hono and oRPC at
`/rpc/*`.

`createApp(resolveContext)` receives the authenticated household context. The
default export deliberately rejects RPC requests until the deployment wires
its Better Auth session resolver; no household identifier is accepted from an
untrusted client header.

The domain handlers are the migration seam for moving the existing SvelteKit
server modules out of `apps/web`. Once wired, the web app imports only the
typed client from `src/lib/api-client.ts`.
