<template>
	<Teleport to="body">
		<div
			v-if="open"
			ref="popoverRef"
			class="table-column-options-popover"
			role="dialog"
			:aria-labelledby="titleId"
			:style="popoverStyle"
			@click.stop
		>
			<div class="popover-body">
				<h4 :id="titleId" ref="titleRef" class="popover-title">
					Column Options
				</h4>

				<Tabs
					class="column-options-tabs"
					:tabs="optionTabs"
					default-tab="custom"
					@tab-change="onOptionTabChange"
				>
					<template #tab-custom>
						<p class="subtle column-options-help">
							Drag rows or use the arrows to reorder. Toggle checkboxes to show or hide columns. Set responsive priority (1 hides first) when using column priorities layout.
						</p>

						<div ref="listScrollRef" class="column-options-scroll" :style="listScrollStyle">
							<ul class="column-options-list">
								<li
									v-for="key in draftOrder"
									:key="key"
									class="column-options-item"
									:class="{
										'is-dragging': draggingKey === key,
										'is-drag-over': dragOverKey === key && draggingKey !== key,
										'is-fixed': !isOrderable(key),
									}"
									:draggable="isOrderable(key)"
									@dragstart="onDragStart(key, $event)"
									@dragover.prevent="onDragOver(key)"
									@drop.prevent="onDrop(key)"
									@dragend="onDragEnd"
								>
									<label class="column-options-label">
										<input
											type="checkbox"
											:checked="isVisible(key)"
											:disabled="!isHideable(key) || (isVisible(key) && draftVisibleKeys.length <= 1)"
											@change="toggleVisible(key)"
										/>
										<span>{{ columnDisplayLabel(key) }}</span>
									</label>

									<select
										v-if="isPriorityConfigurable(key)"
										class="column-options-priority"
										:value="prioritySelectValue(key)"
										:aria-label="`Priority for ${columnLabel(key)} column`"
										@change="setPriority(key, $event.target.value)"
									>
										<option value="">Never hide</option>
										<option
											v-for="level in priorityLevels"
											:key="level"
											:value="level"
										>
											{{ priorityOptionLabel(level) }}
										</option>
									</select>
									<span v-else class="column-options-priority-spacer" aria-hidden="true" />

									<div class="column-options-reorder">
										<div class="column-options-move" role="group" :aria-label="`Move ${columnLabel(key)} column`">
											<button
												type="button"
												class="neutral column-options-move-button"
												:disabled="!canMove(key, -1)"
												:aria-label="`Move ${columnLabel(key)} up`"
												@click="moveColumn(key, -1)"
											>
												<HugeiconsIcon
													:icon="ArrowUp01Icon"
													width="0.9em"
													height="0.9em"
													:strokeWidth="2"
													aria-hidden="true"
												/>
											</button>
											<button
												type="button"
												class="neutral column-options-move-button"
												:disabled="!canMove(key, 1)"
												:aria-label="`Move ${columnLabel(key)} down`"
												@click="moveColumn(key, 1)"
											>
												<HugeiconsIcon
													:icon="ArrowDown01Icon"
													width="0.9em"
													height="0.9em"
													:strokeWidth="2"
													aria-hidden="true"
												/>
											</button>
										</div>

										<span
											class="column-options-drag-handle"
											:class="{ disabled: !isOrderable(key) }"
											aria-hidden="true"
										>
											<HugeiconsIcon
												:icon="DragDropVerticalIcon"
												width="0.95em"
												height="0.95em"
												:strokeWidth="2"
											/>
										</span>
									</div>
								</li>
							</ul>
						</div>
					</template>

					<template #tab-load>
						<div class="column-options-load-panel">
							<template v-if="layoutPresetsEnabled">
								<ul v-if="presets.length > 0" class="column-options-preset-list">
									<li
										v-for="preset in presets"
										:key="preset.id"
										class="column-options-preset-item"
									>
										<div class="column-options-preset-meta">
											<strong>{{ preset.name }}</strong>
											<span v-if="preset.id === defaultPresetId" class="tag">Default</span>
											<p class="subtle column-options-preset-date">{{ formatPresetDate(preset.savedAt) }}</p>
										</div>
										<div class="column-options-preset-actions" role="group" :aria-label="`Actions for ${preset.name}`">
											<button
												type="button"
												class="neutral"
												@click="submitLoadPreset(preset.id)"
											>
												Load
											</button>
											<button
												v-if="preset.id !== defaultPresetId"
												type="button"
												class="neutral"
												@click="submitSetDefaultPreset(preset.id)"
											>
												Set default
											</button>
											<button
												v-else
												type="button"
												class="neutral"
												@click="submitSetDefaultPreset(null)"
											>
												Clear default
											</button>
											<button
												type="button"
												class="neutral"
												@click="submitDeletePreset(preset.id, preset.name)"
											>
												Delete
											</button>
										</div>
									</li>
								</ul>
								<p v-else class="subtle column-options-tab-placeholder">No saved layouts yet.</p>
							</template>
							<p v-else class="subtle column-options-tab-placeholder">
								Provide a <code>table-id</code> or remote <code>layout-presets</code> callbacks to enable saved layouts.
							</p>

							<p v-if="loadError" class="column-options-tab-error">{{ loadError }}</p>

							<div class="column-options-load-default">
								<button type="button" class="neutral" @click="submitLoadDeveloperDefaults">
									Load default
								</button>
							</div>
						</div>
					</template>

					<template #tab-save>
						<div v-if="!layoutPresetsEnabled" class="column-options-tab-placeholder">
							<p class="subtle">Provide a <code>table-id</code> or remote <code>layout-presets</code> callbacks to enable saved layouts.</p>
						</div>
						<div v-else class="column-options-save-panel">
							<p class="subtle column-options-save-help">
								Saves the current table view (filters, page size, column order, visibility, and priorities).
							</p>
							<label class="column-options-save-field">
								<span class="field-label">Layout name</span>
								<input
									v-model="savePresetName"
									type="text"
									placeholder="e.g. Managers view"
									@keydown.enter.prevent="submitSavePreset"
								/>
							</label>
							<label class="column-options-save-default">
								<input v-model="saveAsDefault" type="checkbox" />
								<span>Set as default</span>
							</label>
							<p v-if="saveError" class="column-options-tab-error">{{ saveError }}</p>
							<p v-if="saveSuccess" class="column-options-tab-success">{{ saveSuccess }}</p>
							<button type="button" @click="submitSavePreset">Save layout</button>
						</div>
					</template>
				</Tabs>
			</div>

			<div ref="actionsRef" role="toolbar" class="popover-actions">
				<button type="button" class="neutral" @click="close">Close</button>
				<button type="button" class="neutral" @click="showAll">Show all</button>
			</div>
		</div>
	</Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	DragDropVerticalIcon,
} from '@hugeicons/core-free-icons'
import {
	isFilterEntryActive,
	normalizeColumnFilterEntries,
} from '../composables/tableFilters.js'
import Tabs from './Tabs.vue'

