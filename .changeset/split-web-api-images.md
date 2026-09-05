---
'web': minor
'api': minor
---

Containerize web and api separately and deploy them as two Deployments.

- `apps/web/Dockerfile` builds a Next.js standalone image (`ghcr.io/vietz-dev/foody-web`),
  `apps/api/Dockerfile` builds the Hono API bundled with esbuild (`ghcr.io/vietz-dev/foody-api`).
  The root `Dockerfile` is gone; the Release workflow pushes both images.
- The Helm chart now runs `web` and `api` as separate Deployments (2 replicas each)
  with their own Services; only `web` is exposed via Ingress/HTTPRoute. The Prisma
  migration initContainer moved to the api pods. Top-level `image`, `port`,
  `replicaCount`, `resources`, `livenessProbe`, `readinessProbe` and `service`
  values moved under `web.*` / `api.*`. See `helm/foody/MIGRATION.md`.
