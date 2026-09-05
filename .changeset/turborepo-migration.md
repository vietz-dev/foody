---
'web': patch
'api': patch
---

Migrate task orchestration to Turborepo: `prisma:generate` is a turbo task that
`build`, `check-types`, `test` and `dev` depend on (also for `web`, which now
declares `api` as a workspace dependency for the Prisma client). CI runs
`turbo run build check-types lint test` with a cached `.turbo` directory, and
both Dockerfiles build from a `turbo prune --docker` workspace.