const optionTabs = [
	{ id: 'custom', label: 'Custom' },
	{ id: 'load', label: 'Load' },
	{ id: 'save', label: 'Save' },
]

const props = defineProps({
	open: {
		type: Boolean,
		default: false,
	},
	headers: {
		type: Array,
		default: () => [],
	},
	columnKeys: {
		type: Array,
		default: () => [],
	},
	visibleKeys: {
		type: Array,
		default: () => [],
	},
	columnPriorities: {
		type: Object,
		default: () => ({}),
	},
	anchorEl: {
		type: Object,
		default: null,
	},
	filters: {
		type: Object,
		default: () => ({}),
	},
	rows: {
		type: Array,
		default: () => [],
	},
	tableId: {
		type: String,
		default: '',
	},
	layoutPresetsEnabled: {
		type: Boolean,
		default: false,
	},
	presets: {
		type: Array,
		default: () => [],
	},
	defaultPresetId: {
		type: String,
		default: null,
	},
	saveLayoutPreset: {
		type: Function,
		default: null,
	},
	loadLayoutPreset: {
		type: Function,
		default: null,
	},
	deleteLayoutPreset: {
		type: Function,
		default: null,
	},
	setDefaultLayoutPreset: {
		type: Function,
		default: null,
	},
	loadDeveloperDefaults: {
		type: Function,
		default: null,
	},
})

const emit = defineEmits(['update:open', 'apply', 'cancel'])

const MIN_VISIBLE_OPTIONS = 8
const MAX_VISIBLE_OPTIONS = 20
const VIEWPORT_MARGIN_PX = 8

const popoverRef = ref(null)
const titleRef = ref(null)
const actionsRef = ref(null)
const listScrollRef = ref(null)
const popoverStyle = ref({ top: '0px', left: '0px' })
const listScrollStyle = ref({})
const titleId = useId()
const priorityLevels = [1, 2, 3, 4, 5]
const draftOrder = ref([])
const draftVisibleKeys = ref([])
const draftPriorities = ref({})
const draggingKey = ref(null)
const dragOverKey = ref(null)
const savePresetName = ref('')
const saveAsDefault = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const loadError = ref('')

