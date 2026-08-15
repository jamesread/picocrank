<template>
	<table class="row-hover" :class="{ loading: isLoading }">
		<thead>
			<th
				v-for="(header, index) in visibleHeaders"
				:key="header.key || index"
				:class="headerClasses(header)"
				:style="{ width: header.width || 'auto' }"
				@click="onHeaderClick(header, $event)"
				@contextmenu.prevent="openFilter(header, $event)"
				@pointerdown="onHeaderPointerDown(header, $event)"
				@pointermove="longPress.onPointerMove"
				@pointerup="longPress.onPointerUp"
				@pointercancel="longPress.onPointerCancel"
				@pointerleave="longPress.onPointerLeave"
			>
				<span class="header-label">{{ header.label || header.key }}</span>

				<span v-if="filterable && isHeaderFiltered(header)" class="filter-indicator" title="Filtered" aria-hidden="true">⧩</span>

				<span v-if="header.sortable" class="sort-indicator">
					<span v-if="sortBy === header.key">
						<span v-if="sortDir === 'asc'">▲</span>
						<span v-else-if="sortDir === 'desc'">▼</span>
					</span>
				</span>
			</th>
		</thead>
		<tbody>
			<tr v-if="displayRows.length === 0">
				<td :colspan="visibleHeaders.length">
					<span v-if="isLoading">Loading…</span>
					<span v-else>No items found</span>
				</td>
			</tr>
			<tr v-else v-for="(row, rowIndex) in displayRows" :key="rowIndex">
				<td v-for="(header, cellIndex) in visibleHeaders" :key="header.key || cellIndex" :class="{ hidden: header.hidden }">
					<component
						v-if="slotFor(header.key)"
						:is="slotFor(header.key)"
						:class="{ hidden: header.hidden }"
						:row="row"
						:value="row[header.key]"
					/>
					<span v-else>
						{{ row[header.key] }}
					</span>
				</td>
			</tr>
		</tbody>
	</table>
	<div v-if="showPagination" class="padding">
		<Pagination :total="totalCount" v-model:page="page" v-model:page-size="pageSize" />
	</div>

	<TableColumnFilterPopover
		v-if="filterable"
		v-model:open="filterPopoverOpen"
		:header="activeFilterHeader"
		:anchor-el="activeFilterAnchor"
		:value="activeFilterValue"
		:rows="props.data"
		:select-options="activeSelectOptions"
		@apply="onFilterApply"
		@clear="onFilterClear"
		@cancel="onFilterCancel"
	/>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, useSlots } from 'vue'
import Pagination from './Pagination.vue'
import TableColumnFilterPopover from './TableColumnFilterPopover.vue'
import { useLongPress } from '../composables/useLongPress.js'
import {
	applyFilters,
	buildSelectOptions,
	cloneFilters,
	isFilterActive,
	sortRows,
} from '../composables/tableFilters.js'

const sortBy = ref(null)
const sortDir = ref('asc')
const page = ref(1)
const pageSize = ref(10)

const props = defineProps({
	headers: {
		type: Array,
		default: () => ['id'],
	},
	data: {
		type: Array,
		default: () => [],
	},
	showPagination: {
		type: Boolean,
		default: true,
	},
	filterable: {
		type: Boolean,
		default: true,
	},
	filters: {
		type: Object,
		default: undefined,
	},
	fetchRows: {
		type: Function,
		default: null,
	},
	loading: {
		type: Boolean,
		default: false,
	},
	remoteDebounceMs: {
		type: Number,
		default: 300,
	},
})

const emit = defineEmits([
	'update:filters',
	'filter-change',
	'query-change',
	'fetch-error',
])

const slots = useSlots()
const internalFilters = ref({})
const remoteRows = ref([])
const remoteTotal = ref(0)
const internalLoading = ref(false)
const fetchRequestId = ref(0)
const fetchAbortController = ref(null)
const fetchDebounceTimer = ref(null)

