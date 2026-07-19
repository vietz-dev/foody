# Foody Helm Chart

Self-Hosting von **Foody** (KI-gestützte Essensplanung) im Kubernetes-Cluster.

Foody ist ein SvelteKit-Server (`adapter-node`, Port 3000) mit einer
**PostgreSQL**-Datenbank (Prisma + `pg`-Treiber). Der App-Prozess ist zustandslos:

- **Stateless App** — skaliert und rollt normal (RollingUpdate). Der gesamte
  Zustand liegt in Postgres.
- **Datenbank** über einen von zwei Wegen:
  - `postgres.enabled=true` → gebündeltes Single-Node-Postgres-StatefulSet
    (Schnellstart; für einen Haushalt ausreichend).
  - `externalDatabase.*` → externer/operator-verwalteter Postgres (CNPG,
    Cloud-RDS, …) — der empfohlene Weg.
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
| `image.repository` / `image.tag` | `ghcr.io/OWNER/foody` / appVersion | Container-Image |
| `config.appUrl` | `https://foody.local` | Öffentliche URL (ORIGIN + auth) |
| `config.oidcIssuer` | `https://auth.vietz.dev` | OIDC-Issuer (Pocket ID) |
| `config.bodySizeLimit` | `20M` | Upload-Limit (Buchfoto-Scans) |
| `postgres.enabled` | `false` | Gebündeltes Postgres-StatefulSet deployen |
| `postgres.auth.password` / `.existingSecret` | `""` | Passwort für gebündeltes Postgres |
| `postgres.persistence.size` | `8Gi` | Volume-Größe des gebündelten Postgres |
| `externalDatabase.existingSecret` | `""` | Secret mit fertiger DSN (Key `uri`) |
| `externalDatabase.host` / `.username` / `.database` | `""` / `foody` / `foody` | DSN aus Einzelteilen |
| `externalDatabase.sslmode` | `require` | SSL-Modus für externen Postgres |
| `migrations.enabled` | `true` | `prisma migrate deploy` initContainer |
| `secrets.existingSecret` | `""` | Bestehendes Secret statt Klartext |
| `ingress.enabled` | `true` | Ingress erzeugen |
| `httpRoute.enabled` | `false` | Gateway-API-Route statt Ingress |
