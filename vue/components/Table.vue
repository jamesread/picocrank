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
						v-if="selectable"
						class="table-select-col"
						@click.stop
					>
						<label class="table-select-label">
							<input
								type="checkbox"
								:checked="allDisplayRowsSelected"
								:indeterminate="someDisplayRowsSelected"
								:aria-label="allDisplayRowsSelected ? 'Deselect all rows on this page' : 'Select all rows on this page'"
								@change="toggleSelectAllDisplayRows"
							>
						</label>
					</th>
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

						<span v-if="isHeaderGrouped(header)" class="group-indicator" title="Grouped" aria-hidden="true">⊟</span>

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
						<span class="actions-menu-trigger">
							<button
								ref="columnOptionsButtonRef"
								type="button"
								aria-haspopup="dialog"
								aria-label="Column options"
								:aria-expanded="columnOptionsOpen ? 'true' : 'false'"
								@click.stop="openColumnOptions"
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
					</th>
				</tr>
			</thead>
			<tbody v-if="hasRows">
				<template v-for="(item, itemIndex) in displayBodyItems" :key="bodyItemKey(item, itemIndex)">
					<tr
						v-if="item.kind === 'group'"
						class="table-group-row"
						:class="{ 'table-group-row-collapsed': item.collapsed }"
					>
						<td
							v-if="selectable"
							class="table-select-col table-group-cell"
							data-row-click-ignore
						/>
						<td
							:colspan="bodyGroupColspan"
							class="table-group-cell"
						>
							<button
								type="button"
								class="table-group-toggle neutral"
								:aria-expanded="item.collapsed ? 'false' : 'true'"
								:aria-label="item.collapsed ? 'Expand group' : 'Collapse group'"
								data-row-click-ignore
								@click.stop="toggleGroupCollapsed(item.groupId)"
							>
								<span aria-hidden="true">{{ item.collapsed ? '▶' : '▼' }}</span>
							</button>
							<span class="table-group-label">{{ formatGroupValue(item.value) }}</span>
							<span class="table-group-count subtle">({{ item.count }})</span>
						</td>
					</tr>
					<tr
						v-else
						:class="[
							{
								'row-clickable': rowClickable,
								'row-selected': selectable && isRowSelected(item.row, item.displayIndex),
								'row-context-menu-active': isRowContextMenuTarget(item.row, item.displayIndex),
							},
							resolveRowClass(item.row, item.displayIndex),
						]"
						:style="resolveRowStyle(item.row, item.displayIndex)"
						@click="onRowClick(item.row, item.displayIndex, $event)"
						@contextmenu="onRowContextMenu(item.row, item.displayIndex, $event)"
					>
						<td
							v-if="selectable"
							class="table-select-col"
							data-row-click-ignore
							@click.stop
						>
							<label class="table-select-label">
								<input
									type="checkbox"
									:checked="isRowSelected(item.row, item.displayIndex)"
									:aria-label="`Select row ${resolveRowKey(item.row, item.displayIndex)}`"
									@click.stop="rememberSelectionCheckboxClick(item.row, item.displayIndex, $event)"
									@change="onSelectionCheckboxChange(item.row, item.displayIndex)"
								>
							</label>
						</td>
						<td
							v-for="(header, cellIndex) in visibleHeaders"
							:key="header.key || cellIndex"
							:ref="(element) => registerCellElement(element, item.row, header, item.displayIndex)"
							v-bind="resolveCellAttrs(item.row, header, item.displayIndex)"
							:colspan="bodyColumnColspan(cellIndex) || undefined"
							:class="[
								cellClasses(header),
								header.class,
								resolveCellClass(item.row, header, item.displayIndex),
								{ 'table-active-cell': isActiveCell(item.row, header, item.displayIndex) },
								isLastColumnWithOptions(cellIndex) ? 'table-last-column-with-options' : null,
							]"
							:style="resolveCellStyle(item.row, header, item.displayIndex)"
							:tabindex="isActiveCell(item.row, header, item.displayIndex) ? 0 : -1"
							@click="onCellClick(item.row, header, item.displayIndex, $event)"
						>
							<slot
								v-if="slots[`cell-${header.key}`]"
								:name="`cell-${header.key}`"
								:row="item.row"
								:value="item.row[header.key]"
								:header="header"
								:row-index="item.displayIndex"
								:source-index="sourceRowIndex(item.row, item.displayIndex)"
							/>
							<slot
								v-else-if="slots.cell"
								name="cell"
								:row="item.row"
								:value="item.row[header.key]"
								:header="header"
								:row-index="item.displayIndex"
								:source-index="sourceRowIndex(item.row, item.displayIndex)"
							/>
							<span v-else>
								{{ item.row[header.key] }}
							</span>
						</td>
					</tr>
				</template>
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
		:can-hide="canHideActiveFilterColumn"
		:can-group-by="canGroupByActiveFilterColumn"
		:is-grouped-column="isActiveFilterHeaderGrouped"
		@apply="onFilterApply"
		@clear="onFilterClear"
		@cancel="onFilterCancel"
		@hide="onFilterHideColumn"
		@group-by="onFilterGroupBy"
	/>

	<TableColumnOptionsPopover
		v-if="showColumnOptionsButton"
		v-model:open="columnOptionsOpen"
		:headers="props.headers"
		:column-keys="resolvedColumnOrder"
		:visible-keys="visibleColumnKeys"
		:column-priorities="resolvedColumnPriorities"
		:default-column-priorities="defaultColumnPriorities"
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
		:group-by="activeGroupBy"
		:groupable="props.groupable"
		:anchor-el="columnOptionsButtonRef"
		@apply="onColumnOptionsApply"
		@cancel="onColumnOptionsCancel"
	/>

	<TableRowContextMenu
		v-model:open="rowContextMenuOpen"
		:items="rowContextMenuItems"
		:client-x="rowContextMenuX"
		:client-y="rowContextMenuY"
		:target-count="rowContextMenuTargetKeys.length"
		@select="onRowContextMenuSelect"
	/>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, useSlots, useAttrs } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { LayoutGridIcon } from '@hugeicons/core-free-icons'
