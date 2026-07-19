# web

## 0.2.0

### Minor Changes

- 8227d49: Switch the database from SQLite to PostgreSQL
  - Prisma datasource is now `postgresql`; the app uses the `@prisma/adapter-pg`
    driver adapter (`pg`) instead of `better-sqlite3`.
  - `DATABASE_URL` now takes a `postgresql://…` DSN.
  - `docker-compose.yml` starts a local Postgres for development.
  - The Helm chart drops the SQLite PVC and instead supports either a bundled
    single-node Postgres StatefulSet (`postgres.enabled=true`) or an external
    Postgres (`externalDatabase.*`, e.g. CNPG via a DSN secret). The app runs
    stateless with a RollingUpdate strategy.

## 0.1.1

### Patch Changes

- 945f191: Fix pipeline