const headerByKey = computed(() => new Map(
	props.headers
		.filter((header) => header?.key)
		.map((header) => [header.key, header]),
))

function columnLabel(key) {
	return headerByKey.value.get(key)?.label || key
}

function columnFilterCount(key) {
	const header = headerByKey.value.get(key)
	if (!header || header.filterable === false) {
		return 0
	}

	return normalizeColumnFilterEntries(props.filters?.[key], header, props.rows)
		.filter((entry) => isFilterEntryActive(entry))
		.length
}

function columnDisplayLabel(key) {
	const label = columnLabel(key)
	const count = columnFilterCount(key)
	if (count > 0) {
		return `${label} (${count})`
	}
	return label
}

function isHideable(key) {
	const header = headerByKey.value.get(key)
	return header?.hideable !== false && !header?.hidden
}

function isOrderable(key) {
	const header = headerByKey.value.get(key)
	return header?.orderable !== false && !header?.hidden
}

function isPriorityConfigurable(key) {
	const header = headerByKey.value.get(key)
	return header?.colPriorityConfigurable !== false && !header?.hidden
}

function isValidColPriority(priority) {
	return Number.isInteger(priority) && priority >= 1 && priority <= 5
}

function defaultColumnPriority(key) {
	const header = headerByKey.value.get(key)
	return isValidColPriority(header?.colPriority) ? header.colPriority : null
}

function normalizePriority(value) {
	if (value === '' || value === null || value === undefined) {
		return null
	}
	const numeric = Number(value)
	return isValidColPriority(numeric) ? numeric : null
}

function prioritySelectValue(key) {
	const value = draftPriorities.value[key]
	return value == null ? '' : String(value)
}

function priorityOptionLabel(level) {
	if (level === 1) {
		return '1 - Hide first'
	}
	if (level === 5) {
		return '5 - Hide last'
	}
	return String(level)
}

function setPriority(key, rawValue) {
	draftPriorities.value = {
		...draftPriorities.value,
		[key]: normalizePriority(rawValue),
	}
	emitLiveChange()
}

function isVisible(key) {
	if (!isHideable(key)) {
		return true
	}
	return draftVisibleKeys.value.includes(key)
}

function positionPopover() {
	const anchor = props.anchorEl
	if (!anchor || !popoverRef.value) {
		return
	}

	const rect = anchor.getBoundingClientRect()
	const popoverRect = popoverRef.value.getBoundingClientRect()
	const margin = VIEWPORT_MARGIN_PX
	let top = rect.bottom + margin
	let left = rect.right - popoverRect.width

	if (left + popoverRect.width > window.innerWidth - margin) {
		left = window.innerWidth - popoverRect.width - margin
	}
	if (left < margin) {
		left = margin
	}
	if (top + popoverRect.height > window.innerHeight - margin) {
		top = rect.top - popoverRect.height - margin
	}
	if (top < margin) {
		top = margin
	}

	popoverStyle.value = {
		top: `${top}px`,
		left: `${left}px`,
	}
}

