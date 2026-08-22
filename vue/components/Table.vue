<template>
	<div
		v-if="showTableChrome"
		:class="needsTableWrapper ? tableWrapperClasses : undefined"
		:style="needsTableWrapper ? undefined : { display: 'contents' }"
	>
		<table class="row-hover" :class="{ loading: isLoading }">
			<thead>
				<tr>
					<th
						v-for="(header, index) in visibleHeaders"
						:key="header.key || index"
						:class="[headerClasses(header), header.class]"
						:style="{ width: header.width || 'auto' }"
						@click="onHeaderClick(header, $event)"
						@contextmenu.prevent="openFilter(header, $event)"
						@pointerdown="onHeaderPointerDown(header, $event)"
						@pointermove="longPress.onPointerMove"
						@pointerup="longPress.onPointerUp"
						@pointercancel="longPress.onPointerCancel"
						@pointerleave="longPress.onPointerLeave"
					>
						<span class="header-label">
							{{ header.label || header.key }}<template v-if="headerFilterCount(header)"> ({{ headerFilterCount(header) }})</template>
						</span>

						<span v-if="filterable && isHeaderFiltered(header)" class="filter-indicator" title="Filtered" aria-hidden="true">⧩</span>

						<span v-if="header.sortable" class="sort-indicator">
							<span v-if="sortBy === header.key">
								<span v-if="sortDir === 'asc'">▲</span>
								<span v-else-if="sortDir === 'desc'">▼</span>
							</span>
						</span>
					</th>
					<th
						v-if="showColumnOptionsButton"
						class="actions table-column-options-header"
					>
						<div class="table-column-options-header-content">
							<span v-if="activeLayoutLabel" class="table-layout-label">{{ activeLayoutLabel }}</span>
							<span class="actions-menu-trigger">
								<button
									ref="columnOptionsButtonRef"
									type="button"
									aria-haspopup="dialog"
									aria-label="Column options"
									:aria-expanded="columnOptionsOpen ? 'true' : 'false'"
									@click="openColumnOptions"
								>
									<HugeiconsIcon
										:icon="LayoutGridIcon"
										width="0.95em"
										height="0.95em"
										:strokeWidth="2"
										aria-hidden="true"
									/>
								</button>
							</span>
						</div>
					</th>
				</tr>
			</thead>
			<tbody v-if="hasRows">
				<tr
					v-for="(row, rowIndex) in displayRows"
					:key="resolveRowKey(row, rowIndex)"
					:class="{ 'row-clickable': rowClickable }"
					@click="onRowClick(row, rowIndex, $event)"
				>
					<td
						v-for="(header, cellIndex) in visibleHeaders"
						:key="header.key || cellIndex"
						:class="[cellClasses(header), header.class]"
					>
						<slot
							v-if="slots[`cell-${header.key}`]"
							:name="`cell-${header.key}`"
							:row="row"
							:value="row[header.key]"
						/>
						<slot
							v-else-if="slots.cell"
							name="cell"
							:row="row"
							:value="row[header.key]"
						/>
						<span v-else>
							{{ row[header.key] }}
						</span>
					</td>
					<td
						v-if="showColumnOptionsButton"
						class="actions table-column-options-cell"
						aria-hidden="true"
					/>
				</tr>
			</tbody>
		</table>

		<div v-if="isFilteredEmpty" class="table-filtered-empty-state">
			<slot name="filtered-empty" :clear-filters="clearAllFilters">
				<p class="table-filtered-empty-message">No rows match the current filters.</p>
				<button type="button" class="neutral" @click="clearAllFilters">Clear filters</button>
			</slot>
		</div>
	</div>
	<div v-else class="table-empty-state" :class="{ loading: isLoading }">
		<span v-if="isLoading">Loading…</span>
		<slot v-else name="empty">
			<div class="table-empty">There are 0 items to show</div>
		</slot>
	</div>
	<div v-if="showPagination && showTableChrome" class="padding">
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

	<TableColumnOptionsPopover
		v-if="showColumnOptionsButton"
		v-model:open="columnOptionsOpen"
		:headers="props.headers"
		:column-keys="resolvedColumnOrder"
		:visible-keys="visibleColumnKeys"
		:column-priorities="resolvedColumnPriorities"
		:filters="activeFilters"
		:rows="props.data"
		:table-id="props.tableId"
		:layout-presets-enabled="layoutPresetsAvailable"
		:presets="savedPresets"
		:default-preset-id="defaultPresetId"
		:save-layout-preset="onSavePreset"
		:load-layout-preset="onLoadPreset"
		:delete-layout-preset="onDeletePreset"
		:set-default-layout-preset="onSetDefaultPreset"
		:load-developer-defaults="loadDeveloperDefaults"
		:anchor-el="columnOptionsButtonRef"
		@apply="onColumnOptionsApply"
		@cancel="onColumnOptionsCancel"
	/>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, useSlots, useAttrs } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { LayoutGridIcon } from '@hugeicons/core-free-icons'