import Pagination from './Pagination.vue'
import TableColumnFilterPopover from './TableColumnFilterPopover.vue'
import TableColumnOptionsPopover from './TableColumnOptionsPopover.vue'
import TableRowContextMenu from './TableRowContextMenu.vue'
import { useLongPress } from '../composables/useLongPress.js'
import {
	buildSelectOptions,
	cloneColumnFilterEntries,
	cloneFilters,
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
import {
	defaultColumnPriorityForIndex,
	isValidColPriority,
} from '../composables/tableColumnPriorities.js'
import {
	buildDisplayBodyItems,
	formatGroupValue,
	isHeaderGroupable,
} from '../composables/tableGroupBy.js'

const DEFAULT_PAGE_SIZE = 10

const props = defineProps({
	headers: {
		type: Array,
		default: () => ['id'],
	},
	data: {
		type: Array,
		default: () => [],
	},
	sortBy: {
		type: [String, Number],
		default: undefined,
	},
	sortDir: {
		type: String,
		default: undefined,
		validator: (value) => value === undefined || value === 'asc' || value === 'desc',
	},
	page: {
		type: Number,
		default: undefined,
		validator: (value) => value === undefined || (Number.isFinite(value) && value >= 1),
	},
	pageSize: {
		type: Number,
		default: undefined,
		validator: (value) => value === undefined || (Number.isFinite(value) && value >= 1),
	},
	resetPageOnSort: {
		type: Boolean,
		default: true,
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
	responsiveColumns: {
		type: Boolean,
		default: true,
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
	selectable: {
		type: Boolean,
		default: false,
	},
	selectedKeys: {
		type: Array,
		default: undefined,
	},
	selectionClickMode: {
		type: String,
		default: 'row',
		validator: (value) => ['row', 'checkbox', 'modifier', 'extended'].includes(value),
	},
	activeCell: {
		type: Object,
		default: undefined,
	},
	rowClass: {
		type: Function,
		default: null,
	},
	rowStyle: {
		type: Function,
		default: null,
	},
	cellClass: {
		type: Function,
		default: null,
	},
	cellStyle: {
		type: Function,
		default: null,
	},
	cellAttrs: {
		type: Function,
		default: null,
	},
	/**
	 * Row right-click menu. Array of items, or a function that returns items
	 * for the click context. Each item may include `action(ctx)` where
	 * `ctx.keys` / `ctx.rows` are the target selection (clicked row, or all
	 * selected rows when the click is inside the current multi-selection).
	 */
	rowContextMenu: {
		type: [Array, Function],
		default: null,
	},
	groupable: {
		type: Boolean,
		default: true,
	},
	groupBy: {
		type: String,
		default: undefined,
	},
})

const emit = defineEmits([
	'update:filters',
	'filter-change',
	'query-change',
	'fetch-error',
	'row-click',
	'cell-click',
	'update:sortBy',
	'update:sortDir',
	'update:page',
	'update:pageSize',
	'update:selectedKeys',
	'selection-change',
	'update:activeCell',
	'row-context-menu',
	'row-context-menu-action',
	'update:columnVisibility',
	'column-visibility-change',
	'update:columnOrder',
	'column-order-change',
	'update:columnPriorities',
	'column-priorities-change',
	'update:layoutLabel',
	'layout-label-change',
	'update:groupBy',
	'group-by-change',
])

const attrs = useAttrs()
const slots = useSlots()

function normalizePage(value) {
	const numeric = Number(value)
	return Number.isFinite(numeric) && numeric >= 1 ? Math.floor(numeric) : 1
}

function normalizePageSize(value) {
	const numeric = Number(value)
	return Number.isFinite(numeric) && numeric >= 1 ? Math.floor(numeric) : DEFAULT_PAGE_SIZE
}

function normalizeSortDir(value) {
	return value === 'desc' ? 'desc' : 'asc'
}

function normalizeActiveCell(value) {
	if (
		!value
		|| typeof value !== 'object'
		|| value.rowKey === null
		|| value.rowKey === undefined
		|| value.columnKey === null
		|| value.columnKey === undefined
	) {
		return null
	}
	return {
		rowKey: value.rowKey,
		columnKey: value.columnKey,
	}
}

const internalSortBy = ref(props.sortBy !== undefined ? props.sortBy : null)
const internalSortDir = ref(normalizeSortDir(props.sortDir))
const internalPage = ref(normalizePage(props.page))
const internalPageSize = ref(normalizePageSize(props.pageSize))
const internalActiveCell = ref(normalizeActiveCell(props.activeCell))

const sortBy = computed({
	get: () => props.sortBy !== undefined ? props.sortBy : internalSortBy.value,
	set: (value) => {
		const nextValue = value ?? null
		if (nextValue === sortBy.value) {
			return
		}
		if (props.sortBy === undefined) {
			internalSortBy.value = nextValue
		}
		emit('update:sortBy', nextValue)
	},
})

const sortDir = computed({
	get: () => props.sortDir !== undefined ? normalizeSortDir(props.sortDir) : internalSortDir.value,
	set: (value) => {
		const nextValue = normalizeSortDir(value)
		if (nextValue === sortDir.value) {
			return
		}
		if (props.sortDir === undefined) {
			internalSortDir.value = nextValue
		}
		emit('update:sortDir', nextValue)
	},
})

const page = computed({
	get: () => props.page !== undefined ? normalizePage(props.page) : internalPage.value,
	set: (value) => {
		const nextValue = normalizePage(value)
		if (nextValue === page.value) {
			return
		}
		if (props.page === undefined) {
			internalPage.value = nextValue
		}
		emit('update:page', nextValue)
	},
})

const pageSize = computed({
	get: () => props.pageSize !== undefined ? normalizePageSize(props.pageSize) : internalPageSize.value,
	set: (value) => {
		const nextValue = normalizePageSize(value)
		if (nextValue === pageSize.value) {
			return
		}
		if (props.pageSize === undefined) {
			internalPageSize.value = nextValue
		}
		emit('update:pageSize', nextValue)
	},
})

const activeCell = computed(() => (
	props.activeCell !== undefined ? normalizeActiveCell(props.activeCell) : internalActiveCell.value
))

const rowClickable = computed(() =>
	Boolean(attrs.onRowClick)
	|| (props.selectable && props.selectionClickMode !== 'checkbox'),
)
const internalFilters = ref({})
const internalSelectedKeys = ref([])
const selectionAnchorKey = ref(null)
const pendingSelectionCheckboxClick = ref(null)
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
const internalGroupBy = ref(null)
const collapsedGroupIds = ref([])

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

function isLastVisibleColumn(index) {
	return index === visibleHeaders.value.length - 1
}

function isLastColumnWithOptions(index) {
	return showColumnOptionsButton.value && isLastVisibleColumn(index)
}

function bodyColumnColspan(index) {
	return isLastColumnWithOptions(index) ? 2 : null
}

const bodyGroupColspan = computed(() => {
	let colspan = visibleHeaders.value.length
	if (showColumnOptionsButton.value) {
		colspan += 1
	}
	return colspan
})

function bodyItemKey(item, index) {
	if (item.kind === 'group') {
		return `group-${item.groupId}`
	}
	return resolveRowKey(item.row, item.sourceIndex ?? index)
}

function isHeaderGrouped(header) {
	return Boolean(activeGroupBy.value && header?.key === activeGroupBy.value)
}

function toggleGroupCollapsed(groupId) {
	const next = new Set(collapsedGroupIdSet.value)
	if (next.has(groupId)) {
		next.delete(groupId)
	} else {
		next.add(groupId)
	}
	collapsedGroupIds.value = [...next]
}

function setGroupBy(nextGroupBy) {
	const header = props.headers.find((item) => item.key === nextGroupBy)
	const normalized = isHeaderGroupable(header, props.groupable) ? nextGroupBy : null

	if (props.groupBy === undefined) {
		internalGroupBy.value = normalized
	}

	collapsedGroupIds.value = []
	page.value = 1
	emit('update:groupBy', normalized)
	emit('group-by-change', normalized)
	if (isRemote.value) {
		scheduleFetchRows()
	}
	emitQueryChange()
}

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

const hasHorizontalScroll = computed(() =>
	props.horizontalScroll || (props.stickyCols >= 1 && props.stickyCols <= 3),
)

const useResponsiveColumns = computed(() =>
	props.responsiveColumns && !hasHorizontalScroll.value,
)

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

	if (!useResponsiveColumns.value) {
		return null
	}

	const index = visibleHeaders.value.findIndex((item) => item.key === header.key)
	if (index < 0) {
		return null
	}

	return defaultColumnPriorityForIndex(header, index, useResponsiveColumns.value)
}

const defaultColumnPriorities = computed(() => {
	if (!useResponsiveColumns.value) {
		return Object.fromEntries(
			visibleHeaders.value
				.filter((header) => isValidColPriority(header?.colPriority))
				.map((header) => [header.key, header.colPriority]),
		)
	}

	return Object.fromEntries(
		visibleHeaders.value.flatMap((header, index) => {
			const priority = defaultColumnPriorityForIndex(header, index, true)
			return isValidColPriority(priority) ? [[header.key, priority]] : []
		}),
	)
})

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

const activeSortHeader = computed(() =>
	props.headers.find((header) => header?.key === sortBy.value),
)

const sortedItems = computed(() => {
	if (isRemote.value) {
		return filteredItems.value
	}
	return sortRows(
		filteredItems.value,
		sortBy.value,
		sortDir.value,
		activeSortHeader.value?.comparator,
	)
})

const activeGroupBy = computed(() => {
	if (!props.groupable) {
		return null
	}
	if (props.groupBy !== undefined) {
		return props.groupBy || null
	}
	return internalGroupBy.value
})

const collapsedGroupIdSet = computed(() => new Set(collapsedGroupIds.value))

const displayBodyItems = computed(() => {
	const paginate = !isRemote.value && props.showPagination
	const items = buildDisplayBodyItems(sortedItems.value, {
		groupBy: activeGroupBy.value,
		page: page.value,
		pageSize: pageSize.value,
		paginate,
		collapsedGroupIds: collapsedGroupIdSet.value,
	})
	let displayIndex = 0
	return items.map((item) => {
		if (item.kind !== 'row') {
			return item
		}
		const indexed = { ...item, displayIndex }
		displayIndex += 1
		return indexed
	})
})

const displayRows = computed(() =>
	displayBodyItems.value
		.filter((item) => item.kind === 'row')
		.map((item) => item.row),
)

const hasRows = computed(() => displayBodyItems.value.length > 0)

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
		groupBy: activeGroupBy.value,
		filterQuery: activeFilterQuery.value,
	}

	// Remote tables use filterQuery only; see docs/filter-query-v1.md.
	if (!isRemote.value) {
		params.filters = cloneFilters(activeFilters.value)
	}

	return params
})

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
		grouped: isHeaderGrouped(header),
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