function updateListScrollLimit() {
	listScrollStyle.value = {}

	if (!popoverRef.value || !listScrollRef.value) {
		return
	}

	const anchor = props.anchorEl
	const anchorRect = anchor?.getBoundingClientRect()
	const popoverEl = popoverRef.value
	const titleHeight = titleRef.value?.offsetHeight ?? 0
	const tabsHeaderHeight = popoverEl.querySelector('.column-options-tabs .tabs-header')?.offsetHeight ?? 0
	const helpHeight = popoverEl.querySelector('.column-options-help')?.offsetHeight ?? 0
	const actionsHeight = actionsRef.value?.offsetHeight ?? 0
	const popoverStyles = window.getComputedStyle(popoverEl)
	const paddingTop = Number.parseFloat(popoverStyles.paddingTop) || 0
	const paddingBottom = Number.parseFloat(popoverStyles.paddingBottom) || 0
	const bodyGap = 12

	let availablePopoverHeight = window.innerHeight - (VIEWPORT_MARGIN_PX * 2)
	if (anchorRect) {
		const spaceBelow = window.innerHeight - VIEWPORT_MARGIN_PX - anchorRect.bottom
		const spaceAbove = anchorRect.top - VIEWPORT_MARGIN_PX
		availablePopoverHeight = Math.max(spaceBelow, spaceAbove)
	}

	const reservedHeight = paddingTop + paddingBottom + titleHeight + tabsHeaderHeight + helpHeight + actionsHeight + bodyGap
	const optionsAreaBudget = Math.max(0, availablePopoverHeight - reservedHeight)

	const firstItem = listScrollRef.value.querySelector('.column-options-item')
	const rowHeight = firstItem?.offsetHeight || 40
	const optionCount = draftOrder.value.length

	const maxVisibleByViewport = Math.floor(optionsAreaBudget / rowHeight)
	const visibleSlots = Math.min(
		MAX_VISIBLE_OPTIONS,
		Math.max(MIN_VISIBLE_OPTIONS, maxVisibleByViewport),
	)

	const rowsToShow = optionCount === 0
		? MIN_VISIBLE_OPTIONS
		: Math.min(
			Math.max(optionCount, MIN_VISIBLE_OPTIONS),
			visibleSlots,
		)

	listScrollStyle.value = {
		maxHeight: `${rowsToShow * rowHeight}px`,
		...(optionCount > 0 && optionCount < MIN_VISIBLE_OPTIONS
			? { minHeight: `${MIN_VISIBLE_OPTIONS * rowHeight}px` }
			: {}),
	}
}

function resetPresetForm() {
	savePresetName.value = ''
	saveAsDefault.value = false
	saveError.value = ''
	saveSuccess.value = ''
	loadError.value = ''
}

function formatPresetDate(savedAt) {
	if (!savedAt) {
		return ''
	}
	const date = new Date(savedAt)
	if (Number.isNaN(date.getTime())) {
		return savedAt
	}
	return date.toLocaleString()
}

async function submitSavePreset() {
	saveError.value = ''
	saveSuccess.value = ''

	if (!props.saveLayoutPreset) {
		saveError.value = 'Save is unavailable.'
		return
	}

	const result = await Promise.resolve(props.saveLayoutPreset({
		name: savePresetName.value,
		setAsDefault: saveAsDefault.value,
	}))

	if (!result?.ok) {
		saveError.value = result?.error || 'Unable to save layout.'
		return
	}

	saveSuccess.value = `Saved “${result.preset.name}”.`
	savePresetName.value = ''
	saveAsDefault.value = false
}

async function submitLoadPreset(presetId) {
	loadError.value = ''
	const result = await Promise.resolve(props.loadLayoutPreset?.(presetId))
	if (!result?.ok) {
		loadError.value = result?.error || 'Unable to load layout.'
		return
	}
	resetDraft()
}

async function submitDeletePreset(presetId, presetName) {
	loadError.value = ''
	if (!globalThis.confirm?.(`Delete saved layout “${presetName}”?`)) {
		return
	}

	const result = await Promise.resolve(props.deleteLayoutPreset?.(presetId))
	if (!result?.ok) {
		loadError.value = result?.error || 'Unable to delete layout.'
	}
}

async function submitSetDefaultPreset(presetId) {
	loadError.value = ''
	const result = await Promise.resolve(props.setDefaultLayoutPreset?.(presetId))
	if (!result?.ok) {
		loadError.value = result?.error || 'Unable to update default layout.'
	}
}

function submitLoadDeveloperDefaults() {
	loadError.value = ''
	const result = props.loadDeveloperDefaults?.()
	if (!result?.ok) {
		loadError.value = result?.error || 'Unable to load defaults.'
		return
	}
	resetDraft()
}

function resetDraft() {
	draftOrder.value = [...props.columnKeys]
	draftVisibleKeys.value = [...props.visibleKeys]
	draftPriorities.value = { ...props.columnPriorities }
}

function toggleVisible(key) {
	if (!isHideable(key)) {
		return
	}

	if (isVisible(key)) {
		if (draftVisibleKeys.value.length <= 1) {
			return
		}
		draftVisibleKeys.value = draftVisibleKeys.value.filter((item) => item !== key)
		emitLiveChange()
		return
	}

	draftVisibleKeys.value = [...draftVisibleKeys.value, key]
	emitLiveChange()
}

function canMove(key, direction) {
	if (!isOrderable(key)) {
		return false
	}

	let index = draftOrder.value.indexOf(key)
	while (index >= 0 && index < draftOrder.value.length) {
		index += direction
		if (index < 0 || index >= draftOrder.value.length) {
			return false
		}
		if (isOrderable(draftOrder.value[index])) {
			return true
		}
	}

	return false
}