import Pagination from './Pagination.vue'
import TableColumnFilterPopover from './TableColumnFilterPopover.vue'
import TableColumnOptionsPopover from './TableColumnOptionsPopover.vue'
import { useLongPress } from '../composables/useLongPress.js'
import {
	applyFilters,
	buildSelectOptions,
	cloneColumnFilterEntries,
	cloneFilters,
	countActiveFilters,
	isColumnFiltered,
	isFilterEntryActive,
	normalizeColumnFilterEntries,
	sortRows,
} from '../composables/tableFilters.js'
import {
	applyFilterQuery,
	buildFilterQuery,
	isFilterQueryActive,
} from '../composables/tableFilterQuery.js'
import {
	getDefaultPreset,
	getPresetById,
	listPresets,
	savePreset,
	deletePreset,
	setDefaultPreset,
	sanitizePresetState,
	layoutStatesEqual,
} from '../composables/tableColumnPresets.js'

const DEFAULT_PAGE_SIZE = 10

const sortBy = ref(null)
const sortDir = ref('asc')
const page = ref(1)
const pageSize = ref(DEFAULT_PAGE_SIZE)

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
	horizontalScroll: {
		type: Boolean,
		default: false,
	},
	stickyCols: {
		type: Number,
		default: null,
		validator: (value) => value === null || (value >= 1 && value <= 3),
	},
	columnOptions: {
		type: Boolean,
		default: true,
	},
	columnVisibility: {
		type: Object,
		default: undefined,
	},
	columnOrder: {
		type: Array,
		default: undefined,
	},
	columnPriorities: {
		type: Object,
		default: undefined,
	},
	tableId: {
		type: String,
		default: '',
	},
	loadSavedLayout: {
		type: Boolean,
		default: true,
	},
	defaultColumnVisibility: {
		type: Object,
		default: undefined,
	},
	rowKey: {
		type: [String, Function],
		default: 'id',
	},
	layoutPresets: {
		type: Object,
		default: null,
	},
})

const emit = defineEmits([
	'update:filters',
	'filter-change',
	'query-change',
	'fetch-error',
	'row-click',
	'update:columnVisibility',
	'column-visibility-change',
	'update:columnOrder',
	'column-order-change',
	'update:columnPriorities',
	'column-priorities-change',
])

const attrs = useAttrs()
const slots = useSlots()

const rowClickable = computed(() => Boolean(attrs.onRowClick))
const internalFilters = ref({})
const remoteRows = ref([])
const remoteTotal = ref(0)
const internalLoading = ref(false)
const fetchRequestId = ref(0)
const fetchAbortController = ref(null)
const fetchDebounceTimer = ref(null)

const filterPopoverOpen = ref(false)
const columnOptionsOpen = ref(false)
const columnOptionsButtonRef = ref(null)
const activeFilterHeader = ref(null)
const activeFilterAnchor = ref(null)
const activeFilterValue = ref([])
const internalHiddenColumnKeys = ref([])
const internalColumnOrder = ref([])
const internalColumnPriorities = ref({})
const savedPresets = ref([])
const defaultPresetId = ref(null)
const activeLayoutPresetId = ref(null)

const isRemote = computed(() => typeof props.fetchRows === 'function')

const layoutPresetsAvailable = computed(() => {
	if (isRemote.value) {
		return props.layoutPresets != null
	}
	return Boolean(props.tableId)
})