const filterPopoverOpen = ref(false)
const activeFilterHeader = ref(null)
const activeFilterAnchor = ref(null)
const activeFilterValue = ref(null)

const isRemote = computed(() => typeof props.fetchRows === 'function')

const activeFilters = computed(() => {
	if (!props.filterable) {
		return {}
	}
	return props.filters !== undefined ? props.filters : internalFilters.value
})

const isLoading = computed(() => props.loading || internalLoading.value)

const visibleHeaders = computed(() => props.headers.filter((header) => !header.hidden))

const filteredItems = computed(() => {
	if (isRemote.value) {
		return remoteRows.value
	}
	return applyFilters(props.data, props.headers, activeFilters.value)
})

const sortedItems = computed(() => {
	if (isRemote.value) {
		return filteredItems.value
	}
	return sortRows(filteredItems.value, sortBy.value, sortDir.value)
})

const displayRows = computed(() => {
	if (isRemote.value || !props.showPagination) {
		return sortedItems.value
	}

	const start = (page.value - 1) * pageSize.value
	return sortedItems.value.slice(start, start + pageSize.value)
})

const totalCount = computed(() => {
	if (isRemote.value) {
		return remoteTotal.value
	}
	return sortedItems.value.length
})

const activeSelectOptions = computed(() => {
	if (!activeFilterHeader.value) {
		return []
	}
	return buildSelectOptions(props.data, activeFilterHeader.value)
})

const queryParams = computed(() => ({
	page: page.value,
	pageSize: pageSize.value,
	sortBy: sortBy.value,
	sortDir: sortDir.value,
	filters: cloneFilters(activeFilters.value),
}))

function slotFor(key) {
	const named = slots[`cell-${key}`]
	return named || slots.cell || null
}

function isHeaderFilterable(header) {
	return props.filterable && header.filterable !== false
}

function isHeaderFiltered(header) {
	return isFilterActive(activeFilters.value?.[header.key])
}

function headerClasses(header) {
	return {
		sortable: header.sortable,
		filterable: isHeaderFilterable(header),
		filtered: isHeaderFiltered(header),
	}
}

function setFilters(nextFilters) {
	const cloned = cloneFilters(nextFilters)
	if (props.filters === undefined) {
		internalFilters.value = cloned
	}
	emit('update:filters', cloned)
	emit('filter-change', cloned)
}

function emitQueryChange() {
	emit('query-change', queryParams.value)
}

function toggleSort(header) {
	if (!header.sortable) {
		return
	}

	if (sortBy.value === header.key) {
		sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
	} else {
		sortBy.value = header.key
		sortDir.value = 'asc'
	}
}

function onHeaderClick(header, event) {
	if (longPress.suppressClick.value) {
		longPress.onClick(event)
		return
	}
	toggleSort(header)
}

function openFilter(header, event) {
	if (!isHeaderFilterable(header)) {
		return
	}

	activeFilterHeader.value = header
	activeFilterAnchor.value = event.currentTarget
	activeFilterValue.value = activeFilters.value?.[header.key] ?? null
	filterPopoverOpen.value = true
}

const longPress = useLongPress((event) => {
	const headerCell = event.currentTarget
	const headerKey = headerCell?.dataset?.headerKey
	const header = visibleHeaders.value.find((item) => item.key === headerKey)
	if (header) {
		openFilter(header, event)
	}
})

function onHeaderPointerDown(header, event) {
	if (!props.filterable) {
		return
	}
	event.currentTarget.dataset.headerKey = header.key
	longPress.onPointerDown(event)
}

function onFilterApply(filter) {
	if (!activeFilterHeader.value) {
		return
	}

	const nextFilters = cloneFilters(activeFilters.value)
	if (filter) {
		nextFilters[activeFilterHeader.value.key] = filter
	} else {
		delete nextFilters[activeFilterHeader.value.key]
	}

	setFilters(nextFilters)
	page.value = 1
	emitQueryChange()
}

