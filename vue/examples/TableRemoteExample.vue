<template>
	<Section
		title="Remote table"
		:icon="CloudServerIcon"
		subtitle="Server-style pagination with fetchRows. Filter queries, sort, and page changes are sent to the callback. Saved views use callbackControlled view settings (not localStorage)."
		:padding="false"
	>
		<p v-if="lastQuerySummary" class="subtle query-summary">{{ lastQuerySummary }}</p>

		<Table
			row-key="name"
			:headers="headers"
			:fetch-rows="fetchRows"
			view-control-mode="callbackControlled"
			:view-settings="viewSettings"
			:show-pagination="true"
			:remote-debounce-ms="250"
		/>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import { CloudServerIcon } from '@hugeicons/core-free-icons'
import { getExampleTableRows } from '../data/examplePeople.js'
import {
	applyFilterQuery,
	countActiveFilterQuery,
} from '../composables/tableFilterQuery.js'
import { sortRows } from '../composables/tableFilters.js'

const allRows = getExampleTableRows()

const headers = ref([
	{ key: 'name', label: 'Name', sortable: true, filterable: true, filterType: 'text', width: '20%' },
	{ key: 'age', label: 'Age', sortable: true, filterable: true, filterType: 'number' },
	{
		key: 'city',
		label: 'City',
		sortable: true,
		filterable: true,
		filterType: 'select',
		filterOptions: [...new Set(allRows.map((row) => row.city))].sort().map((city) => ({
			value: city,
			label: city,
		})),
		width: '200px',
	},
])

const lastQuerySummary = ref('')

const remoteLayoutStore = ref({
	defaultPresetId: null,
	presets: [],
})

let remotePresetCounter = 0

function createRemotePresetId() {
	remotePresetCounter += 1
	return `remote-preset-${remotePresetCounter}`
}

const viewSettings = {
	async list() {
		return {
			presets: remoteLayoutStore.value.presets.map((preset) => ({ ...preset })),
			defaultPresetId: remoteLayoutStore.value.defaultPresetId,
		}
	},

	async getDefault() {
		const { defaultPresetId, presets } = remoteLayoutStore.value
		if (!defaultPresetId) {
			return { ok: true, preset: null }
		}

		const preset = presets.find((item) => item.id === defaultPresetId) ?? null
		return { ok: true, preset: preset ? { ...preset } : null }
	},

	async save({ name, state, setAsDefault = false }) {
		const trimmedName = String(name ?? '').trim()
		if (!trimmedName) {
			return { ok: false, error: 'Preset name is required.' }
		}

		const preset = {
			id: createRemotePresetId(),
			name: trimmedName,
			savedAt: new Date().toISOString(),
			state: JSON.parse(JSON.stringify(state)),
		}

		remoteLayoutStore.value.presets = [...remoteLayoutStore.value.presets, preset]
		if (setAsDefault) {
			remoteLayoutStore.value.defaultPresetId = preset.id
		}

		console.info('[remote table] saved layout preset', preset)
		return {
			ok: true,
			preset,
			defaultPresetId: remoteLayoutStore.value.defaultPresetId,
		}
	},

	async overwrite({ presetId, state }) {
		const index = remoteLayoutStore.value.presets.findIndex((item) => item.id === presetId)
		if (index === -1) {
			return { ok: false, error: 'Preset not found.' }
		}

		const preset = {
			...remoteLayoutStore.value.presets[index],
			savedAt: new Date().toISOString(),
			state: JSON.parse(JSON.stringify(state)),
		}
		remoteLayoutStore.value.presets = remoteLayoutStore.value.presets.map((item, i) => (
			i === index ? preset : item
		))

		console.info('[remote table] overwrote layout preset', preset)
		return {
			ok: true,
			preset,
			defaultPresetId: remoteLayoutStore.value.defaultPresetId,
		}
	},

	async load(presetId) {
		const preset = remoteLayoutStore.value.presets.find((item) => item.id === presetId)
		if (!preset) {
			return { ok: false, error: 'Preset not found.' }
		}

		console.info('[remote table] loaded layout preset', preset)
		return { ok: true, preset: { ...preset } }
	},

	async delete(presetId) {
		const nextPresets = remoteLayoutStore.value.presets.filter((item) => item.id !== presetId)
		if (nextPresets.length === remoteLayoutStore.value.presets.length) {
			return { ok: false, error: 'Preset not found.' }
		}

		remoteLayoutStore.value.presets = nextPresets
		if (remoteLayoutStore.value.defaultPresetId === presetId) {
			remoteLayoutStore.value.defaultPresetId = null
		}

		console.info('[remote table] deleted layout preset', presetId)
		return { ok: true, defaultPresetId: remoteLayoutStore.value.defaultPresetId }
	},

	async setDefault(presetId) {
		if (presetId === null) {
			remoteLayoutStore.value.defaultPresetId = null
			return { ok: true, defaultPresetId: null }
		}

		const preset = remoteLayoutStore.value.presets.find((item) => item.id === presetId)
		if (!preset) {
			return { ok: false, error: 'Preset not found.' }
		}

		remoteLayoutStore.value.defaultPresetId = presetId
		console.info('[remote table] set default layout preset', presetId)
		return { ok: true, defaultPresetId: presetId }
	},
}

async function fetchRows(query, { signal } = {}) {
	console.log('[remote table] filterQuery', query.filterQuery)

	await new Promise((resolve, reject) => {
		const timer = window.setTimeout(resolve, 200)
		if (!signal) {
			return
		}
		const onAbort = () => {
			window.clearTimeout(timer)
			reject(new DOMException('Aborted', 'AbortError'))
		}
		if (signal.aborted) {
			onAbort()
			return
		}
		signal.addEventListener('abort', onAbort, { once: true })
	})

	const filtered = applyFilterQuery(allRows, headers.value, query.filterQuery)
	const sorted = sortRows(filtered, query.sortBy, query.sortDir)
	const start = (query.page - 1) * query.pageSize
	const rows = sorted.slice(start, start + query.pageSize)

	lastQuerySummary.value = `Last query: page ${query.page}, group ${query.groupBy ?? 'none'}, ${countActiveFilterQuery(query.filterQuery, headers.value, allRows)} active filter(s), ${sorted.length} matching row(s).`

	return {
		rows,
		total: sorted.length,
	}
}
</script>

<style scoped>
.query-summary {
	margin: 0 0 0.75rem 1rem;
}
</style>