function sourceRowIndex(row, displayIndex) {
	const sourceRows = isRemote.value ? remoteRows.value : props.data
	const index = sourceRows.indexOf(row)
	return index >= 0 ? index : filteredRowIndex(displayIndex)
}

function rowContext(row, rowIndex) {
	return {
		row,
		rowIndex,
		sourceIndex: sourceRowIndex(row, rowIndex),
	}
}

function cellContext(row, header, rowIndex) {
	return {
		...rowContext(row, rowIndex),
		value: row?.[header.key],
		header,
	}
}

function resolveRowClass(row, rowIndex) {
	return props.rowClass?.(rowContext(row, rowIndex))
}

function resolveRowStyle(row, rowIndex) {
	return props.rowStyle?.(rowContext(row, rowIndex))
}

function resolveCellClass(row, header, rowIndex) {
	return props.cellClass?.(cellContext(row, header, rowIndex))
}

function resolveCellStyle(row, header, rowIndex) {
	return props.cellStyle?.(cellContext(row, header, rowIndex))
}

function resolveCellAttrs(row, header, rowIndex) {
	const value = props.cellAttrs?.(cellContext(row, header, rowIndex))
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {}
	}

	const {
		class: _class,
		style: _style,
		key: _key,
		ref: _ref,
		...safeAttrs
	} = value
	return safeAttrs
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

