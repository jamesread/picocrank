<template>
	<Section
		title="ReadOnlyTextArea Example"
		subtitle="Read-only text areas with copy-to-clipboard, for diagnostics and similar output"
	>
		<template #toolbar>
			<button type="button" @click="refreshDiagnostics">Refresh diagnostics</button>
		</template>

		<div class="readonly-textarea-examples">
			<p>
				Use <code>ReadOnlyTextArea</code> when you need to show log output, API responses,
				or other text that users should read and copy but not edit.
			</p>

			<ReadOnlyTextArea
				v-model="diagnosticLog"
				label="Application log"
				:rows="10"
				@copy="onCopy"
			/>

			<ReadOnlyTextArea
				v-model="environmentInfo"
				label="Environment (JSON)"
				:rows="12"
				markdown-ticks
				markdown-lang="json"
			/>

			<ReadOnlyTextArea
				ref="yamlConfigRef"
				v-model="yamlConfig"
				label="Configuration (YAML)"
				:rows="12"
				markdown-ticks
				markdown-lang="yaml"
			/>

			<ReadOnlyTextArea
				:rows="4"
				placeholder="No diagnostics available."
			/>

			<p v-if="lastCopied" class="copy-feedback subtle">
				Copied {{ lastCopied.length > 60 ? `${lastCopied.slice(0, 60)}…` : lastCopied }}
			</p>
		</div>
	</Section>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import Section from '../components/Section.vue'
import ReadOnlyTextArea from '../components/ReadOnlyTextArea.vue'

const diagnosticLog = ref('')
const environmentInfo = ref('')
const yamlConfig = ref('')
const lastCopied = ref('')
const yamlConfigRef = ref(null)

function buildDiagnosticLog() {
	const now = new Date().toISOString()
	return [
		`[${now}] INFO  Service started`,
		`[${now}] INFO  Listening on http://localhost:8080`,
		`[${now}] DEBUG Database connection pool ready (size=5)`,
		`[${now}] WARN  Cache miss for key: user:session:abc123`,
		`[${now}] INFO  GET /api/health 200 12ms`,
		`[${now}] ERROR Failed to reach upstream metrics collector`,
		`[${now}] INFO  Retrying metrics collector in 30s`,
	].join('\n')
}

function buildEnvironmentInfo() {
	return JSON.stringify({
		app: 'picocrank',
		version: '1.0.0',
		environment: 'development',
		timestamp: new Date().toISOString(),
		runtime: {
			userAgent: navigator.userAgent,
			language: navigator.language,
			online: navigator.onLine,
		},
		features: {
			clipboard: Boolean(navigator.clipboard),
			serviceWorker: 'serviceWorker' in navigator,
		},
	}, null, 2)
}

function buildYamlConfig() {
	yamlConfig.value = ''
	const area = yamlConfigRef.value
	if (!area) {
		return
	}

	area.appendSection('Application')
	area.appendYamlProperty('name', 'picocrank')
	area.appendYamlProperty('version', '1.0.0')
	area.appendYamlProperty('environment', 'development')
	area.appendSection('Runtime')
	area.appendYamlProperty('language', navigator.language)
	area.appendYamlProperty('online', navigator.onLine)
}

function refreshDiagnostics() {
	diagnosticLog.value = buildDiagnosticLog()
	environmentInfo.value = buildEnvironmentInfo()
	lastCopied.value = ''
	nextTick(() => buildYamlConfig())
}

function onCopy(value) {
	lastCopied.value = value.split('\n')[0]
}

refreshDiagnostics()
</script>

<style scoped>
.readonly-textarea-examples {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.readonly-textarea-examples p {
	margin: 0;
}

.copy-feedback {
	margin: 0;
	font-size: 0.875rem;
}
</style>
