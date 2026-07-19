{{/*
Expand the name of the chart.
*/}}
{{- define "foody.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "foody.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/* Chart name and version */}}
{{- define "foody.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels */}}
{{- define "foody.labels" -}}
helm.sh/chart: {{ include "foody.chart" . }}
{{ include "foody.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* Selector labels */}}
{{- define "foody.selectorLabels" -}}
app.kubernetes.io/name: {{ include "foody.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/* Service account name */}}
{{- define "foody.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "foody.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/* Secret name (chart-managed unless an existing secret is provided) */}}
{{- define "foody.secretName" -}}
{{- if .Values.secrets.existingSecret }}
{{- .Values.secrets.existingSecret }}
{{- else }}
{{- include "foody.fullname" . }}
{{- end }}
{{- end }}

{{/* ConfigMap name */}}
{{- define "foody.configMapName" -}}
{{- printf "%s-config" (include "foody.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Bundled Postgres component name */}}
{{- define "foody.postgres.fullname" -}}
{{- printf "%s-postgres" (include "foody.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Bundled Postgres secret name (chart-managed unless an existing secret is given) */}}
{{- define "foody.postgres.secretName" -}}
{{- if .Values.postgres.auth.existingSecret }}
{{- .Values.postgres.auth.existingSecret }}
{{- else }}
{{- include "foody.postgres.fullname" . }}
{{- end }}
{{- end }}

{{/*
DATABASE_URL env entries for the app container + migrate initContainer. Branch order:
  1. postgres.enabled                          → bundled StatefulSet; password from chart secret.
  2. externalDatabase.existingSecret + URL key → full DSN pulled straight from a Secret (e.g. CNPG "uri").
  3. externalDatabase.existingSecret           → assembled DSN; password from a Secret key via $(VAR).
  4. otherwise                                 → assembled DSN from parts, no secret.
Renders cleanly with defaults so `helm template`/lint pass; a real deploy picks one of branches 1–3.
*/}}
{{- define "foody.databaseEnv" -}}
{{- if .Values.postgres.enabled }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "foody.postgres.secretName" . }}
      key: password
- name: DATABASE_URL
  value: "postgresql://{{ .Values.postgres.auth.username }}:$(POSTGRES_PASSWORD)@{{ include "foody.postgres.fullname" . }}:5432/{{ .Values.postgres.auth.database }}?schema=public"
{{- else if and .Values.externalDatabase.existingSecret .Values.externalDatabase.existingSecretUrlKey }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ .Values.externalDatabase.existingSecret }}
      key: {{ .Values.externalDatabase.existingSecretUrlKey }}
{{- else if .Values.externalDatabase.existingSecret }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.externalDatabase.existingSecret }}
      key: {{ .Values.externalDatabase.existingSecretPasswordKey }}
- name: DATABASE_URL
  value: "postgresql://{{ .Values.externalDatabase.username }}:$(POSTGRES_PASSWORD)@{{ .Values.externalDatabase.host }}:{{ .Values.externalDatabase.port }}/{{ .Values.externalDatabase.database }}?sslmode={{ .Values.externalDatabase.sslmode }}"
{{- else }}
- name: DATABASE_URL
  value: "postgresql://{{ .Values.externalDatabase.username }}@{{ .Values.externalDatabase.host }}:{{ .Values.externalDatabase.port }}/{{ .Values.externalDatabase.database }}?sslmode={{ .Values.externalDatabase.sslmode }}"
{{- end }}
{{- end }}