function activeCellsEqual(left, right) {
	return left?.rowKey === right?.rowKey && left?.columnKey === right?.columnKey
}

function setActiveCell(nextCell) {
	const normalized = normalizeActiveCell(nextCell)
	if (activeCellsEqual(normalized, activeCell.value)) {
		return
	}
	if (props.activeCell === undefined) {
		internalActiveCell.value = normalized
	}
	emit('update:activeCell', normalized)
}

function clearActiveCell() {
	setActiveCell(null)
}

function isActiveCell(row, header, rowIndex) {
	const current = activeCell.value
	return Boolean(
		current
		&& current.rowKey === resolveRowKey(row, rowIndex)
		&& current.columnKey === header.key,
	)
}

const activeCellElements = new Map()

function registerCellElement(element, row, header, rowIndex) {
	const rowKey = resolveRowKey(row, rowIndex)
	let rowCells = activeCellElements.get(rowKey)

	if (!element) {
		rowCells?.delete(header.key)
		if (rowCells?.size === 0) {
			activeCellElements.delete(rowKey)
		}
		return
	}

	if (!rowCells) {
		rowCells = new Map()
		activeCellElements.set(rowKey, rowCells)
	}
	rowCells.set(header.key, element)
}

function focusCell(cell, options) {
	if (!cell) {
		return false
	}
	const element = activeCellElements.get(cell.rowKey)?.get(cell.columnKey)
	if (!element) {
		return false
	}
	element.focus(options)
	return true
}

function focusActiveCell(options) {
	return focusCell(activeCell.value, options)
}

function cellContextAt(rowIndex, columnIndex) {
	const row = displayRows.value[rowIndex]
	const header = visibleHeaders.value[columnIndex]
	if (!row || !header) {
		return null
	}

	return {
		...cellContext(row, header, rowIndex),
		rowKey: resolveRowKey(row, rowIndex),
		columnKey: header.key,
		columnIndex,
	}
}

function getActiveCellContext() {
	const current = activeCell.value
	if (!current) {
		return null
	}

	const rowIndex = displayRows.value.findIndex(
		(row, index) => resolveRowKey(row, index) === current.rowKey,
	)
	const columnIndex = visibleHeaders.value.findIndex(
		(header) => header.key === current.columnKey,
	)
	if (rowIndex < 0 || columnIndex < 0) {
		return null
	}

	return cellContextAt(rowIndex, columnIndex)
}

