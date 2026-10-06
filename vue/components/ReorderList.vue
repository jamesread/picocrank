<template>
	<p v-if="items.length === 0" class="reorder-list-empty">
		<slot name="empty">Nothing to reorder.</slot>
	</p>
	<ul
		v-else
		ref="rootRef"
		class="reorder-list"
		data-reorder-list-root
		:class="{ 'is-disabled': disabled }"
		:aria-label="ariaLabel || undefined"
		:aria-labelledby="ariaLabelledby || undefined"
		:aria-disabled="disabled ? 'true' : undefined"
		@dragover.prevent="onListDragOver"
		@drop.prevent="onListDrop"
		@dragleave="onListDragLeave"
	>
		<li
			v-if="dropGap !== null"
			class="reorder-list-separator"
			:style="{ top: `${separatorTop}px` }"
			:data-drop-gap="dropGap"
			aria-hidden="true"
		/>
		<li
			v-for="(item, index) in items"
			:key="keyOf(item, index)"
			class="reorder-list-row"
			:class="{
				'is-dragging': draggingKey === keyOf(item, index),
				'is-drag-whole-row': dragWholeRow && !disabled && !isItemReorderDisabled(item, index),
				'is-reorder-disabled': isItemReorderDisabled(item, index),
			}"
			:data-reorder-key="keyOf(item, index)"
			:draggable="dragWholeRow && !disabled && !isItemReorderDisabled(item, index) ? 'true' : 'false'"
			:tabindex="rowTabIndex"
			:aria-label="rowDragAriaLabel(item, index)"
			@dragstart="onRowDragStart(item, index, $event)"
			@dragend="onDragEnd"
			@keydown="onRowKeydown(index, $event)"
		>
			<div v-if="showMoveButtons || showHandleGrip" class="reorder-list-controls">
				<div
					v-if="showMoveButtons"
					class="reorder-list-move"
					role="group"
					:aria-label="`Move ${labelOf(item, index)}`"
				>
					<button
						type="button"
						class="neutral reorder-list-move-button"
						:disabled="!canMove(index, -1)"
						:aria-label="`Move ${labelOf(item, index)} up`"
						@click="moveBy(index, -1, true)"
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
						class="neutral reorder-list-move-button"
						:disabled="!canMove(index, 1)"
						:aria-label="`Move ${labelOf(item, index)} down`"
						@click="moveBy(index, 1, true)"
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
					v-if="showHandleGrip"
					class="reorder-list-handle"
					:class="{ 'is-disabled': disabled || isItemReorderDisabled(item, index) }"
					:draggable="disabled || isItemReorderDisabled(item, index) ? 'false' : 'true'"
					:aria-hidden="showMoveButtons ? 'true' : undefined"
					:tabindex="handleTabIndex"
					:aria-label="showMoveButtons ? undefined : `Reorder ${labelOf(item, index)}. Arrow up or arrow down to move.`"
					@dragstart.stop="onHandleDragStart(item, index, $event)"
					@dragend="onDragEnd"
					@keydown="onHandleKeydown(index, $event)"
				>
					<HugeiconsIcon
						:icon="DragDropVerticalIcon"
						width="0.95em"
						height="0.95em"
						:strokeWidth="2"
					/>
				</span>
			</div>

			<div class="reorder-list-body">
				<slot name="item" :item="item" :index="index">
					{{ labelOf(item, index) }}
				</slot>
			</div>
		</li>
	</ul>
</template>

<script setup>
/**
 * Reordering uses native HTML5 drag-and-drop (`draggable`, dragstart/dragover/drop).
 * Drop position is derived from pointer Y during dragover; handle and whole-row modes
 * both use the same DnD pipeline (not a custom pointer-drag implementation).
 */
import { computed, nextTick, ref, useId, watch } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	DragDropVerticalIcon,
} from '@hugeicons/core-free-icons'

