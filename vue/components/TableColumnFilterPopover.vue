<template>
	<Teleport to="body">
		<div
			v-if="open"
			ref="popoverRef"
			class="table-column-filter-popover"
			role="dialog"
			:aria-labelledby="titleId"
			:style="popoverStyle"
			@click.stop
		>
			<div class="popover-body">
				<h4 :id="titleId" ref="titleRef" class="popover-title">
					{{ popoverTitle }}
				</h4>

				<div v-if="filterType === 'text'" class="filter-fields">
					<label>
						<span class="field-label">Match</span>
						<select v-model="draft.operator">
							<option value="contains">Contains</option>
							<option value="equals">Equals</option>
							<option value="startsWith">Starts with</option>
							<option value="empty">Is empty</option>
						</select>
					</label>
					<label v-if="draft.operator !== 'empty'">
						<span class="field-label">Value</span>
						<input v-model="draft.value" type="text" @keydown.enter.prevent="apply" />
					</label>
				</div>

				<div v-else-if="filterType === 'number'" class="filter-fields">
					<label>
						<span class="field-label">Operator</span>
						<select v-model="draft.operator">
							<option value="eq">Equals</option>
							<option value="gt">Greater than</option>
							<option value="gte">Greater or equal</option>
							<option value="lt">Less than</option>
							<option value="lte">Less or equal</option>
						</select>
					</label>
					<label>
						<span class="field-label">Value</span>
						<input v-model="draft.value" type="number" @keydown.enter.prevent="apply" />
					</label>
				</div>

				<div v-else-if="filterType === 'boolean'" class="filter-fields">
					<RadioGroup
						v-model="booleanValue"
						:options="booleanOptions"
						variant="list"
						:aria-label="`Filter ${header?.label || header?.key} by boolean value`"
					/>
				</div>

				<div v-else-if="filterType === 'select'" class="filter-fields filter-fields-select">
					<div
						ref="checkGroupScrollRef"
						class="checkgroup-scroll"
						:style="checkGroupScrollStyle"
					>
						<CheckGroup
							v-model="draft.values"
							:options="selectOptions"
							:aria-label="`Filter ${header?.label || header?.key} by selected values`"
						/>
					</div>
					<p v-if="selectOptions.length === 0" class="subtle">No options available.</p>
				</div>
			</div>

			<div ref="actionsRef" role="toolbar" class="popover-actions">
				<button type="button" class="neutral" @click="cancel">Cancel</button>
				<button type="button" class="neutral" @click="clear">Clear</button>
				<button type="button" @click="apply">Apply</button>
			</div>
		</div>
	</Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import CheckGroup from './CheckGroup.vue'
import RadioGroup from './RadioGroup.vue'
import {
	createEmptyFilter,
	inferFilterType,
	normalizeFilter,
} from '../composables/tableFilters.js'

const props = defineProps({
	open: {
		type: Boolean,
		default: false,
	},
	header: {
		type: Object,
		default: null,
	},
	anchorEl: {
		type: Object,
		default: null,
	},
	value: {
		type: Object,
		default: null,
	},
	rows: {
		type: Array,
		default: () => [],
	},
	selectOptions: {
		type: Array,
		default: () => [],
	},
})

const emit = defineEmits(['update:open', 'apply', 'clear', 'cancel'])

const MIN_VISIBLE_OPTIONS = 3
const MAX_VISIBLE_OPTIONS = 20
const VIEWPORT_MARGIN_PX = 8

const popoverRef = ref(null)
const titleRef = ref(null)
const actionsRef = ref(null)
const checkGroupScrollRef = ref(null)
const popoverStyle = ref({ top: '0px', left: '0px' })
const checkGroupScrollStyle = ref({})
const titleId = useId()
const draft = ref(createEmptyFilter({ key: '' }))

const filterType = computed(() => {
	if (!props.header) {
		return 'text'
	}
	return inferFilterType(props.header, props.rows)
})

const columnLabel = computed(() => props.header?.label || props.header?.key || '')

const selectedCount = computed(() => {
	if (filterType.value !== 'select' || !Array.isArray(draft.value.values)) {
		return 0
	}
	return draft.value.values.length
})

const popoverTitle = computed(() => {
	if (filterType.value === 'select') {
		return `Filter ${columnLabel.value} (${selectedCount.value} selected)`
	}
	return `Filter ${columnLabel.value}`
})

const booleanOptions = [
	{ value: 'any', label: 'Any' },
	{ value: true, label: 'Yes' },
	{ value: false, label: 'No' },
]

const booleanValue = computed({
	get() {
		if (draft.value.value === true) return true
		if (draft.value.value === false) return false
		return 'any'
	},
	set(value) {
		if (value === 'any') {
			draft.value = { type: 'boolean', value: null }
			return
		}
		draft.value = { type: 'boolean', value: value === true }
	},
})

