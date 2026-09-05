# Foody Helm Chart

Self-Hosting von **Foody** (KI-gestützte Essensplanung) im Kubernetes-Cluster.

Foody besteht aus zwei zustandslosen Prozessen — **web** (Next.js, Port 3000)
und **api** (Hono/oRPC, Port 3001) — mit einer gemeinsamen **PostgreSQL**-Datenbank
(Prisma + `pg`-Treiber):

- **Zwei Deployments** (`<release>-web`, `<release>-api`) mit je 2 Replicas,
  RollingUpdate. Nur `web` hängt am Ingress; `web` erreicht `api` clusterintern
  über `API_URL`. Der gesamte Zustand liegt in Postgres.
- **Datenbank** über einen von zwei Wegen:
  - `postgres.enabled=true` → gebündeltes Single-Node-Postgres-StatefulSet
    (Schnellstart; für einen Haushalt ausreichend).
  - `externalDatabase.*` → externer/operator-verwalteter Postgres (CNPG,
    Cloud-RDS, …) — der empfohlene Weg.
- **initContainer** auf den api-Pods führt vor dem Start `prisma migrate deploy` aus.

## 1. Images bauen

Der Release-Workflow baut und pusht beide Images nach GHCR. Manuell aus dem
**Repo-Root** (Build-Kontext = Monorepo-Root):

```bash
docker build -f apps/web/Dockerfile -t ghcr.io/vietz-dev/foody-web:0.3.0 .
docker build -f apps/api/Dockerfile -t ghcr.io/vietz-dev/foody-api:0.3.0 .
```

## 2. Konfiguration

Minimale `my-values.yaml`:

```yaml
# Optional — image.tag beider Komponenten fällt auf Chart.appVersion zurück.
web:
  image:
    tag: "0.3.0"
api:
  image:
    tag: "0.3.0"

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

# Datenbank — Variante A: externer Postgres, DSN aus einem Secret (empfohlen).
# Ein CNPG-Cluster veröffentlicht z. B. einen fertigen `postgres://…`-String
# unter dem Key "uri" seines "<cluster>-app"-Secrets.
externalDatabase:
  existingSecret: foody-db-app
  existingSecretUrlKey: uri
```

Datenbank — Variante B: gebündeltes Postgres vom Chart (Schnellstart):

```yaml
postgres:
  enabled: true
  auth:
    password: "<openssl rand -base64 24>"   # oder existingSecret setzen
  persistence:
    size: 8Gi
    storageClass: ""     # leer = Default-StorageClass des Clusters
```

`config.appUrl` **muss** exakt der öffentlichen URL entsprechen (better-auth/OIDC-
Callbacks). Die Pocket-ID-
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

Mit `pg_dump` gegen den konfigurierten Postgres (Beispiel für das gebündelte
StatefulSet — Passwort aus dem Chart-Secret):

```bash
kubectl -n foody exec statefulset/foody-postgres -- \
  sh -c 'pg_dump -U foody foody' > foody-backup.sql
```

Bei externem Postgres/CNPG entsprechend die Backup-Mechanismen des Operators nutzen.

## Wichtige Werte

| Key | Default | Zweck |
|-----|---------|-------|
| `web.image.repository` / `web.image.tag` | `ghcr.io/vietz-dev/foody-web` / appVersion | Web-Image |
| `api.image.repository` / `api.image.tag` | `ghcr.io/vietz-dev/foody-api` / appVersion | API-Image |
| `web.replicaCount` / `api.replicaCount` | `2` / `2` | Pods je Komponente |
| `config.appUrl` | `https://foody.local` | Öffentliche URL für better-auth |
| `config.oidcIssuer` | `https://auth.vietz.dev` | OIDC-Issuer (Pocket ID) |
| `postgres.enabled` | `false` | Gebündeltes Postgres-StatefulSet deployen |
| `postgres.auth.password` / `.existingSecret` | `""` | Passwort für gebündeltes Postgres |
| `postgres.persistence.size` | `8Gi` | Volume-Größe des gebündelten Postgres |
| `externalDatabase.existingSecret` | `""` | Secret mit fertiger DSN (Key `uri`) |
| `externalDatabase.host` / `.username` / `.database` | `""` / `foody` / `foody` | DSN aus Einzelteilen |
| `externalDatabase.sslmode` | `require` | SSL-Modus für externen Postgres |
| `migrations.enabled` | `true` | `prisma migrate deploy` initContainer (api-Pods) |
| `secrets.existingSecret` | `""` | Bestehendes Secret statt Klartext |
| `ingress.enabled` | `true` | Ingress erzeugen |
| `httpRoute.enabled` | `false` | Gateway-API-Route statt Ingress |