const props = defineProps({
	/**
	 * Ordered rows. Objects or primitive values. Reorder emits a new array.
	 */
	modelValue: {
		type: Array,
		default: () => [],
	},
	/**
	 * Property name used as the row identity, or a function (item, index) => key.
	 * Primitives use their own value when the property is missing.
	 */
	itemKey: {
		type: [String, Function],
		default: 'id',
	},
	/**
	 * Accessible name for move buttons. Defaults to label, name, title, or "row N".
	 */
	itemLabel: {
		type: Function,
		default: null,
	},
	/**
	 * Show up/down buttons. Off by default; drag handles are the primary control.
	 * When hidden, arrow keys on the handle reorder rows.
	 */
	showMoveButtons: {
		type: Boolean,
		default: false,
	},
	/**
	 * Show the grip used to drag a row. Arrow keys on the handle reorder when move buttons are hidden.
	 */
	showDragHandles: {
		type: Boolean,
		default: true,
	},
	/**
	 * HTML5 drag from anywhere on the row (except buttons and form controls in the slot).
	 * Hides the grip handle; move buttons still apply when enabled.
	 */
	dragWholeRow: {
		type: Boolean,
		default: false,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	/**
	 * When true for a row, that row cannot be dragged and keeps its handle disabled.
	 */
	isItemReorderDisabled: {
		type: Function,
		default: null,
	},
	ariaLabel: {
		type: String,
		default: '',
	},
	ariaLabelledby: {
		type: String,
		default: '',
	},
})

const emit = defineEmits(['update:modelValue', 'reorder'])

const rootRef = ref(null)
const listInstanceId = useId()
const draggingKey = ref(null)
/** Visual gap index: 0 is before the first row, length is after the last. */
const dropGap = ref(null)
const separatorTop = ref(0)

const items = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

const showHandleGrip = computed(() => props.showDragHandles && !props.dragWholeRow)

const handleTabIndex = computed(() => {
	if (!showHandleGrip.value || props.showMoveButtons || props.disabled) {
		return undefined
	}
	return 0
})

const rowTabIndex = computed(() => {
	if (!props.dragWholeRow || props.showMoveButtons || props.disabled) {
		return undefined
	}
	return 0
})

function rowDragAriaLabel(item, index) {
	if (!props.dragWholeRow || props.showMoveButtons) {
		return undefined
	}
	return `Reorder ${labelOf(item, index)}. Arrow up or arrow down to move.`
}

function keyOf(item, index) {
	if (typeof props.itemKey === 'function') {
		return String(props.itemKey(item, index))
	}
	if (item != null && typeof item === 'object' && props.itemKey in item && item[props.itemKey] != null) {
		return String(item[props.itemKey])
	}
	return String(item)
}

function labelOf(item, index) {
	if (typeof props.itemLabel === 'function') {
		const custom = props.itemLabel(item, index)
		if (custom != null && custom !== '') {
			return String(custom)
		}
	}
	if (item != null && typeof item === 'object') {
		const text = item.label ?? item.name ?? item.title
		if (text != null && text !== '') {
			return String(text)
		}
	}
	if (item != null && typeof item !== 'object') {
		return String(item)
	}
	return `row ${index + 1}`
}

function indexOfKey(key) {
	return items.value.findIndex((item, index) => keyOf(item, index) === key)
}

function isItemReorderDisabled(item, index) {
	return typeof props.isItemReorderDisabled === 'function'
		&& props.isItemReorderDisabled(item, index)
}

function canMove(index, direction) {
	if (props.disabled || isItemReorderDisabled(items.value[index], index)) {
		return false
	}
	const target = index + direction
	return target >= 0 && target < items.value.length
}

function reorder(fromIndex, toIndex) {
	if (props.disabled) {
		return
	}
	if (fromIndex === toIndex) {
		return
	}
	if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.value.length || toIndex >= items.value.length) {
		return
	}

	const next = items.value.slice()
	const [moved] = next.splice(fromIndex, 1)
	next.splice(toIndex, 0, moved)
	emit('update:modelValue', next)
	emit('reorder', {
		items: next,
		item: moved,
		fromIndex,
		toIndex,
	})
}