const activeFilters = computed(() => {
	if (!props.filterable) {
		return {}
	}
	return props.filters !== undefined ? props.filters : internalFilters.value
})

const activeFilterQuery = computed(() =>
	buildFilterQuery(activeFilters.value, props.headers, props.data),
)

const isLoading = computed(() => props.loading || internalLoading.value)

const configurableHeaders = computed(() =>
	props.headers.filter((header) => header?.key && header.hideable !== false && !header.hidden),
)

const manageableColumnKeys = computed(() =>
	props.headers
		.filter((header) => header?.key && !header.hidden)
		.map((header) => header.key),
)

const resolvedColumnOrder = computed(() => {
	const keys = manageableColumnKeys.value
	const order = props.columnOrder !== undefined ? props.columnOrder : internalColumnOrder.value
	const fromOrder = order.filter((key) => keys.includes(key))
	const missing = keys.filter((key) => !fromOrder.includes(key))
	return [...fromOrder, ...missing]
})

const orderedHeaders = computed(() => {
	const headerByKey = new Map(
		props.headers
			.filter((header) => header?.key)
			.map((header) => [header.key, header]),
	)
	return resolvedColumnOrder.value
		.map((key) => headerByKey.get(key))
		.filter(Boolean)
})

const showColumnOptionsButton = computed(() =>
	props.columnOptions && manageableColumnKeys.value.length > 0,
)

function isHeaderHidden(header) {
	if (header.hidden) {
		return true
	}
	if (props.columnVisibility !== undefined) {
		return props.columnVisibility[header.key] === false
	}
	return internalHiddenColumnKeys.value.includes(header.key)
}

const visibleHeaders = computed(() => orderedHeaders.value.filter((header) => !isHeaderHidden(header)))

const visibleColumnKeys = computed(() =>
	orderedHeaders.value
		.filter((header) => !isHeaderHidden(header))
		.map((header) => header.key),
)

function defaultColumnPriority(header) {
	return isValidColPriority(header?.colPriority) ? header.colPriority : null
}

function resolvedColumnPriority(header) {
	if (!header?.key) {
		return null
	}

	const overrides = props.columnPriorities !== undefined
		? props.columnPriorities
		: internalColumnPriorities.value

	if (Object.prototype.hasOwnProperty.call(overrides, header.key)) {
		const override = overrides[header.key]
		return isValidColPriority(override) ? override : null
	}

	return defaultColumnPriority(header)
}

const resolvedColumnPriorities = computed(() =>
	Object.fromEntries(
		manageableColumnKeys.value.map((key) => {
			const header = props.headers.find((item) => item.key === key)
			return [key, resolvedColumnPriority(header)]
		}),
	),
)

const hasColPriorities = computed(() =>
	orderedHeaders.value.some((header) => isValidColPriority(resolvedColumnPriority(header))),
)

const hasHorizontalScroll = computed(() =>
	props.horizontalScroll || (props.stickyCols >= 1 && props.stickyCols <= 3),
)

const needsTableWrapper = computed(() => hasColPriorities.value || hasHorizontalScroll.value)

const tableWrapperClasses = computed(() => {
	const classes = []
	if (hasColPriorities.value) {
		classes.push('responsive-cols')
	}
	if (hasHorizontalScroll.value) {
		classes.push('table-scroll')
		if (props.stickyCols >= 1 && props.stickyCols <= 3) {
			classes.push(`sticky-cols-${props.stickyCols}`)
		}
	}
	return classes
})

