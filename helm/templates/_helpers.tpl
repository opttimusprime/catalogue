{{- define "catalogue.name" -}}
{{ .Chart.Name }}
{{- end }}

{{- define "catalogue.fullname" -}}
{{ .Release.Name }}-{{ .Chart.Name }}
{{- end }}


{{- define "catalogue.chart" -}}
{{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{- define "catalogue.labels" -}}
app.kubernetes.io/name: {{ include "catalogue.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ include "catalogue.chart" . }}
{{- end }}


{{- define "catalogue.selectorLabels" -}}
app.kubernetes.io/name: {{ include "catalogue.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}


{{- define "catalogue.serviceAccountName" -}}
{{ include "catalogue.fullname" . }}-sa
{{- end }}


{{- define "catalogue.namespace" -}}
{{ .Values.namespace }}
{{- end }}


{{- define "catalogue.containerName" -}}
catalogue
{{- end }}


{{- define "catalogue.secretName" -}}
{{ include "catalogue.fullname" . }}-secret
{{- end }}


{{- define "catalogue.configMapName" -}}
{{ include "catalogue.fullname" . }}-config
{{- end }}


{{- define "catalogue.ingressName" -}}
{{ include "catalogue.fullname" . }}-ingress
{{- end }}

{{- define "catalogue.hpaName" -}}
{{ include "catalogue.fullname" . }}-hpa
{{- end }}