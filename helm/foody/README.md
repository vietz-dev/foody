# Foody Helm Chart

Self-Hosting von **Foody** (KI-gestützte Essensplanung) im Kubernetes-Cluster.

Foody ist ein einzelner SvelteKit-Server (`adapter-node`, Port 3000) mit einer
**SQLite**-Datei-Datenbank (Prisma + better-sqlite3). Daraus folgt bewusst:

- **1 Replica, `Recreate`-Rollout** — SQLite ist ein Single-Writer-Store auf
  einem `ReadWriteOnce`-Volume; mehrere Replicas / RollingUpdate sind nicht
  möglich. Kein HPA.
- **PVC** für die DB-Datei (`helm.sh/resource-policy: keep` → überlebt `uninstall`).
- **initContainer** führt vor dem Start `prisma migrate deploy` aus.

## 1. Image bauen

Das Chart referenziert ein Container-Image, das es noch nicht öffentlich gibt.
Aus dem **Repo-Root** (Build-Kontext = Monorepo-Root):

```bash
docker build -t ghcr.io/OWNER/foody:0.0.1 .
docker push  ghcr.io/OWNER/foody:0.0.1
```

## 2. Konfiguration

Minimale `my-values.yaml`:

```yaml
image:
  repository: ghcr.io/OWNER/foody
  tag: "0.0.1"

config:
  appUrl: "https://foody.example.com"   # == Ingress-Host inkl. Schema
  oidcIssuer: "https://auth.vietz.dev"

secrets:
  betterAuthSecret: "<openssl rand -base64 32>"
  oidcClientId: "<pocket-id client id>"
  oidcClientSecret: "<pocket-id client secret>"
  anthropicApiKey: "<sk-ant-...>"

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: foody.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: foody-tls
      hosts:
        - foody.example.com

persistence:
  size: 1Gi
  storageClass: ""     # leer = Default-StorageClass des Clusters
```

`config.appUrl` **muss** exakt der öffentlichen URL entsprechen (SvelteKit-
ORIGIN-Check für Formular-POSTs + better-auth/OIDC-Callbacks). Die Pocket-ID-
Redirect-URI muss `https://foody.example.com/api/auth/oauth2/callback/pocket-id`
enthalten.

### Secrets aus einem bestehenden Secret (empfohlen für Prod)

Statt Klartext in den values ein Secret mit den Keys `BETTER_AUTH_SECRET`,
`OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `ANTHROPIC_API_KEY` anlegen und
referenzieren:

```yaml
secrets:
  existingSecret: foody-secrets
```

## 3. Installation

```bash
helm upgrade --install foody ./helm/foody \
  --namespace foody --create-namespace \
  -f my-values.yaml

# Smoke-Test
helm test foody --namespace foody
```

## Datenbank-Backup

SQLite-Datei liegt im PVC unter `persistence.mountPath` (`/data/foody.db`):

```bash
kubectl -n foody exec deploy/foody -- \
  sh -c 'cat /data/foody.db' > foody-backup.db
```

## Wichtige Werte

| Key | Default | Zweck |
|-----|---------|-------|
| `image.repository` / `image.tag` | `ghcr.io/OWNER/foody` / appVersion | Container-Image |
| `config.appUrl` | `https://foody.local` | Öffentliche URL (ORIGIN + auth) |
| `config.oidcIssuer` | `https://auth.vietz.dev` | OIDC-Issuer (Pocket ID) |
| `config.bodySizeLimit` | `20M` | Upload-Limit (Buchfoto-Scans) |
| `persistence.size` | `1Gi` | Größe des DB-Volumes |
| `persistence.existingClaim` | `""` | Vorhandenen PVC weiterverwenden |
| `migrations.enabled` | `true` | `prisma migrate deploy` initContainer |
| `secrets.existingSecret` | `""` | Bestehendes Secret statt Klartext |
| `ingress.enabled` | `true` | Ingress erzeugen |
| `httpRoute.enabled` | `false` | Gateway-API-Route statt Ingress |
