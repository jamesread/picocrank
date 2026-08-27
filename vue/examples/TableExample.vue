<template>
	<Section
		:title="tableSectionTitle"
		:icon="TableIcon"
		subtitle="Sortable columns, pagination, and column filters. Right-click or long-press a column header to filter."
		:padding="false"
	>
		<Table
			table-id="table-example"
			row-key="name"
			:data="tableData"
			:headers="headers"
			:show-pagination="enabledFeatures.includes('pagination')"
			:filterable="enabledFeatures.includes('filters')"
			:column-options="enabledFeatures.includes('columnOptions')"
			:loading="enabledFeatures.includes('loading')"
			:horizontal-scroll="layout === 'scroll'"
			:responsive-columns="layout === 'priorities'"
			:sticky-cols="stickyCols"
			v-model:column-visibility="columnVisibility"
			v-model:layout-label="tableLayoutLabel"
			:default-column-visibility="defaultColumnVisibility"
			v-bind="tableListeners"
		>
			<template #cell-name="{ row, value }">
				<router-link :to="{ name: 'ViewItem', params: { id: row.name } }">
					{{ value }}
				</router-link>
			</template>

			<template #cell-city="{ value }">
				<span class="subtle">
					{{ value }}
				</span>
			</template>

			<template #cell-status="{ value }">
				<span class="tag" :class="statusTagClass(value)">{{ value }}</span>
			</template>
		</Table>
	</Section>

	<Section
		title="Explore table options"
		:icon="Settings01Icon"
		subtitle="Adjust layout and behaviour for the table above."
	>
		<template #toolbar>
			<button type="button" @click="resetControls">Reset options</button>
		</template>

		<FormLayout>
			<FormField label="Data" component-has-label description="Connect or disconnect row data for the table above. Saved column layouts persist in localStorage for this table.">
				<RadioGroup
					v-model="dataConnected"
					name="table-data-connection"
					variant="boolean"
					:options="dataConnectionOptions"
				/>
			</FormField>

			<FormField
				label="Wide table"
				component-has-label
				description="Adds extra columns (email, department, role, status) to the table."
			>
				<label>
					<input v-model="wideTable" type="checkbox" />
					Show extended columns
				</label>
			</FormField>

			<FormField label="Features" component-has-label description="Toggle core table behaviour.">
				<CheckGroup
					v-model="enabledFeatures"
					name="table-features"
					:options="featureOptions"
				/>
			</FormField>

			<FormField
				label="Responsive layout"
				component-has-label
				description="Column priorities hide lower-priority columns as the table narrows. Horizontal scroll keeps every column visible with optional sticky leading columns. Browser layout leaves column sizing to the viewport."
			>
				<RadioGroup
					v-model="layout"
					name="table-layout"
					:options="layoutOptions"
				/>
			</FormField>

			<FormField
				v-if="layout === 'scroll'"
				label="Sticky columns"
				component-has-label
				description="Pin the first columns while scrolling horizontally."
			>
				<RadioGroup
					v-model="stickyColsOption"
					name="table-sticky-cols"
					:options="stickyColOptions"
				/>
			</FormField>
		</FormLayout>

		<div class="table-events">
			<h4>Events</h4>
			<p v-if="lastRowClick" class="event-line">
				<strong>Row click:</strong>
				index {{ lastRowClick.index }}, name “{{ lastRowClick.row.name }}”
			</p>
			<p v-else class="event-line subtle">Row click: enable “Row click” above, then click a row to open the detail dialog.</p>

			<p v-if="lastQuery" class="event-line">
				<strong>Query:</strong>
				page {{ lastQuery.page }},
				sort {{ lastQuery.sortBy ?? 'none' }} {{ lastQuery.sortDir }},
				{{ activeFilterCount }} active filter(s)
			</p>
			<p v-else class="event-line subtle">Query: waiting for the first table update…</p>

			<p v-if="tableLayoutLabel" class="event-line">
				<strong>Layout:</strong>
				{{ tableLayoutLabel }}
			</p>
			<p v-else-if="enabledFeatures.includes('columnOptions')" class="event-line subtle">
				Layout: using developer defaults (change columns, order, or filters to see a preset or “Custom” label).
			</p>
		</div>
	</Section>

	<dialog
		ref="rowDialogRef"
		class="row-detail-dialog"
		@click="onRowDialogBackdropClick"
	>
		<div v-if="lastRowClick" class="dialog-panel" @click.stop>
			<h3>{{ lastRowClick.row.name }}</h3>
			<p class="subtle">Row index {{ lastRowClick.index }} in the current filtered and sorted result set.</p>

			<dl>
				<dt>Index</dt>
				<dd>{{ lastRowClick.index }}</dd>

				<template v-for="header in headers" :key="header.key">
					<dt>{{ header.label || header.key }}</dt>
					<dd>
						<span v-if="header.key === 'status'" class="tag" :class="statusTagClass(lastRowClick.row[header.key])">
							{{ lastRowClick.row[header.key] }}
						</span>
						<template v-else>
							{{ lastRowClick.row[header.key] }}
						</template>
					</dd>
				</template>
			</dl>

			<form method="dialog">
				<button type="submit" class="neutral">Close</button>
			</form>
		</div>
	</dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { TableIcon, Settings01Icon } from '@hugeicons/core-free-icons'
import { getExampleTableRows } from '../data/examplePeople.js'
import { countActiveFilters } from '../composables/tableFilters.js'

