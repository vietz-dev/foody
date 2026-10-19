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

### Entwicklung mit Dev Proxy

Mit Dev Proxy bekommen Web und API
pro Git-Worktree eine gemeinsame HTTPS-Adresse. Die API wird unter `/rpc`
erreichbar; alle anderen Pfade gehen an Next.js. Dev Proxy muss installiert
sein und sein Daemon laufen. Für serverseitige HTTPS-Anfragen wird Node.js
22.19+ oder 24.6+ benötigt, damit es die lokal vertraute CA nutzen kann.

```sh
devproxy serve                 # in einem eigenen Terminal, einmal pro Rechner
pnpm dev:proxy                # im Projekt-Root
devproxy list                 # zeigt die registrierte URL
```

Die App liegt unter `https://foody-<worktree-ordner>.localhost`. Dev Proxy
setzt `BETTER_AUTH_URL` für beide Dienste und `PORT` automatisch. Der Webserver
nutzt dieselbe Adresse für seine API-Anfragen. Für einen OIDC-Login muss diese
Adresse beim Identity-Provider als Callback-Basis zugelassen sein. Die lokale
Dev-Proxy-CA muss im System als vertrauenswürdig gelten. Der Daemon benötigt
außerdem die Berechtigung, Port 443 zu öffnen. `pnpm dev` startet weiterhin
die Dienste ohne Proxy.

Tasks laufen über [Turborepo](https://turborepo.dev) (`turbo.json`): `pnpm build`,
`pnpm check-types`, `pnpm lint` und `pnpm test`. Der Prisma-Client wird dabei
automatisch generiert (`api#prisma:generate`), auch für `web`. Einzelne Pakete
per Filter: `pnpm dev --filter=api`, `pnpm build --filter=web`.

Die Docker-Images (`apps/web/Dockerfile`, `apps/api/Dockerfile`) nutzen
`turbo prune`, Build-Kontext ist das Repo-Root.
