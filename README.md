# Foody

Foody ist eine selbst gehostete Anwendung für Rezepte, Wochenplanung und
Einkaufslisten. Das Frontend ist eine Next.js-Anwendung; die API basiert auf
Hono, Effect und oRPC.

## Workspace

- `apps/web` – Next.js-Frontend mit Authentifizierung und Prisma
- `apps/api` – Hono/oRPC-API
- `packages/contracts` – gemeinsame API-Verträge
- `packages/hono-effect` – Effect-Integration für Hono/oRPC
- `packages/eslint-config` und `packages/typescript-config` – gemeinsame Tools

## Entwicklung

```sh
pnpm install
pnpm dev
```

Weitere Befehle: `pnpm build`, `pnpm lint` und `pnpm check-types`.
