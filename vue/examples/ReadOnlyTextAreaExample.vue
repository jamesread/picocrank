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
				show-clear-button
				@copy="onCopy"
				@clear="onClear"
			>
				<template #actions>
					<button type="button" @click="refreshDiagnostics">Refresh log</button>
				</template>
			</ReadOnlyTextArea>

			<ReadOnlyTextArea
				v-model="environmentInfo"
				label="Environment (JSON)"
				:rows="12"
				show-clear-button
				markdown-ticks
				markdown-lang="json"
			/>

			<ReadOnlyTextArea
				ref="yamlConfigRef"
				v-model="yamlConfig"
				label="Configuration (YAML)"
				:rows="12"
				show-clear-button
				markdown-ticks
				markdown-lang="yaml"
			/>

			<div class="readonly-playground">
				<p class="readonly-playground-intro">
					Toggle options on the playground instance below to explore every
					<code>ReadOnlyTextArea</code> prop and the actions slot.
				</p>

				<div
					class="readonly-playground-controls"
					role="group"
					aria-label="ReadOnlyTextArea playground options"
				>
					<label class="readonly-example-toggle">
						<input v-model="playground.labelEnabled" type="checkbox" />
						Label
					</label>
					<label class="readonly-example-toggle">
						<input v-model="playground.showCopyButton" type="checkbox" />
						Copy button
					</label>
					<label class="readonly-example-toggle">
						<input v-model="playground.showClearButton" type="checkbox" />
						Clear button
					</label>
					<label class="readonly-example-toggle">
						<input v-model="playground.showActions" type="checkbox" />
						Actions slot
					</label>
					<label class="readonly-example-toggle">
						<input v-model="playground.monospace" type="checkbox" />
						Monospace
					</label>
					<label class="readonly-example-toggle">
						<input v-model="playground.markdownTicks" type="checkbox" />
						Markdown ticks
					</label>
					<label class="readonly-example-toggle">
						<input
							v-model="playground.markdownLangJson"
							type="checkbox"
							:disabled="!playground.markdownTicks"
						/>
						Markdown lang: json
					</label>
					<label class="readonly-example-toggle">
						<input v-model="playground.usePlaceholder" type="checkbox" />
						Placeholder
					</label>
					<label class="readonly-example-toggle">
						<input v-model="playground.customButtonLabels" type="checkbox" />
						Custom button labels
					</label>
					<label class="readonly-example-toggle readonly-playground-rows">
						<span>Rows</span>
						<input
							v-model.number="playground.rows"
							type="number"
							min="2"
							max="24"
						/>
					</label>
				</div>

				<ReadOnlyTextArea
					v-model="playgroundContent"
					:label="playground.labelEnabled ? 'Playground output' : ''"
					:rows="playground.rows"
					:placeholder="playground.usePlaceholder ? 'No diagnostics available.' : ''"
					:monospace="playground.monospace"
					:show-copy-button="playground.showCopyButton"
					:show-clear-button="playground.showClearButton"
					:copy-label="playground.customButtonLabels ? 'Copy all' : undefined"
					:copied-label="playground.customButtonLabels ? 'Copied!' : undefined"
					:clear-label="playground.customButtonLabels ? 'Reset' : undefined"
					:markdown-ticks="playground.markdownTicks"
					:markdown-lang="playground.markdownTicks && playground.markdownLangJson ? 'json' : ''"
					@copy="onPlaygroundCopy"
					@clear="onPlaygroundClear"
					@copy-error="onPlaygroundCopyError"
				>
					<template v-if="playground.showActions" #actions>
						<button type="button" @click="fillPlaygroundContent">Fill sample</button>
					</template>
				</ReadOnlyTextArea>

				<p v-if="playgroundFeedback" class="copy-feedback subtle">
					{{ playgroundFeedback }}
				</p>
			</div>

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
const playgroundFeedback = ref('')
const yamlConfigRef = ref(null)

const playground = ref({
	labelEnabled: false,
	showCopyButton: true,
	showClearButton: false,
	showActions: false,
	monospace: true,
	markdownTicks: false,
	markdownLangJson: false,
	usePlaceholder: false,
	customButtonLabels: false,
	rows: 4,
})

function buildPlaygroundSample() {
	return [
		'Playground sample output',
		'Toggle the checkboxes above to try label, buttons, markdown fences, and monospace.',
		'',
		'status: ok',
		'items: 3',
	].join('\n')
}

const playgroundContent = ref(buildPlaygroundSample())

function fillPlaygroundContent() {
	playground.value.usePlaceholder = false
	playgroundContent.value = buildPlaygroundSample()
	playgroundFeedback.value = 'Filled playground with sample content.'
}

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

function onClear() {
	lastCopied.value = ''
}

function onPlaygroundCopy(value) {
	playgroundFeedback.value = `Copied ${value.split('\n').length} line(s).`
}

function onPlaygroundClear() {
	playgroundContent.value = ''
	playgroundFeedback.value = 'Playground cleared.'
}

function onPlaygroundCopyError(error) {
	playgroundFeedback.value = `Copy failed: ${error?.message ?? error}`
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

.readonly-playground {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.readonly-playground-intro {
	margin: 0;
}

.readonly-example-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 0.875rem;
	cursor: pointer;
	user-select: none;
}

.readonly-playground-controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem 1rem;
}

.readonly-playground-rows input[type='number'] {
	width: 4rem;
	padding: 0.15rem 0.35rem;
}
</style>
