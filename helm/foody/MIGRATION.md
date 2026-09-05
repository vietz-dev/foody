# Migration: Chart 0.2.x → 0.3.0 (getrennte web/api-Deployments)

Ab 0.3.0 liefert Foody zwei Images (`foody-web`, `foody-api`) statt einem
(`foody`). Das Chart deployt sie als zwei Deployments mit je 2 Replicas.
Die Datenbank (Schema, Migrationen, Secrets) ist unverändert — es sind keine
Daten zu migrieren, nur Values und Kubernetes-Objekte.

## Was sich ändert

| 0.2.x | 0.3.0 |
|-------|-------|
| Deployment `<release>-foody` | Deployments `<release>-foody-web` und `<release>-foody-api` |
| Service `<release>-foody` (Port 3000) | Services `<release>-foody-web` (3000) und `<release>-foody-api` (3001, nur clusterintern) |
| Image `ghcr.io/vietz-dev/foody` | `ghcr.io/vietz-dev/foody-web` + `ghcr.io/vietz-dev/foody-api` |
| Migrations-initContainer auf dem App-Pod | initContainer auf den api-Pods |
| ConfigMap-Keys `HOST`, `PORT` | `HOSTNAME`, `API_URL`; `PORT` je Container |

Unverändert: `config.*`, `secrets.*`, `postgres.*`, `externalDatabase.*`,
`migrations.*`, `ingress.*`, `httpRoute.*`, `serviceAccount.*`, Security-Contexts,
Scheduling-Values, ConfigMap- und Secret-Namen.

### Values umbenennen

| alt (0.2.x) | neu (0.3.0) |
|-------------|-------------|
| `image.repository` / `image.tag` / `image.pullPolicy` | `web.image.*` **und** `api.image.*` (zwei Repositories!) |
| `replicaCount` (Default 1) | `web.replicaCount` / `api.replicaCount` (Default 2) |
| `port` | `web.port` / `api.port` |
| `resources` | `web.resources` / `api.resources` |
| `livenessProbe` / `readinessProbe` | `web.livenessProbe` … / `api.livenessProbe` … |
| `service.*` | `web.service.*` / `api.service.*` |

Nicht mehr existierende Top-Level-Keys werden vom Chart ignoriert — ein
vergessener alter `image.tag` führt also still zum Fallback auf `Chart.appVersion`.

## Schritte

1. **Values anpassen** (Beispiel, wenn bisher nur `image.tag` gesetzt war):

   ```yaml
   # entfernen:
   # image:
   #   repository: ghcr.io/vietz-dev/foody
   #   tag: "0.2.0"
   # replicaCount: 1

   # hinzufügen (tag optional, Default = Chart.appVersion):
   web:
     image:
       tag: "0.3.0"
   api:
     image:
       tag: "0.3.0"
   ```

   Wer eine eigene Registry nutzt, setzt `web.image.repository` und
   `api.image.repository` auf die beiden neuen Images.

2. **Upgrade ausführen** — kein manuelles Löschen nötig. Die alten Objekte
   `<release>-foody` (Deployment, Service) haben neue Namen bekommen; Helm legt
   die neuen an und räumt die alten ab:

   ```bash
   helm upgrade foody oci://ghcr.io/vietz-dev/charts/foody --version 0.3.0 \
     --namespace foody -f my-values.yaml
   ```

   Während des Upgrades gibt es eine kurze Unterbrechung: der Ingress zeigt
   sofort auf `<release>-foody-web`, dessen Pods erst nach Migration (api) und
   Readiness bereitstehen. Die Prisma-Migration läuft auf jedem api-Pod als
   initContainer; `prisma migrate deploy` ist idempotent und sperrt sich selbst.

3. **Prüfen**:

   ```bash
   kubectl -n foody get deploy,svc -l app.kubernetes.io/instance=foody
   helm test foody -n foody
   ```

   Erwartet: `foody-web` und `foody-api` mit je `2/2` READY.

## Rollback

`helm rollback foody <revision>` stellt Deployment/Service `<release>-foody`
wieder her. Die Datenbank ist nach dem Upgrade unverändert, ein Rollback ist
also ohne DB-Eingriff möglich, solange keine neue Prisma-Migration im Release
enthalten war.
