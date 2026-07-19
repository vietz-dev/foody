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

{{/* PVC name (chart-managed unless an existing claim is provided) */}}
{{- define "foody.pvcName" -}}
{{- if .Values.persistence.existingClaim }}
{{- .Values.persistence.existingClaim }}
{{- else }}
{{- printf "%s-data" (include "foody.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/* SQLite DATABASE_URL derived from the mount path + filename */}}
{{- define "foody.databaseUrl" -}}
{{- printf "file:%s/%s" (.Values.persistence.mountPath | trimSuffix "/") .Values.persistence.dbFilename }}
{{- end }}