function clampGridIndex(value, maximum) {
	const numeric = Number(value)
	const normalized = Number.isFinite(numeric) ? Math.trunc(numeric) : 0
	return Math.min(Math.max(normalized, 0), maximum)
}

function scheduleCellFocus(cell, options) {
	if (!options?.focus) {
		return
	}
	void nextTick(() => focusCell(cell, options.focusOptions))
}

function activateCellAt(rowIndex, columnIndex, options = {}) {
	if (displayRows.value.length === 0 || visibleHeaders.value.length === 0) {
		return null
	}

	const nextRowIndex = clampGridIndex(rowIndex, displayRows.value.length - 1)
	const nextColumnIndex = clampGridIndex(columnIndex, visibleHeaders.value.length - 1)
	const context = cellContextAt(nextRowIndex, nextColumnIndex)
	const nextActiveCell = {
		rowKey: context.rowKey,
		columnKey: context.columnKey,
	}

	setActiveCell(nextActiveCell)
	scheduleCellFocus(nextActiveCell, options)
	return context
}

function moveActiveCell(rowDelta, columnDelta, options = {}) {
	if (displayRows.value.length === 0 || visibleHeaders.value.length === 0) {
		return null
	}

	const current = getActiveCellContext()
	if (!current) {
		return activateCellAt(0, 0, options)
	}

	const normalizedRowDelta = Number.isFinite(Number(rowDelta)) ? Math.trunc(Number(rowDelta)) : 0
	const normalizedColumnDelta = Number.isFinite(Number(columnDelta))
		? Math.trunc(Number(columnDelta))
		: 0
	const rowIndex = clampGridIndex(
		current.rowIndex + normalizedRowDelta,
		displayRows.value.length - 1,
	)
	let columnIndex

	if (options.wrapColumns) {
		const linearIndex = (rowIndex * visibleHeaders.value.length)
			+ current.columnIndex
			+ normalizedColumnDelta
		const clampedLinearIndex = clampGridIndex(
			linearIndex,
			(displayRows.value.length * visibleHeaders.value.length) - 1,
		)
		return activateCellAt(
			Math.floor(clampedLinearIndex / visibleHeaders.value.length),
			clampedLinearIndex % visibleHeaders.value.length,
			options,
		)
	}

	columnIndex = clampGridIndex(
		current.columnIndex + normalizedColumnDelta,
		visibleHeaders.value.length - 1,
	)
	return activateCellAt(rowIndex, columnIndex, options)
}

function onCellClick(row, header, rowIndex, event) {
	const context = cellContext(row, header, rowIndex)
	const nextActiveCell = {
		rowKey: resolveRowKey(row, rowIndex),
		columnKey: header.key,
	}
	setActiveCell(nextActiveCell)
	emit('cell-click', {
		...context,
		...nextActiveCell,
		event,
	})
}

const activeSelectedKeys = computed(() => (
	props.selectedKeys !== undefined ? props.selectedKeys : internalSelectedKeys.value
))

const selectedKeySet = computed(() => new Set(activeSelectedKeys.value))

function isRowSelected(row, index) {
	return selectedKeySet.value.has(resolveRowKey(row, index))
}

function setSelectedKeys(nextKeys) {
	const unique = [...new Set(nextKeys)]
	if (props.selectedKeys === undefined) {
		internalSelectedKeys.value = unique
	}
	emit('update:selectedKeys', unique)
	emit('selection-change', unique)
}

function toggleRowSelection(row, index) {
	const key = resolveRowKey(row, index)
	const current = activeSelectedKeys.value
	selectionAnchorKey.value = key
	if (selectedKeySet.value.has(key)) {
		setSelectedKeys(current.filter((item) => item !== key))
		return
	}
	setSelectedKeys([...current, key])
}

function replaceRowSelection(row, index) {
	const key = resolveRowKey(row, index)
	selectionAnchorKey.value = key
	setSelectedKeys([key])
}

const displayRowKeys = computed(() =>
	displayRows.value.map((row, index) => resolveRowKey(row, index)),
)

function selectRowRange(row, index, { updateAnchor = true } = {}) {
	const key = resolveRowKey(row, index)
	const anchorIndex = displayRowKeys.value.findIndex((item) => item === selectionAnchorKey.value)
	const targetIndex = displayRowKeys.value.findIndex((item) => item === key)

	if (anchorIndex < 0 || targetIndex < 0) {
		setSelectedKeys([...activeSelectedKeys.value, key])
		selectionAnchorKey.value = key
		return
	}

	const from = Math.min(anchorIndex, targetIndex)
	const to = Math.max(anchorIndex, targetIndex)
	setSelectedKeys([
		...activeSelectedKeys.value,
		...displayRowKeys.value.slice(from, to + 1),
	])
	if (updateAnchor) {
		selectionAnchorKey.value = key
	}
}

function rememberSelectionCheckboxClick(row, index, event) {
	pendingSelectionCheckboxClick.value = {
		key: resolveRowKey(row, index),
		shiftKey: event.shiftKey,
	}
}