async function moveBy(index, direction, restoreFocus = false) {
	if (!canMove(index, direction)) {
		return
	}
	const key = keyOf(items.value[index], index)
	reorder(index, index + direction)
	if (!restoreFocus) {
		return
	}
	await nextTick()
	const selectorKey = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
		? CSS.escape(key)
		: key.replace(/"/g, '\\"')
	const row = rootRef.value?.querySelector(`[data-reorder-key="${selectorKey}"]`)
	const preferredLabel = direction < 0 ? ' up' : ' down'
	const alternateLabel = direction < 0 ? ' down' : ' up'
	const buttons = [...(row?.querySelectorAll('button') ?? [])]
	const preferred = buttons.find((button) => button.getAttribute('aria-label')?.endsWith(preferredLabel) && !button.disabled)
	const alternate = buttons.find((button) => button.getAttribute('aria-label')?.endsWith(alternateLabel) && !button.disabled)
	const handle = row?.querySelector('.reorder-list-handle')
	;(preferred ?? alternate ?? handle)?.focus()
}

function onHandleKeydown(index, event) {
	if (!showHandleGrip.value || props.showMoveButtons || props.disabled) {
		return
	}
	onReorderKeydown(index, event)
}

function onRowKeydown(index, event) {
	if (!props.dragWholeRow || props.showMoveButtons || props.disabled) {
		return
	}
	onReorderKeydown(index, event)
}

function onReorderKeydown(index, event) {
	if (event.key === 'ArrowUp') {
		event.preventDefault()
		moveBy(index, -1, true)
	} else if (event.key === 'ArrowDown') {
		event.preventDefault()
		moveBy(index, 1, true)
	}
}

const DRAG_CANCEL_SELECTOR = 'button, a, input, select, textarea, label'

function dragStartBlocked(event) {
	const target = event.target
	if (!(target instanceof Element)) {
		return false
	}
	return Boolean(target.closest(DRAG_CANCEL_SELECTOR))
}

function beginDrag(item, index, event) {
	if (props.disabled || isItemReorderDisabled(item, index)) {
		event.preventDefault()
		return
	}
	draggingKey.value = keyOf(item, index)
	dropGap.value = null
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move'
		event.dataTransfer.setData('text/plain', draggingKey.value)
		event.dataTransfer.setData('application/x-picocrank-reorder-list', listInstanceId)
	}
	event.stopPropagation()
}

function onRowDragStart(item, index, event) {
	if (!props.dragWholeRow) {
		return
	}
	if (dragStartBlocked(event)) {
		event.preventDefault()
		return
	}
	beginDrag(item, index, event)
}

function onHandleDragStart(item, index, event) {
	if (!showHandleGrip.value) {
		event.preventDefault()
		return
	}
	beginDrag(item, index, event)
}

function clearDrag() {
	draggingKey.value = null
	dropGap.value = null
	separatorTop.value = 0
}

function directRows(list) {
	return [...list.querySelectorAll(':scope > li.reorder-list-row')]
}

function separatorTopForGap(gap, rows, list) {
	const listRect = list.getBoundingClientRect()
	let y
	if (gap <= 0) {
		y = rows[0].getBoundingClientRect().top
	} else if (gap >= rows.length) {
		y = rows[rows.length - 1].getBoundingClientRect().bottom
	} else {
		const previous = rows[gap - 1].getBoundingClientRect()
		const next = rows[gap].getBoundingClientRect()
		y = (previous.bottom + next.top) / 2
	}
	return y - listRect.top + list.scrollTop
}

/**
 * Gap in the current list where a drop would insert the dragged row.
 * The slots immediately before and after the dragged row are null: dropping
 * there would not move it.
 */