function positionPopover() {
	const anchor = props.anchorEl
	if (!anchor || !popoverRef.value) {
		return
	}

	const rect = anchor.getBoundingClientRect()
	const popoverRect = popoverRef.value.getBoundingClientRect()
	const margin = VIEWPORT_MARGIN_PX
	let top = rect.bottom + margin
	let left = rect.left

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

function updateCheckGroupScrollLimit() {
	checkGroupScrollStyle.value = {}

	if (filterType.value !== 'select' || !popoverRef.value || !checkGroupScrollRef.value) {
		return
	}

	const anchor = props.anchorEl
	const anchorRect = anchor?.getBoundingClientRect()
	const popoverEl = popoverRef.value
	const titleHeight = titleRef.value?.offsetHeight ?? 0
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

	const reservedHeight = paddingTop + paddingBottom + titleHeight + actionsHeight + bodyGap
	const optionsAreaBudget = Math.max(0, availablePopoverHeight - reservedHeight)

	const firstLabel = checkGroupScrollRef.value.querySelector('label')
	const rowHeight = firstLabel?.offsetHeight || 36
	const optionCount = props.selectOptions.length

	const maxVisibleByViewport = Math.floor(optionsAreaBudget / rowHeight)
	const visibleSlots = Math.min(
		MAX_VISIBLE_OPTIONS,
		Math.max(MIN_VISIBLE_OPTIONS, maxVisibleByViewport),
	)

	const rowsToShow = optionCount === 0
		? MIN_VISIBLE_OPTIONS
		: Math.min(optionCount, visibleSlots)

	checkGroupScrollStyle.value = {
		maxHeight: `${rowsToShow * rowHeight}px`,
	}
}

function resetDraft() {
	if (!props.header) {
		draft.value = createEmptyFilter({ key: '' })
		return
	}

	const base = createEmptyFilter(props.header, props.rows)
	if (props.value) {
		draft.value = {
			...base,
			...JSON.parse(JSON.stringify(props.value)),
		}
		return
	}

	draft.value = base
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
	cancel()
}

function onDocumentKeyDown(event) {
	if (!props.open) {
		return
	}
	if (event.key === 'Escape') {
		event.preventDefault()
		cancel()
	}
}

function apply() {
	const normalized = normalizeFilter(props.header, draft.value, props.rows)
	emit('apply', normalized)
	emit('update:open', false)
}

function clear() {
	emit('clear')
	emit('update:open', false)
}

function cancel() {
	emit('cancel')
	emit('update:open', false)
}

watch(
	() => [props.open, props.header, props.value, props.selectOptions.length],
	async ([isOpen]) => {
		if (!isOpen) {
			checkGroupScrollStyle.value = {}
			document.removeEventListener('pointerdown', onDocumentPointerDown)
			document.removeEventListener('keydown', onDocumentKeyDown)
			return
		}

		resetDraft()
		await nextTick()
		updateCheckGroupScrollLimit()
		await nextTick()
		positionPopover()
		popoverRef.value?.querySelector('input, select, button')?.focus()

		document.addEventListener('pointerdown', onDocumentPointerDown)
		document.addEventListener('keydown', onDocumentKeyDown)
	},
	{ immediate: true },
)

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', onDocumentPointerDown)
	document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<style scoped>
.table-column-filter-popover {
	position: fixed;
	z-index: 20;
	display: flex;
	flex-direction: column;
	min-width: 16rem;
	max-width: min(24rem, calc(100vw - 1rem));
	max-height: calc(100vh - 1rem);
	padding: 0.75rem;
	border: 1px solid var(--border-color, #e1e5e9);
	border-radius: 0.4rem;
	background: var(--background-color, #fff);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	overflow: hidden;
}

.popover-body {
	flex: 1 1 auto;
	min-height: 0;
	display: flex;
	flex-direction: column;
}

.popover-title {
	margin: 0 0 0.75rem;
	font-size: 0.95rem;
	flex-shrink: 0;
}

.filter-fields {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	min-height: 0;
}

.filter-fields-select {
	flex: 1 1 auto;
	min-height: 0;
}

.checkgroup-scroll {
	overflow-y: auto;
	min-height: 0;
	overscroll-behavior: contain;
}

.filter-fields label {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.field-label {
	font-size: 0.85rem;
	color: var(--text-muted, #666);
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

html[data-theme="dark"] .table-column-filter-popover {
	background: var(--background-color, #1e1e1e);
	border-color: var(--border-color, #444);
}

html[data-theme="dark"] .popover-actions {
	border-top-color: var(--border-color, #444);
}
</style>