function onSelectionCheckboxChange(row, index) {
	const key = resolveRowKey(row, index)
	const shiftKey = (
		pendingSelectionCheckboxClick.value?.key === key
		&& pendingSelectionCheckboxClick.value.shiftKey
	)
	pendingSelectionCheckboxClick.value = null

	if (shiftKey) {
		selectRowRange(row, index)
		return
	}
	toggleRowSelection(row, index)
}

const allDisplayRowsSelected = computed(() => {
	const keys = displayRowKeys.value
	return keys.length > 0 && keys.every((key) => selectedKeySet.value.has(key))
})

const someDisplayRowsSelected = computed(() => {
	if (allDisplayRowsSelected.value) {
		return false
	}
	return displayRowKeys.value.some((key) => selectedKeySet.value.has(key))
})

function toggleSelectAllDisplayRows() {
	const pageKeys = displayRowKeys.value
	if (pageKeys.length === 0) {
		return
	}

	if (allDisplayRowsSelected.value) {
		const pageKeySet = new Set(pageKeys)
		setSelectedKeys(activeSelectedKeys.value.filter((key) => !pageKeySet.has(key)))
		selectionAnchorKey.value = null
		return
	}

	setSelectedKeys([...activeSelectedKeys.value, ...pageKeys])
	selectionAnchorKey.value = pageKeys.at(-1) ?? null
}

watch(() => props.selectable, (enabled) => {
	if (!enabled) {
		setSelectedKeys([])
		selectionAnchorKey.value = null
	}
})

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

	if (props.selectable) {
		if (props.selectionClickMode === 'extended') {
			if (event.ctrlKey || event.metaKey) {
				toggleRowSelection(row, displayIndex)
				return
			}

			const hasRangeAnchor = displayRowKeys.value.includes(selectionAnchorKey.value)
			if (event.shiftKey && hasRangeAnchor) {
				selectRowRange(row, displayIndex, { updateAnchor: false })
				return
			}

			replaceRowSelection(row, displayIndex)
			return
		}

		if (
			props.selectionClickMode !== 'checkbox'
			&& event.shiftKey
		) {
			selectRowRange(row, displayIndex)
			return
		}

		if (
			props.selectionClickMode === 'row'
			|| (
				props.selectionClickMode === 'modifier'
				&& (event.ctrlKey || event.metaKey)
			)
		) {
			toggleRowSelection(row, displayIndex)
			return
		}
	}

	emit('row-click', {
		row,
		index: filteredRowIndex(displayIndex),
		event,
	})
}

const rowContextMenuOpen = ref(false)
const rowContextMenuX = ref(0)
const rowContextMenuY = ref(0)
const rowContextMenuItems = ref([])
const rowContextMenuTargetKeys = ref([])
const rowContextMenuAnchor = ref(null)

const rowContextMenuTargetKeySet = computed(() => new Set(rowContextMenuTargetKeys.value))

function isRowContextMenuTarget(row, index) {
	return rowContextMenuOpen.value && rowContextMenuTargetKeySet.value.has(resolveRowKey(row, index))
}

const hasRowContextMenu = computed(() => {
	if (typeof props.rowContextMenu === 'function') {
		return true
	}
	return Array.isArray(props.rowContextMenu) && props.rowContextMenu.length > 0
})

function buildRowLookup() {
	const map = new Map()
	const addRows = (rows) => {
		rows.forEach((row, index) => {
			const key = resolveRowKey(row, index)
			if (!map.has(key)) {
				map.set(key, row)
			}
		})
	}

	if (isRemote.value) {
		addRows(remoteRows.value)
	} else {
		addRows(props.data)
	}
	addRows(displayRows.value)
	return map
}

function resolveTargetRows(keys) {
	const lookup = buildRowLookup()
	return keys.map((key) => lookup.get(key)).filter((row) => row != null)
}

function normalizeContextMenuItems(rawItems) {
	if (!Array.isArray(rawItems)) {
		return []
	}
	return rawItems.filter((item) => item && (item.divider || item.label || item.id))
}

function closeRowContextMenu() {
	rowContextMenuOpen.value = false
	rowContextMenuItems.value = []
	rowContextMenuTargetKeys.value = []
	rowContextMenuAnchor.value = null
}

function onRowContextMenu(row, sourceIndex, event) {
	if (!hasRowContextMenu.value) {
		return
	}
	if (event.target.closest('a, button, input, select, textarea, [data-row-click-ignore]')) {
		return
	}

	event.preventDefault()
	event.stopPropagation()

	const key = resolveRowKey(row, sourceIndex)
	const index = filteredRowIndex(sourceIndex)
	let targetKeys

	if (props.selectable && selectedKeySet.value.has(key) && activeSelectedKeys.value.length > 0) {
		targetKeys = [...activeSelectedKeys.value]
	} else {
		targetKeys = [key]
		if (props.selectable) {
			setSelectedKeys([key])
		}
	}

	const rows = resolveTargetRows(targetKeys)
	const ctx = {
		row,
		key,
		index,
		rows,
		keys: targetKeys,
		selectedKeys: [...activeSelectedKeys.value],
	}

	const rawItems = typeof props.rowContextMenu === 'function'
		? props.rowContextMenu(ctx)
		: props.rowContextMenu
	const items = normalizeContextMenuItems(rawItems)
	if (items.length === 0) {
		closeRowContextMenu()
		return
	}

	rowContextMenuAnchor.value = ctx
	rowContextMenuTargetKeys.value = targetKeys
	rowContextMenuItems.value = items
	rowContextMenuX.value = event.clientX
	rowContextMenuY.value = event.clientY
	rowContextMenuOpen.value = true

	emit('row-context-menu', {
		...ctx,
		event,
	})
}