const filteredItems = computed(() => {
	if (isRemote.value) {
		return remoteRows.value
	}
	return applyFilterQuery(props.data, props.headers, activeFilterQuery.value)
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

const hasRows = computed(() => displayRows.value.length > 0)

const hasActiveFilters = computed(() =>
	isFilterQueryActive(activeFilterQuery.value, props.headers, props.data),
)

const hasSourceData = computed(() => {
	if (isRemote.value) {
		return remoteTotal.value > 0 || hasActiveFilters.value
	}
	return props.data.length > 0
})

const isFilteredEmpty = computed(() => {
	if (isLoading.value || hasRows.value || !hasActiveFilters.value) {
		return false
	}
	return hasSourceData.value
})

const showTableChrome = computed(() => hasRows.value || isFilteredEmpty.value)

watch(showTableChrome, (visible) => {
	if (visible) {
		return
	}

	filterPopoverOpen.value = false
	columnOptionsOpen.value = false
	activeFilterHeader.value = null
	activeFilterAnchor.value = null
	activeFilterValue.value = []
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

const queryParams = computed(() => {
	const params = {
		page: page.value,
		pageSize: pageSize.value,
		sortBy: sortBy.value,
		sortDir: sortDir.value,
		filterQuery: activeFilterQuery.value,
	}

	// Remote tables use filterQuery only; see docs/filter-query-v1.md.
	if (!isRemote.value) {
		params.filters = cloneFilters(activeFilters.value)
	}

	return params
})

function isValidColPriority(priority) {
	return Number.isInteger(priority) && priority >= 1 && priority <= 5
}

function colPriorityClass(priority) {
	return isValidColPriority(priority) ? `col-priority-${priority}` : null
}

function headerFilterCount(header) {
	if (!isHeaderFilterable(header)) {
		return 0
	}

	return normalizeColumnFilterEntries(activeFilters.value?.[header.key], header, props.data)
		.filter((entry) => isFilterEntryActive(entry))
		.length
}

function isHeaderFilterable(header) {
	return props.filterable && header.filterable !== false
}

function isHeaderFiltered(header) {
	return isColumnFiltered(activeFilters.value?.[header.key], header, props.data)
}

function headerClasses(header) {
	const priority = resolvedColumnPriority(header)
	return {
		sortable: header.sortable,
		filterable: isHeaderFilterable(header),
		filtered: isHeaderFiltered(header),
		'menu-open': filterPopoverOpen.value && activeFilterHeader.value?.key === header.key,
		[colPriorityClass(priority)]: isValidColPriority(priority),
	}
}

function cellClasses(header) {
	const priority = resolvedColumnPriority(header)
	return {
		hidden: header.hidden,
		[colPriorityClass(priority)]: isValidColPriority(priority),
	}
}

function resolveRowKey(row, index) {
	if (typeof props.rowKey === 'function') {
		const key = props.rowKey(row, index)
		if (key !== null && key !== undefined && key !== '') {
			return key
		}
		return index
	}

	if (typeof props.rowKey === 'string' && props.rowKey) {
		const key = row?.[props.rowKey]
		if (key !== null && key !== undefined && key !== '') {
			return key
		}
	}

	return index
}

function setFilters(nextFilters) {
	const cloned = cloneFilters(nextFilters)
	if (props.filters === undefined) {
		internalFilters.value = cloned
	}
	emit('update:filters', cloned)
	emit('filter-change', cloned)
}

function clearAllFilters() {
	setFilters({})
	page.value = 1
	if (isRemote.value) {
		scheduleFetchRows()
	}
	emitQueryChange()
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

function filteredRowIndex(displayIndex) {
	if (props.showPagination) {
		return (page.value - 1) * pageSize.value + displayIndex
	}
	return displayIndex
}

function onRowClick(row, displayIndex, event) {
	if (event.target.closest('a, button, input, select, textarea, [data-row-click-ignore]')) {
		return
	}
	emit('row-click', { row, index: filteredRowIndex(displayIndex) })
}

function openFilter(header, event) {
	if (!isHeaderFilterable(header)) {
		return
	}

	activeFilterHeader.value = header
	activeFilterAnchor.value = event.currentTarget
	activeFilterValue.value = cloneColumnFilterEntries(
		activeFilters.value?.[header.key],
		header,
		props.data,
	)
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

function onFilterApply(filterEntries) {
	if (!activeFilterHeader.value) {
		return
	}

	const nextFilters = cloneFilters(activeFilters.value)
	if (filterEntries?.length) {
		nextFilters[activeFilterHeader.value.key] = cloneColumnFilterEntries(filterEntries)
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
	activeFilterValue.value = []
}

function buildColumnVisibility(visibleKeys) {
	const visibleKeySet = new Set(visibleKeys)
	return Object.fromEntries(
		configurableHeaders.value.map((header) => [header.key, visibleKeySet.has(header.key)]),
	)
}

function setColumnVisibility(visibleKeys) {
	const visibleKeySet = new Set(visibleKeys)
	const hiddenKeys = configurableHeaders.value
		.map((header) => header.key)
		.filter((key) => !visibleKeySet.has(key))

	if (props.columnVisibility === undefined) {
		internalHiddenColumnKeys.value = hiddenKeys
	}

	const nextVisibility = buildColumnVisibility(visibleKeys)
	emit('update:columnVisibility', nextVisibility)
	emit('column-visibility-change', nextVisibility)
}

function syncInternalColumnOrder() {
	if (props.columnOrder !== undefined) {
		return
	}

	const keys = manageableColumnKeys.value
	const merged = [
		...internalColumnOrder.value.filter((key) => keys.includes(key)),
		...keys.filter((key) => !internalColumnOrder.value.includes(key)),
	]
	internalColumnOrder.value = merged
}

function setColumnOrder(order) {
	const keys = manageableColumnKeys.value
	const nextOrder = [
		...order.filter((key) => keys.includes(key)),
		...keys.filter((key) => !order.includes(key)),
	]

	if (props.columnOrder === undefined) {
		internalColumnOrder.value = nextOrder
	}

	emit('update:columnOrder', nextOrder)
	emit('column-order-change', nextOrder)
}

function setColumnPriorities(overrides) {
	const cloned = { ...overrides }

	if (props.columnPriorities === undefined) {
		internalColumnPriorities.value = cloned
	}

	emit('update:columnPriorities', cloned)
	emit('column-priorities-change', cloned)
}

function openColumnOptions() {
	columnOptionsOpen.value = true
	void refreshSavedPresets()
}

function onColumnOptionsApply({ order, visibleKeys, priorities }) {
	setColumnOrder(order)
	setColumnVisibility(visibleKeys)
	setColumnPriorities(priorities)
	updateActiveLayoutLabel()
}

function onColumnOptionsCancel() {
	columnOptionsOpen.value = false
}

async function refreshSavedPresets() {
	if (isRemote.value) {
		if (!props.layoutPresets || typeof props.layoutPresets.list !== 'function') {
			savedPresets.value = []
			defaultPresetId.value = null
			return
		}

		try {
			const result = await props.layoutPresets.list()
			savedPresets.value = Array.isArray(result?.presets) ? result.presets : []
			defaultPresetId.value = result?.defaultPresetId ?? null
		} catch {
			savedPresets.value = []
			defaultPresetId.value = null
		}
		return
	}

	if (!props.tableId) {
		savedPresets.value = []
		defaultPresetId.value = null
		return
	}

	const { presets, defaultPresetId: nextDefaultPresetId } = listPresets(props.tableId)
	savedPresets.value = presets
	defaultPresetId.value = nextDefaultPresetId
}

function findSavedPreset(presetId) {
	return savedPresets.value.find((preset) => preset.id === presetId)
		?? (props.tableId ? getPresetById(props.tableId, presetId) : null)
}

function getCurrentLayoutState() {
	const priorityOverrides = props.columnPriorities !== undefined
		? { ...props.columnPriorities }
		: { ...internalColumnPriorities.value }

	return {
		columnOrder: [...resolvedColumnOrder.value],
		columnVisibility: buildColumnVisibility(visibleColumnKeys.value),
		columnPriorities: priorityOverrides,
		filters: cloneFilters(activeFilters.value),
		sortBy: sortBy.value,
		sortDir: sortDir.value,
		pageSize: pageSize.value,
	}
}

function applyPresetState(state) {
	const sanitized = sanitizePresetState(state, props.headers, props.data)
	if (!sanitized) {
		return
	}

	if (sanitized.columnOrder?.length) {
		setColumnOrder(sanitized.columnOrder)
	}

	if (sanitized.columnVisibility) {
		const visibleKeys = manageableColumnKeys.value.filter(
			(key) => sanitized.columnVisibility[key] !== false,
		)
		const fallbackKeys = configurableHeaders.value
			.filter((header) => header.hideable === false)
			.map((header) => header.key)
		const nextVisibleKeys = visibleKeys.length > 0
			? visibleKeys
			: (fallbackKeys.length > 0 ? fallbackKeys : manageableColumnKeys.value.slice(0, 1))

		setColumnVisibility(nextVisibleKeys)
	}

	setColumnPriorities(sanitized.columnPriorities ?? {})
	setFilters(sanitized.filters ?? {})

	if (sanitized.sortBy) {
		sortBy.value = sanitized.sortBy
		sortDir.value = sanitized.sortDir === 'desc' ? 'desc' : 'asc'
	} else {
		sortBy.value = null
		sortDir.value = 'asc'
	}

	if (sanitized.pageSize) {
		pageSize.value = sanitized.pageSize
	}

	page.value = 1
	if (isRemote.value) {
		scheduleFetchRows()
	}
	emitQueryChange()
	updateActiveLayoutLabel()
}

async function onSavePreset({ name, setAsDefault }) {
	const state = getCurrentLayoutState()

	if (isRemote.value) {
		if (!props.layoutPresets || typeof props.layoutPresets.save !== 'function') {
			return { ok: false, error: 'Remote layout save is unavailable.' }
		}

		try {
			const result = await props.layoutPresets.save({ name, state, setAsDefault })
			if (result?.ok) {
				await refreshSavedPresets()
				if (result.preset?.id) {
					activeLayoutPresetId.value = result.preset.id
				}
				updateActiveLayoutLabel()
			}
			return result ?? { ok: false, error: 'Unable to save layout.' }
		} catch {
			return { ok: false, error: 'Unable to save layout.' }
		}
	}

	if (!props.tableId) {
		return { ok: false, error: 'Table identity is required.' }
	}

	const result = savePreset(props.tableId, {
		name,
		state,
		setAsDefault,
	})
	if (result.ok) {
		refreshSavedPresets()
		if (result.preset?.id) {
			activeLayoutPresetId.value = result.preset.id
		}
		updateActiveLayoutLabel()
	}
	return result
}

async function onLoadPreset(presetId) {
	if (isRemote.value) {
		if (!props.layoutPresets || typeof props.layoutPresets.load !== 'function') {
			return { ok: false, error: 'Remote layout load is unavailable.' }
		}

		try {
			const result = await props.layoutPresets.load(presetId)
			if (!result?.ok || !result.preset?.state) {
				return result ?? { ok: false, error: 'Preset not found.' }
			}

			applyPresetState(result.preset.state)
			activeLayoutPresetId.value = presetId
			updateActiveLayoutLabel()
			return { ok: true }
		} catch {
			return { ok: false, error: 'Unable to load layout.' }
		}
	}

	if (!props.tableId) {
		return { ok: false, error: 'Table identity is required.' }
	}

	const preset = getPresetById(props.tableId, presetId)
	if (!preset) {
		return { ok: false, error: 'Preset not found.' }
	}

	applyPresetState(preset.state)
	activeLayoutPresetId.value = presetId
	updateActiveLayoutLabel()
	return { ok: true }
}

async function onDeletePreset(presetId) {
	if (isRemote.value) {
		if (!props.layoutPresets || typeof props.layoutPresets.delete !== 'function') {
			return { ok: false, error: 'Remote layout delete is unavailable.' }
		}

		try {
			const result = await props.layoutPresets.delete(presetId)
			if (result?.ok) {
				await refreshSavedPresets()
				if (activeLayoutPresetId.value === presetId) {
					activeLayoutPresetId.value = null
				}
				updateActiveLayoutLabel()
			}
			return result ?? { ok: false, error: 'Unable to delete layout.' }
		} catch {
			return { ok: false, error: 'Unable to delete layout.' }
		}
	}

	if (!props.tableId) {
		return { ok: false, error: 'Table identity is required.' }
	}

	const result = deletePreset(props.tableId, presetId)
	if (result.ok) {
		refreshSavedPresets()
		if (activeLayoutPresetId.value === presetId) {
			activeLayoutPresetId.value = null
		}
		updateActiveLayoutLabel()
	}
	return result
}

async function onSetDefaultPreset(presetId) {
	if (isRemote.value) {
		if (!props.layoutPresets || typeof props.layoutPresets.setDefault !== 'function') {
			return { ok: false, error: 'Unable to update default layout.' }
		}

		try {
			const result = await props.layoutPresets.setDefault(presetId)
			if (result?.ok) {
				await refreshSavedPresets()
			}
			return result ?? { ok: false, error: 'Unable to update default layout.' }
		} catch {
			return { ok: false, error: 'Unable to update default layout.' }
		}
	}

	if (!props.tableId) {
		return { ok: false, error: 'Table identity is required.' }
	}

	const result = setDefaultPreset(props.tableId, presetId)
	if (result.ok) {
		refreshSavedPresets()
	}
	return result
}

function getDeveloperDefaultColumnOrder() {
	return props.headers
		.filter((header) => header?.key && !header.hidden)
		.map((header) => header.key)
}

function getDeveloperDefaultVisibleKeys() {
	const keys = manageableColumnKeys.value
	if (props.defaultColumnVisibility !== undefined) {
		return keys.filter((key) => props.defaultColumnVisibility[key] !== false)
	}
	return [...keys]
}

function getDeveloperDefaultLayoutState() {
	return {
		columnOrder: getDeveloperDefaultColumnOrder(),
		columnVisibility: buildColumnVisibility(getDeveloperDefaultVisibleKeys()),
		columnPriorities: {},
		filters: {},
		sortBy: null,
		sortDir: 'asc',
		pageSize: DEFAULT_PAGE_SIZE,
	}
}

function updateActiveLayoutLabel() {
	const current = getCurrentLayoutState()
	const defaults = getDeveloperDefaultLayoutState()

	if (layoutStatesEqual(current, defaults, props.headers, props.data)) {
		activeLayoutPresetId.value = null
		return
	}

	if (activeLayoutPresetId.value && layoutPresetsAvailable.value) {
		const preset = findSavedPreset(activeLayoutPresetId.value)
		if (preset && layoutStatesEqual(current, preset.state, props.headers, props.data)) {
			return
		}
	}

	if (layoutPresetsAvailable.value) {
		const matchingPreset = savedPresets.value.find((preset) =>
			layoutStatesEqual(current, preset.state, props.headers, props.data))
		if (matchingPreset) {
			activeLayoutPresetId.value = matchingPreset.id
			return
		}
	}

	activeLayoutPresetId.value = null
}

const activeLayoutLabel = computed(() => {
	const current = getCurrentLayoutState()
	const defaults = getDeveloperDefaultLayoutState()

	if (layoutStatesEqual(current, defaults, props.headers, props.data)) {
		return ''
	}

	if (activeLayoutPresetId.value && layoutPresetsAvailable.value) {
		const preset = findSavedPreset(activeLayoutPresetId.value)
		if (preset?.name) {
			return preset.name
		}
	}

	return 'Custom'
})

function loadDeveloperDefaults() {
	setFilters({})
	sortBy.value = null
	sortDir.value = 'asc'
	setColumnOrder(getDeveloperDefaultColumnOrder())
	setColumnPriorities({})

	const visibleKeys = getDeveloperDefaultVisibleKeys()
	const fixedVisibleKeys = configurableHeaders.value
		.filter((header) => header.hideable === false)
		.map((header) => header.key)
	const nextVisibleKeys = visibleKeys.length > 0
		? visibleKeys
		: (fixedVisibleKeys.length > 0 ? fixedVisibleKeys : manageableColumnKeys.value.slice(0, 1))

	setColumnVisibility(nextVisibleKeys)
	activeLayoutPresetId.value = null
	pageSize.value = DEFAULT_PAGE_SIZE
	page.value = 1
	if (isRemote.value) {
		scheduleFetchRows()
	}
	emitQueryChange()
	updateActiveLayoutLabel()
	return { ok: true }
}

watch(() => props.columnOptions, (enabled) => {
	if (!enabled) {
		columnOptionsOpen.value = false
	}
})

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

watch(
	() => props.columnVisibility,
	(nextVisibility) => {
		if (nextVisibility === undefined) {
			return
		}
		internalHiddenColumnKeys.value = configurableHeaders.value
			.filter((header) => nextVisibility[header.key] === false)
			.map((header) => header.key)
	},
	{ deep: true },
)

watch(
	() => props.columnOrder,
	(nextOrder) => {
		if (nextOrder === undefined) {
			return
		}
		internalColumnOrder.value = [...nextOrder]
	},
	{ deep: true },
)

watch(
	() => props.columnPriorities,
	(nextPriorities) => {
		if (nextPriorities === undefined) {
			return
		}
		internalColumnPriorities.value = { ...nextPriorities }
	},
	{ deep: true },
)

watch(
	manageableColumnKeys,
	() => {
		syncInternalColumnOrder()
	},
	{ immediate: true },
)

watch(
	() => [props.tableId, props.layoutPresets],
	() => {
		void refreshSavedPresets()
		updateActiveLayoutLabel()
	},
	{ immediate: true },
)

watch(
	[
		() => resolvedColumnOrder.value,
		() => visibleColumnKeys.value,
		() => props.columnPriorities,
		internalColumnPriorities,
		activeFilters,
		sortBy,
		sortDir,
		pageSize,
		() => props.headers,
		savedPresets,
	],
	() => {
		updateActiveLayoutLabel()
	},
	{ deep: true },
)

watch(sortedItems, () => {
	if (!isRemote.value) {
		page.value = 1
	}
})

onMounted(async () => {
	if (props.loadSavedLayout) {
		if (isRemote.value && props.layoutPresets && typeof props.layoutPresets.getDefault === 'function') {
			try {
				const result = await props.layoutPresets.getDefault()
				if (result?.preset?.state) {
					applyPresetState(result.preset.state)
					activeLayoutPresetId.value = result.preset.id
				}
			} catch {
				// Ignore default layout load failures in remote mode.
			}
		} else if (!isRemote.value && props.tableId) {
			const preset = getDefaultPreset(props.tableId)
			if (preset?.state) {
				applyPresetState(preset.state)
				activeLayoutPresetId.value = preset.id
			}
		}
	}

	await refreshSavedPresets()
	updateActiveLayoutLabel()
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
	color: var(--table-header-active-fg);
}

table thead th.filterable {
	cursor: context-menu;
}

table thead th.filtered {
	color: var(--table-header-active-fg);
}

table thead th.menu-open {
	background-color: var(--table-header-active-bg);
	color: var(--table-header-fg);
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

tbody tr.row-clickable {
	cursor: pointer;
}

.table-empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 6rem;
	padding: 2rem 1rem;
	text-align: center;
	color: var(--text-muted, #666);
}

.table-empty-state.loading {
	opacity: 0.65;
}

.table-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
}

.table-filtered-empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	padding: 2rem 1rem;
	text-align: center;
	color: var(--text-muted, #666);
}

.table-filtered-empty-message {
	margin: 0;
}

th.table-column-options-header,
td.table-column-options-cell {
	padding-right: 1rem;
	text-align: right;
	vertical-align: middle;
}

th.table-column-options-header {
	width: auto;
	min-width: 2.5rem;
	max-width: none;
	white-space: nowrap;
}

td.table-column-options-cell {
	width: 2.5rem;
	min-width: 2.5rem;
	max-width: 2.5rem;
}

.table-column-options-header-content {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
	width: 100%;
}

.table-layout-label {
	font-size: 0.85rem;
	color: var(--text-muted, #666);
	max-width: 10rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

th.table-column-options-header .actions-menu-trigger {
	display: inline-flex;
	justify-content: flex-end;
	flex: 0 0 auto;
}

.table-scroll th.table-column-options-header,
.table-scroll td.table-column-options-cell {
	position: sticky;
	right: 0;
	z-index: 1;
	background-color: var(--table-sticky-bg);
	box-shadow: -1px 0 0 var(--border-color);
}

.table-scroll thead th.table-column-options-header {
	z-index: 2;
}

.table-scroll table.row-hover tbody tr:hover td.table-column-options-cell,
.table-scroll table.row-hover tbody tr:focus-within td.table-column-options-cell {
	background-color: var(--table-sticky-hover-bg);
}

th.actions .actions-menu-trigger button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: normal;
	padding: 0.2em 0.5em;
	line-height: 1;
	vertical-align: middle;
	background: transparent;
	border: 0;
	color: inherit;
	cursor: pointer;
}

th.actions .actions-menu-trigger button:hover,
th.actions .actions-menu-trigger button:focus-visible {
	background-color: var(--hover-background-color);
	color: var(--text-color, inherit);
}
</style>
