# Changelog

## [0.2.1](https://github.com/vietz-dev/foody/compare/v0.2.0...v0.2.1) (2026-09-06)


### Features

* **api:** add orpc hono contract scaffold ([fb76fcc](https://github.com/vietz-dev/foody/commit/fb76fccd6a673f0fc4abd924f613509c595f54bc))
* containerize web and api separately, split Helm into two Deployments ([1193cf0](https://github.com/vietz-dev/foody/commit/1193cf0ec2bf9227fd355d0d56c04018433ff3d5))
* **shopping-list:** /admin legacy-data backfill (FOODY-6) ([0cc2563](https://github.com/vietz-dev/foody/commit/0cc25633030be2a97edbd2dc3b5a3e784252196e))
* **shopping-list:** catalog mapping on write, review page & plan portions (FOODY-4/5/7) ([56199fd](https://github.com/vietz-dev/foody/commit/56199fd258a463da027eeac60a8de9e355c03db5))
* **shopping-list:** schema, catalog matcher & list builder (FOODY-2/3/8) ([ccf9b6f](https://github.com/vietz-dev/foody/commit/ccf9b6f59ded6526d53d140d256d5f1dbe935b38))
* **shopping-list:** shopping-list page /plan/einkaufsliste (FOODY-9) ([0724147](https://github.com/vietz-dev/foody/commit/0724147c5784bdb39acda790a5b94929488881eb))
* **web:** migrate app shell to Next.js ([3182c30](https://github.com/vietz-dev/foody/commit/3182c307c5e7cfef4185c56c586fdd59f2c2dc41))
* **web:** mobile-first UI with Chakra controls and app shell ([4624d31](https://github.com/vietz-dev/foody/commit/4624d31ef815e437e7844b3d4048c30fd073c432))
* **web:** recipe detail and create views backed by the API ([a8c6c68](https://github.com/vietz-dev/foody/commit/a8c6c685216f74055da3a93be8ca753be0bbc1a6))


### Bug Fixes

* **api:** move Prisma ownership to API ([73231d4](https://github.com/vietz-dev/foody/commit/73231d4e35a3913cbebd10963a4b0766820ab3f0))
* **shopping-list:** address code-review findings (FOODY-10) ([e333a5b](https://github.com/vietz-dev/foody/commit/e333a5bca6a1f3696a7799d5c02b719517c90941))

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
