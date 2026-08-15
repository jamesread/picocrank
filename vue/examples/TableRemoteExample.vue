<template>
	<Section
		title="Remote table"
		subtitle="Server-style pagination with fetchRows. Filters, sort, and page changes are sent to the callback. Right-click or long-press a column header to filter."
		:padding="false"
	>
		<p v-if="lastQuerySummary" class="subtle query-summary">{{ lastQuerySummary }}</p>

		<Table
			:headers="headers"
			:fetch-rows="fetchRows"
			:show-pagination="true"
			:remote-debounce-ms="250"
		/>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import { getExampleTableRows } from '../data/examplePeople.js'
import { applyFilters, sortRows } from '../composables/tableFilters.js'

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

async function fetchRows(query, { signal } = {}) {
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

	const filtered = applyFilters(allRows, headers.value, query.filters)
	const sorted = sortRows(filtered, query.sortBy, query.sortDir)
	const start = (query.page - 1) * query.pageSize
	const rows = sorted.slice(start, start + query.pageSize)

	lastQuerySummary.value = `Last query: page ${query.page}, ${Object.keys(query.filters ?? {}).length} active filter(s), ${sorted.length} matching row(s).`

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