function moveColumn(key, direction) {
	if (!canMove(key, direction)) {
		return
	}

	const order = [...draftOrder.value]
	let index = order.indexOf(key)

	while (true) {
		const targetIndex = index + direction
		if (targetIndex < 0 || targetIndex >= order.length) {
			return
		}
		if (isOrderable(order[targetIndex])) {
			const swapKey = order[targetIndex]
			order[index] = swapKey
			order[targetIndex] = key
			draftOrder.value = order
			emitLiveChange()
			return
		}
		index = targetIndex
	}
}

function onDragStart(key, event) {
	if (!isOrderable(key)) {
		event.preventDefault()
		return
	}
	draggingKey.value = key
	dragOverKey.value = key
	event.dataTransfer.effectAllowed = 'move'
	event.dataTransfer.setData('text/plain', key)
}

function onDragOver(key) {
	if (!draggingKey.value || draggingKey.value === key) {
		return
	}
	dragOverKey.value = key
}

function onDrop(targetKey) {
	const sourceKey = draggingKey.value
	if (!sourceKey || sourceKey === targetKey) {
		return
	}

	const order = draftOrder.value.filter((key) => key !== sourceKey)
	const targetIndex = order.indexOf(targetKey)
	if (targetIndex === -1) {
		return
	}

	order.splice(targetIndex, 0, sourceKey)
	draftOrder.value = order
	emitLiveChange()
}

function onDragEnd() {
	draggingKey.value = null
	dragOverKey.value = null
}

function onDocumentPointerDown(event) {
	if (!props.open || !popoverRef.value) {
		return
	}
	if (popoverRef.value.contains(event.target)) {
		return
	}
	if (props.anchorEl?.contains?.(event.target)) {
		return
	}
	close()
}

function onDocumentKeyDown(event) {
	if (!props.open) {
		return
	}
	if (event.key === 'Escape') {
		event.preventDefault()
		close()
	}
}

function buildVisibleKeys() {
	const visibleKeySet = new Set(draftVisibleKeys.value)
	return draftOrder.value.filter((key) => !isHideable(key) || visibleKeySet.has(key))
}

function buildPriorityOverrides() {
	const overrides = {}

	for (const key of draftOrder.value) {
		if (!isPriorityConfigurable(key)) {
			continue
		}

		const draftValue = normalizePriority(draftPriorities.value[key])
		const defaultValue = defaultColumnPriority(key)
		if (draftValue !== defaultValue) {
			overrides[key] = draftValue
		}
	}

	return overrides
}

function emitLiveChange() {
	const visibleKeys = buildVisibleKeys()
	if (visibleKeys.length === 0) {
		return
	}

	emit('apply', {
		order: [...draftOrder.value],
		visibleKeys,
		priorities: buildPriorityOverrides(),
	})
}

function showAll() {
	draftVisibleKeys.value = draftOrder.value.filter((key) => isHideable(key))
	emitLiveChange()
}

async function onOptionTabChange() {
	await nextTick()
	updateListScrollLimit()
	await nextTick()
	positionPopover()
}

function close() {
	emit('cancel')
	emit('update:open', false)
}

async function initializePopover() {
	resetDraft()
	resetPresetForm()
	await nextTick()
	updateListScrollLimit()
	await nextTick()
	positionPopover()
	popoverRef.value?.querySelector('input, button')?.focus()
}

watch(
	() => props.open,
	async (isOpen, wasOpen) => {
		if (!isOpen) {
			listScrollStyle.value = {}
			draggingKey.value = null
			dragOverKey.value = null
			document.removeEventListener('pointerdown', onDocumentPointerDown)
			document.removeEventListener('keydown', onDocumentKeyDown)
			return
		}

		if (!wasOpen) {
			await initializePopover()
			document.addEventListener('pointerdown', onDocumentPointerDown)
			document.addEventListener('keydown', onDocumentKeyDown)
		}
	},
	{ immediate: true },
)

watch(
	() => [props.columnKeys, props.headers],
	() => {
		if (props.open) {
			resetDraft()
		}
	},
)

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', onDocumentPointerDown)
	document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<style scoped>
