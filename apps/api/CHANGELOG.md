# api

## 0.2.0

### Minor Changes

- a8c6c68: Next.js web reads and writes through the API: recipe detail and create views, weekly plan and shopping list use the oRPC client with the Better Auth session cookie. The API resolves the household from that cookie via its own Better Auth instance against the shared database.
- 1193cf0: Containerize web and api separately and deploy them as two Deployments.
  - `apps/web/Dockerfile` builds a Next.js standalone image (`ghcr.io/vietz-dev/foody-web`),
    `apps/api/Dockerfile` builds the Hono API bundled with esbuild (`ghcr.io/vietz-dev/foody-api`).
    The root `Dockerfile` is gone; the Release workflow pushes both images.
  - The Helm chart now runs `web` and `api` as separate Deployments (2 replicas each)
    with their own Services; only `web` is exposed via Ingress/HTTPRoute. The Prisma
    migration initContainer moved to the api pods. Top-level `image`, `port`,
    `replicaCount`, `resources`, `livenessProbe`, `readinessProbe` and `service`
    values moved under `web.*` / `api.*`. See `helm/foody/MIGRATION.md`.

### Patch Changes

- f4df641: Migrate task orchestration to Turborepo: `prisma:generate` is a turbo task that
  `build`, `check-types`, `test` and `dev` depend on (also for `web`, which now
  declares `api` as a workspace dependency for the Prisma client). CI runs
  `turbo run build check-types lint test` with a cached `.turbo` directory, and
  both Dockerfiles build from a `turbo prune --docker` workspace.
