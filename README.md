# Foody

Foody ist eine selbst gehostete Anwendung für Rezepte, Wochenplanung und
Einkaufslisten. Das Frontend ist eine Next.js-Anwendung; die API basiert auf
Hono, Effect und oRPC.

## Workspace

- `apps/web` – Next.js-Frontend mit Authentifizierung und Prisma
- `apps/api` – Hono/oRPC-API
- `packages/contracts` – gemeinsame API-Verträge
- `packages/hono-effect` – Effect-Integration für Hono/oRPC
- `packages/typescript-config` – gemeinsame Tools

## Entwicklung

```sh
pnpm install
pnpm dev
```

Tasks laufen über [Turborepo](https://turborepo.dev) (`turbo.json`): `pnpm build`,
`pnpm check-types`, `pnpm lint` und `pnpm test`. Der Prisma-Client wird dabei
automatisch generiert (`api#prisma:generate`), auch für `web`. Einzelne Pakete
per Filter: `pnpm dev --filter=api`, `pnpm build --filter=web`.

Die Docker-Images (`apps/web/Dockerfile`, `apps/api/Dockerfile`) nutzen
`turbo prune`, Build-Kontext ist das Repo-Root.