.table-column-options-popover {
	position: fixed;
	z-index: 20;
	display: flex;
	flex-direction: column;
	width: min(30rem, calc(100vw - 1rem));
	min-width: min(30rem, calc(100vw - 1rem));
	max-height: calc(100vh - 1rem);
	padding: 0.75rem;
	border: 1px solid var(--border-color, #e1e5e9);
	border-radius: 0.4rem;
	background: var(--background-color, #fff);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	overflow: hidden;
	box-sizing: border-box;
}

.popover-body {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.popover-title {
	margin: 0 0 0.35rem;
	font-size: 0.95rem;
	flex-shrink: 0;
}

.column-options-help {
	margin: 0 0 0.75rem;
	font-size: 0.85rem;
	flex-shrink: 0;
}

.column-options-tabs {
	flex: 1 1 auto;
	min-height: 0;
	min-width: 0;
	display: flex;
	flex-direction: column;
	width: 100%;
}

.column-options-tabs :deep(.tabs-content) {
	flex: 1 1 auto;
	min-height: 0;
}

.column-options-tabs :deep(.tab-panel) {
	padding-block: 0.75rem;
	padding-inline: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.column-options-tabs :deep(.tab-button) {
	padding: 0.45rem 0.85rem;
	font-size: 0.9rem;
}

.column-options-tab-placeholder {
	margin: 0;
	font-size: 0.85rem;
}

.column-options-save-panel {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.column-options-save-help {
	margin: 0;
	font-size: 0.85rem;
}

.column-options-save-field {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.column-options-save-default {
	display: flex;
	align-items: center;
	gap: 0.45rem;
}

.field-label {
	font-size: 0.85rem;
	color: var(--text-muted, #666);
}

.column-options-tab-error {
	margin: 0;
	font-size: 0.85rem;
	color: var(--bad-color, #c62828);
}

.column-options-tab-success {
	margin: 0;
	font-size: 0.85rem;
	color: var(--good-color, #2e7d32);
}

.column-options-load-panel {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.column-options-load-default {
	display: flex;
	justify-content: center;
	padding-top: 0.25rem;
	border-top: 1px solid var(--border-color, #e1e5e9);
}

.column-options-preset-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.65rem;
	max-height: 14rem;
	overflow-y: auto;
}

.column-options-preset-item {
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 0.5rem;
	align-items: start;
	padding-bottom: 0.65rem;
	border-bottom: 1px solid var(--border-color, #e1e5e9);
}

.column-options-preset-item:last-child {
	padding-bottom: 0;
	border-bottom: 0;
}

.column-options-preset-meta strong {
	display: inline;
	margin-right: 0.35rem;
}

.column-options-preset-date {
	margin: 0.2rem 0 0;
	font-size: 0.8rem;
}

.column-options-preset-actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.35rem;
}

.column-options-scroll {
	overflow-y: auto;
	min-height: 0;
	overscroll-behavior: contain;
}

.column-options-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}

.column-options-item {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 5.5rem auto;
	align-items: center;
	gap: 0.5rem;
	padding: 0.25rem 0.45rem;
	border: 1px solid var(--border-color, #e1e5e9);
	border-radius: 0.35rem;
	background: var(--standout-bg-color, #f8f9fa);
}

.column-options-item.is-dragging {
	opacity: 0.55;
}

.column-options-item.is-drag-over {
	border-color: var(--text-color, #334155);
}

.column-options-item.is-fixed {
	opacity: 0.85;
}

.column-options-drag-handle {
	display: inline-flex;
	align-items: center;
	color: var(--text-color, inherit);
	opacity: 0.65;
	cursor: grab;
}

.column-options-item.is-fixed .column-options-drag-handle.disabled {
	opacity: 0.35;
	cursor: default;
}

.column-options-label {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0;
	min-width: 0;
}

.column-options-label span {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.column-options-priority {
	width: 100%;
	min-width: 0;
	padding-top: 0.15rem;
	padding-bottom: 0.15rem;
	font-size: 0.9em;
}

.column-options-priority-spacer {
	display: block;
}

.column-options-reorder {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
}

.column-options-move {
	display: inline-flex;
	gap: 0.2rem;
}

.column-options-move-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 1.75rem;
	padding: 0.2rem 0.35rem;
}

.popover-actions {
	display: flex;
	flex-shrink: 0;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 0.5rem;
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid var(--border-color, #e1e5e9);
}

html[data-theme="dark"] .table-column-options-popover {
	background: var(--background-color, #1e1e1e);
	border-color: var(--border-color, #444);
}

html[data-theme="dark"] .column-options-item {
	background: var(--standout-bg-color, #1f1f1f);
	border-color: var(--border-color, #444);
}

html[data-theme="dark"] .popover-actions {
	border-top-color: var(--border-color, #444);
}
</style>