function dropGapFromDragEvent(event) {
	const list = rootRef.value
	if (!list || draggingKey.value == null) {
		return null
	}
	const rows = directRows(list)
	const fromIndex = indexOfKey(draggingKey.value)
	if (fromIndex < 0 || rows.length === 0) {
		return null
	}

	let gap = rows.length
	for (let index = 0; index < rows.length; index += 1) {
		const rect = rows[index].getBoundingClientRect()
		const midpoint = rect.top + (rect.height / 2)
		if (event.clientY < midpoint) {
			gap = index
			break
		}
	}
	if (gap === fromIndex || gap === fromIndex + 1) {
		return null
	}
	return {
		gap,
		fromIndex,
		top: separatorTopForGap(gap, rows, list),
	}
}

function onListDragOver(event) {
	if (props.disabled || draggingKey.value == null) {
		return
	}
	event.preventDefault()
	event.stopPropagation()
	const next = dropGapFromDragEvent(event)
	dropGap.value = next ? next.gap : null
	separatorTop.value = next ? next.top : 0
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = 'move'
	}
}

function onListDragLeave(event) {
	const list = rootRef.value
	const next = event.relatedTarget
	if (list && next instanceof Node && list.contains(next)) {
		return
	}
	dropGap.value = null
}

function onListDrop(event) {
	if (props.disabled || draggingKey.value == null) {
		return
	}
	event.preventDefault()
	event.stopPropagation()
	const next = dropGapFromDragEvent(event)
	const sourceKey = draggingKey.value
	clearDrag()
	if (!sourceKey || !next) {
		return
	}
	const toIndex = next.gap > next.fromIndex ? next.gap - 1 : next.gap
	reorder(next.fromIndex, toIndex)
}

function onDragEnd() {
	clearDrag()
}

watch(() => [props.showDragHandles, props.dragWholeRow], () => {
	if (!props.showDragHandles && !props.dragWholeRow) {
		clearDrag()
	}
})
</script>

<style scoped>
.reorder-list {
	position: relative;
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.reorder-list-empty {
	margin: 0;
	color: var(--muted-text-color);
}

.reorder-list-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-width: 0;
	padding: 0.55rem 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: 0.35rem;
	background: var(--standout-bg-color);
}

.reorder-list-row.is-dragging {
	opacity: 0.55;
}

.reorder-list-row.is-drag-whole-row {
	cursor: grab;
}

.reorder-list-row.is-drag-whole-row:hover:not(.is-dragging) {
	background-color: var(--control-hover-bg-color);
	color: var(--hover-text-color);
}

.reorder-list-row.is-drag-whole-row:active {
	cursor: grabbing;
}

.reorder-list-row.is-reorder-disabled {
	opacity: 0.85;
}

.reorder-list-row.is-drag-whole-row:focus-visible {
	outline: 2px solid var(--focus-outline-color, var(--text-color));
	outline-offset: 2px;
}

.reorder-list-separator {
	position: absolute;
	z-index: 1;
	left: 0;
	right: 0;
	height: 3px;
	margin: 0;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background: var(--text-color);
	pointer-events: none;
	transform: translateY(-50%);
}

.reorder-list-controls {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	flex: 0 0 auto;
}

.reorder-list-move {
	display: inline-flex;
	gap: 0.2rem;
}

.reorder-list-move-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 1.75rem;
	padding: 0.2rem 0.35rem;
}

.reorder-list-handle {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.15rem;
	color: inherit;
	opacity: 0.65;
	cursor: grab;
	border-radius: 0.25rem;
}

.reorder-list-handle:active {
	cursor: grabbing;
}

.reorder-list-handle.is-disabled,
.reorder-list.is-disabled .reorder-list-handle {
	opacity: 0.35;
	cursor: default;
}

.reorder-list-handle:focus-visible {
	outline: 2px solid var(--focus-outline-color, var(--text-color));
	outline-offset: 2px;
}

.reorder-list-body {
	flex: 1 1 auto;
	min-width: 0;
}
</style>