function onRowContextMenuSelect(item) {
	const anchor = rowContextMenuAnchor.value
	const keys = [...rowContextMenuTargetKeys.value]
	const lookup = buildRowLookup()
	const rows = keys.map((key) => lookup.get(key)).filter((row) => row != null)
	const selectedKeys = [...activeSelectedKeys.value]
	const payload = {
		item,
		row: anchor?.row,
		key: anchor?.key,
		index: anchor?.index,
		rows,
		keys,
		selectedKeys,
	}

	if (typeof item.action === 'function') {
		item.action(payload)
	}

	emit('row-context-menu-action', payload)
	closeRowContextMenu()
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

const canGroupByActiveFilterColumn = computed(() => {
	if (!props.groupable || !activeFilterHeader.value) {
		return false
	}
	return isHeaderGroupable(activeFilterHeader.value, props.groupable)
})

const isActiveFilterHeaderGrouped = computed(() =>
	Boolean(activeFilterHeader.value?.key && activeFilterHeader.value.key === activeGroupBy.value),
)

const canHideActiveFilterColumn = computed(() => {
	if (!showColumnOptionsButton.value || !activeFilterHeader.value) {
		return false
	}
	const header = activeFilterHeader.value
	if (!header.key || header.hideable === false || header.hidden) {
		return false
	}
	if (!isHeaderHidden(header) && visibleColumnKeys.value.length <= 1) {
		return false
	}
	return configurableHeaders.value.some((item) => item.key === header.key)
})

function onFilterGroupBy(columnKey) {
	setGroupBy(columnKey || null)
	filterPopoverOpen.value = false
	onFilterCancel()
}

function onFilterHideColumn() {
	const header = activeFilterHeader.value
	if (!header?.key || !canHideActiveFilterColumn.value) {
		onFilterCancel()
		return
	}

	const nextVisibleKeys = visibleColumnKeys.value.filter((key) => key !== header.key)
	if (nextVisibleKeys.length === 0) {
		onFilterCancel()
		return
	}

	setColumnVisibility(nextVisibleKeys)
	updateActiveLayoutLabel()
	filterPopoverOpen.value = false
	onFilterCancel()
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

function onColumnOptionsApply({ order, visibleKeys, priorities, groupBy }) {
	setColumnOrder(order)
	setColumnVisibility(visibleKeys)
	setColumnPriorities(priorities)
	if (groupBy !== undefined && groupBy !== activeGroupBy.value) {
		setGroupBy(groupBy)
	}
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
		groupBy: activeGroupBy.value,
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

	if (sanitized.groupBy) {
		setGroupBy(sanitized.groupBy)
	} else {
		setGroupBy(null)
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
		groupBy: null,
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

function emitLayoutLabelChange(label) {
	emit('update:layoutLabel', label)
	emit('layout-label-change', label)
}

function loadDeveloperDefaults() {
	setFilters({})
	sortBy.value = null
	sortDir.value = 'asc'
	setGroupBy(null)
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
	pageSize,
	() => {
		page.value = 1
		if (isRemote.value) {
			scheduleFetchRows()
		}
		emitQueryChange()
	},
)

watch(
	activeGroupBy,
	() => {
		page.value = 1
		if (isRemote.value) {
			scheduleFetchRows()
		}
		emitQueryChange()
	},
)

watch(
	() => [sortBy.value, sortDir.value],
	() => {
		if (props.resetPageOnSort) {
			page.value = 1
		}
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

watch(() => props.sortBy, (value) => {
	if (value !== undefined) {
		internalSortBy.value = value ?? null
	}
})

watch(() => props.sortDir, (value) => {
	if (value !== undefined) {
		internalSortDir.value = normalizeSortDir(value)
	}
})

watch(() => props.page, (value) => {
	if (value !== undefined) {
		internalPage.value = normalizePage(value)
	}
})

watch(() => props.pageSize, (value) => {
	if (value !== undefined) {
		internalPageSize.value = normalizePageSize(value)
	}
})

watch(
	() => props.activeCell,
	(value) => {
		if (value !== undefined) {
			internalActiveCell.value = normalizeActiveCell(value)
		}
	},
	{ deep: true },
)

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
	() => props.groupBy,
	(nextGroupBy) => {
		if (nextGroupBy !== undefined) {
			collapsedGroupIds.value = []
		}
	},
)

watch(
	() => props.groupable,
	(enabled) => {
		if (!enabled) {
			setGroupBy(null)
		}
	},
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
		activeGroupBy,
		pageSize,
		() => props.headers,
		savedPresets,
	],
	() => {
		updateActiveLayoutLabel()
	},
	{ deep: true },
)

watch(activeLayoutLabel, (label) => {
	emitLayoutLabelChange(label)
}, { immediate: true })

watch(
	() => props.data,
	() => {
		if (!isRemote.value) {
			page.value = 1
		}
	},
	{ deep: true },
)

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

defineExpose({
	layoutLabel: activeLayoutLabel,
	loadDeveloperDefaults,
	clearFilters: clearAllFilters,
	focusActiveCell,
	clearActiveCell,
	activateCellAt,
	moveActiveCell,
	getActiveCellContext,
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

.group-indicator {
	display: inline-block;
	margin-right: 0.25rem;
	font-size: 0.85em;
	opacity: 0.85;
}

table thead th.grouped {
	color: var(--table-header-active-fg);
}

tbody tr.table-group-row > td.table-group-cell {
	background-color: var(--table-header-active-bg);
	color: var(--table-header-fg);
	font-weight: 600;
	padding-top: 0.65rem;
	padding-bottom: 0.65rem;
}

.table-group-toggle {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 1.5rem;
	margin-right: 0.35rem;
	padding: 0.1rem 0.35rem;
	vertical-align: middle;
}

.table-group-label {
	margin-right: 0.35rem;
}

.table-group-count {
	font-weight: normal;
}

td:first-child,
th:first-child {
	padding-left: 1rem;
}

th.table-select-col,
td.table-select-col {
	width: 2.5rem;
	min-width: 2.5rem;
	max-width: 2.5rem;
	text-align: center;
	vertical-align: middle;
	padding-left: 1rem;
	padding-right: 0.25rem;
}

.table-select-label {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin: 0;
	cursor: pointer;
}

tbody tr.row-clickable {
	cursor: pointer;
}

tbody td.table-active-cell {
	outline: 2px solid currentColor;
	outline-offset: -2px;
}

tbody td.table-active-cell:focus,
tbody td.table-active-cell:focus-visible {
	outline-width: 3px;
}

tbody tr.row-selected > td {
	background-color: var(--control-checked-bg);
	color: var(--control-checked-fg);
}

table.row-hover tbody tr.row-selected:hover > td,
table.row-hover tbody tr.row-selected:focus-within > td,
table.row-hover tbody tr.row-selected.row-context-menu-active > td {
	background-color: var(--control-checked-hover-bg);
	color: var(--control-checked-fg);
}

/* Keep hover styling while the row context menu is open (pointer has left the row). */
table.row-hover tbody tr.row-context-menu-active > td {
	background-color: var(--table-row-hover-bg);
	color: var(--table-row-hover-fg);
}

/* Beat Femtocrank sticky cell backgrounds so selection remains visible while scrolling. */
.table-scroll.sticky-cols-1 table tbody tr.row-selected > td,
.table-scroll.sticky-cols-2 table tbody tr.row-selected > td,
.table-scroll.sticky-cols-3 table tbody tr.row-selected > td {
	background-color: var(--control-checked-bg);
	color: var(--control-checked-fg);
}

.table-scroll.sticky-cols-1 table.row-hover tbody tr.row-selected:hover > td,
.table-scroll.sticky-cols-1 table.row-hover tbody tr.row-selected:focus-within > td,
.table-scroll.sticky-cols-1 table.row-hover tbody tr.row-selected.row-context-menu-active > td,
.table-scroll.sticky-cols-2 table.row-hover tbody tr.row-selected:hover > td,
.table-scroll.sticky-cols-2 table.row-hover tbody tr.row-selected:focus-within > td,
.table-scroll.sticky-cols-2 table.row-hover tbody tr.row-selected.row-context-menu-active > td,
.table-scroll.sticky-cols-3 table.row-hover tbody tr.row-selected:hover > td,
.table-scroll.sticky-cols-3 table.row-hover tbody tr.row-selected:focus-within > td,
.table-scroll.sticky-cols-3 table.row-hover tbody tr.row-selected.row-context-menu-active > td {
	background-color: var(--control-checked-hover-bg);
	color: var(--control-checked-fg);
}

.table-scroll.sticky-cols-1 table.row-hover tbody tr.row-context-menu-active > td,
.table-scroll.sticky-cols-2 table.row-hover tbody tr.row-context-menu-active > td,
.table-scroll.sticky-cols-3 table.row-hover tbody tr.row-context-menu-active > td {
	background-color: var(--table-row-hover-bg);
	color: var(--table-row-hover-fg);
}

.table-empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 6rem;
	padding: 2rem 1rem;
	text-align: center;
	color: var(--table-muted-fg);
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
	color: var(--table-muted-fg);
}

.table-filtered-empty-message {
	margin: 0;
}

th.table-column-options-header {
	padding-right: 1rem;
	text-align: right;
	vertical-align: middle;
	width: auto;
	min-width: 2.5rem;
	max-width: none;
	white-space: nowrap;
}

td.table-last-column-with-options {
	padding-right: 1rem;
	vertical-align: middle;
}

th.table-column-options-header .actions-menu-trigger {
	display: inline-flex;
	justify-content: flex-end;
	flex: 0 0 auto;
}

.table-scroll {
	min-width: 0;
	max-width: 100%;
	contain: inline-size;
}

.table-scroll th.table-column-options-header {
	position: sticky;
	right: 0;
	z-index: 2;
	background-color: var(--table-sticky-bg);
	box-shadow: -1px 0 0 var(--border-color);
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