const defaultFeatures = ['pagination', 'filters', 'columnOptions', 'rowClick']

const defaultColumnVisibility = {
	birthYear: false,
}

const enabledFeatures = ref([...defaultFeatures])
const columnVisibility = ref({ ...defaultColumnVisibility })
const layout = ref('priorities')
const stickyColsOption = ref('2')
const wideTable = ref(true)
const dataConnected = ref(true)
const data = ref([])
const lastRowClick = ref(null)
const lastQuery = ref(null)
const tableLayoutLabel = ref('')
const rowDialogRef = ref(null)

const tableSectionTitle = computed(() => {
	if (tableLayoutLabel.value) {
		return `Table Example (${tableLayoutLabel.value})`
	}
	return 'Table Example'
})

const dataConnectionOptions = [
	{ label: 'Connect data', value: true },
	{ label: 'Disconnect data', value: false },
]

const featureOptions = [
	{ value: 'pagination', label: 'Pagination' },
	{ value: 'filters', label: 'Column filters' },
	{ value: 'columnOptions', label: 'Column options' },
	{ value: 'rowClick', label: 'Row click' },
	{ value: 'loading', label: 'Loading state' },
]

const layoutOptions = [
	{ value: 'priorities', label: 'Column priorities' },
	{ value: 'scroll', label: 'Horizontal scroll' },
	{ value: 'browser', label: 'Browser' },
]

const stickyColOptions = [
	{ value: 'none', label: 'None' },
	{ value: '1', label: '1 column' },
	{ value: '2', label: '2 columns' },
	{ value: '3', label: '3 columns' },
]

const baseHeaders = [
	{ key: 'name', label: 'Name', sortable: true, filterable: true, filterType: 'text', width: '20%' },
	{ key: 'age', label: 'Age', sortable: true, filterable: true, filterType: 'number', colPriority: 2 },
	{ key: 'birthYear', label: 'Birth year', sortable: true, filterable: true, filterType: 'number', colPriority: 3 },
	{ key: 'city', label: 'City', sortable: true, filterable: true, filterType: 'select', width: '200px', colPriority: 1 },
]

const extendedHeaders = [
	{ key: 'email', label: 'Email', sortable: true, filterable: true, filterType: 'text' },
	{ key: 'department', label: 'Department', sortable: true, filterable: true, filterType: 'select', colPriority: 2 },
	{ key: 'role', label: 'Role', sortable: true, filterable: true, filterType: 'text', colPriority: 1 },
	{ key: 'status', label: 'Status', sortable: true, filterable: true, filterType: 'select', colPriority: 1 },
]

const stickyCols = computed(() => {
	if (layout.value !== 'scroll' || stickyColsOption.value === 'none') {
		return null
	}
	return Number(stickyColsOption.value)
})

const useExtendedColumns = computed(() => wideTable.value)

const headers = computed(() => (
	useExtendedColumns.value ? [...baseHeaders, ...extendedHeaders] : [...baseHeaders]
))

const tableData = computed(() => {
	if (!dataConnected.value) {
		return []
	}

	const birthYear = new Date().getFullYear()

	return data.value.map((row) => {
		const withBirthYear = {
			...row,
			birthYear: birthYear - row.age,
		}

		if (!useExtendedColumns.value) {
			return withBirthYear
		}

		return {
			...withBirthYear,
			email: `${String(row.name).toLowerCase()}@example.com`,
			department: row.age >= 30 ? 'Operations' : 'Engineering',
			role: row.age >= 35 ? 'Manager' : 'Member',
			status: row.age % 2 === 0 ? 'Active' : 'Pending',
		}
	})
})

const activeFilterCount = computed(() => {
	if (!lastQuery.value?.filters) {
		return 0
	}
	return countActiveFilters(lastQuery.value.filters, headers.value, tableData.value)
})

const tableListeners = computed(() => {
	const listeners = {
		onQueryChange: handleQueryChange,
	}
	if (enabledFeatures.value.includes('rowClick')) {
		listeners.onRowClick = handleRowClick
	}
	return listeners
})

function handleRowClick(payload) {
	lastRowClick.value = payload
	rowDialogRef.value?.showModal()
}

function onRowDialogBackdropClick(event) {
	if (event.target === rowDialogRef.value) {
		rowDialogRef.value.close()
	}
}

function handleQueryChange(query) {
	lastQuery.value = query
}

function statusTagClass(value) {
	if (value === 'Active') {
		return 'good'
	}
	if (value === 'Pending') {
		return 'warning'
	}
	return null
}

function resetControls() {
	enabledFeatures.value = [...defaultFeatures]
	columnVisibility.value = { ...defaultColumnVisibility }
	layout.value = 'priorities'
	stickyColsOption.value = '2'
	wideTable.value = true
	dataConnected.value = true
	lastRowClick.value = null
	if (rowDialogRef.value?.open) {
		rowDialogRef.value.close()
	}
}

onMounted(() => {
	data.value = getExampleTableRows()
})
</script>

<style scoped>
.table-events {
	margin-top: 1.5rem;
}

.table-events h4 {
	margin-top: 0;
}

.event-line {
	margin: 0.35rem 0;
}

.row-detail-dialog .dialog-panel h3 {
	margin: 0 0 0.5rem;
}

.row-detail-dialog .dialog-panel p {
	margin: 0 0 1rem;
}

.row-detail-dialog dl {
	margin: 0 0 1rem;
}

.row-detail-dialog form {
	margin: 0;
}
</style>