function onFilterClear() {
	if (!activeFilterHeader.value) {
		return
	}

	const nextFilters = cloneFilters(activeFilters.value)
	delete nextFilters[activeFilterHeader.value.key]
	setFilters(nextFilters)
	page.value = 1
	emitQueryChange()
}

function onFilterCancel() {
	activeFilterHeader.value = null
	activeFilterAnchor.value = null
	activeFilterValue.value = null
}

async function runFetchRows() {
	if (!isRemote.value) {
		return
	}

	if (fetchAbortController.value) {
		fetchAbortController.value.abort()
	}

	const controller = new AbortController()
	fetchAbortController.value = controller
	const requestId = fetchRequestId.value + 1
	fetchRequestId.value = requestId
	internalLoading.value = true

	try {
		const result = await props.fetchRows(queryParams.value, { signal: controller.signal })
		if (requestId !== fetchRequestId.value) {
			return
		}

		remoteRows.value = Array.isArray(result?.rows) ? result.rows : []
		remoteTotal.value = Number.isFinite(result?.total) ? result.total : remoteRows.value.length
	} catch (error) {
		if (error?.name === 'AbortError') {
			return
		}
		emit('fetch-error', error)
		if (requestId === fetchRequestId.value) {
			remoteRows.value = []
			remoteTotal.value = 0
		}
	} finally {
		if (requestId === fetchRequestId.value) {
			internalLoading.value = false
		}
	}
}

function scheduleFetchRows() {
	if (!isRemote.value) {
		return
	}

	if (fetchDebounceTimer.value !== null) {
		clearTimeout(fetchDebounceTimer.value)
	}

	fetchDebounceTimer.value = window.setTimeout(() => {
		fetchDebounceTimer.value = null
		runFetchRows()
	}, props.remoteDebounceMs)
}

watch(
	() => [pageSize.value, sortBy.value, sortDir.value],
	() => {
		page.value = 1
		if (isRemote.value) {
			scheduleFetchRows()
		}
		emitQueryChange()
	},
)

watch(page, () => {
	if (isRemote.value) {
		scheduleFetchRows()
	}
	emitQueryChange()
})

watch(
	activeFilters,
	() => {
		page.value = 1
		if (isRemote.value) {
			scheduleFetchRows()
		}
		emitQueryChange()
	},
	{ deep: true },
)

watch(
	() => props.filters,
	(newFilters) => {
		if (newFilters !== undefined) {
			internalFilters.value = cloneFilters(newFilters)
		}
	},
	{ deep: true },
)

watch(
	() => props.filterable,
	(enabled) => {
		if (!enabled) {
			filterPopoverOpen.value = false
			onFilterCancel()
		}
	},
)

watch(sortedItems, () => {
	if (!isRemote.value) {
		page.value = 1
	}
})

onMounted(() => {
	emitQueryChange()
	if (isRemote.value) {
		runFetchRows()
	}
})

onBeforeUnmount(() => {
	if (fetchAbortController.value) {
		fetchAbortController.value.abort()
	}
	if (fetchDebounceTimer.value !== null) {
		clearTimeout(fetchDebounceTimer.value)
	}
})
</script>

<style scoped>
table thead th.sortable:hover {
	cursor: pointer;
	color: #0366d6;
}

table thead th.filterable {
	cursor: context-menu;
}

table thead th.filtered {
	color: #0366d6;
}

table.loading tbody {
	opacity: 0.65;
}

.header-label {
	margin-right: 0.25rem;
}

.filter-indicator {
	display: inline-block;
	margin-right: 0.25rem;
	font-size: 0.85em;
	opacity: 0.85;
}

.sort-indicator {
	width: 1.5em;
	display: inline-block;
	text-align: center;
}

td:first-child,
th:first-child {
	padding-left: 1rem;
}
</style>
