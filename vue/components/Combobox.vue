<template>
	<div class="combobox" :class="{ 'combobox-open': isOpen, 'combobox-disabled': disabled }">
		<div class="combobox-field">
			<div class="combobox-control">
				<input
					:id="inputId"
					ref="inputRef"
					v-model="query"
					type="text"
					role="combobox"
					autocomplete="off"
					aria-autocomplete="list"
					:aria-expanded="isOpen ? 'true' : 'false'"
					:aria-controls="listboxId"
					:aria-activedescendant="activeOptionId"
					:aria-label="ariaLabel || undefined"
					:aria-labelledby="ariaLabelledby || undefined"
					:aria-busy="loading ? 'true' : undefined"
					:placeholder="placeholder"
					:disabled="disabled"
					@input="onInput"
					@focus="onFocus"
					@click="open"
					@blur="onBlur"
					@keydown="onKeydown"
				/>
				<button
					v-if="clearable && hasValue && !disabled"
					type="button"
					class="combobox-clear"
					tabindex="-1"
					:aria-label="clearLabel"
					:title="clearLabel"
					@mousedown.prevent
					@click="clear"
				>
					<HugeiconsIcon :icon="Cancel01Icon" width="1em" height="1em" aria-hidden="true" />
				</button>
				<button
					type="button"
					class="combobox-toggle"
					tabindex="-1"
					aria-hidden="true"
					:disabled="disabled"
					@mousedown.prevent
					@click="toggle"
				>
					<HugeiconsIcon :icon="ArrowDown01Icon" width="1em" height="1em" aria-hidden="true" />
				</button>
			</div>
			<slot name="actions" :query="query" />
		</div>
		<ul
			v-show="isOpen"
			:id="listboxId"
			ref="listboxRef"
			class="combobox-listbox"
			role="listbox"
			:aria-label="ariaLabel || undefined"
			:aria-labelledby="ariaLabelledby || undefined"
		>
			<li v-if="loading" class="combobox-message" role="presentation">{{ loadingText }}</li>
			<template v-else>
				<li
					v-for="(entry, index) in entries"
					:id="optionId(index)"
					:key="entry.key"
					class="combobox-option"
					:class="{
						'combobox-option-active': index === activeIndex,
						'combobox-option-none': entry.kind === 'none',
						'combobox-option-more': entry.kind === 'more',
					}"
					:role="entry.kind === 'more' && !listensForMore ? 'presentation' : 'option'"
					:aria-selected="entry.kind === 'more' && !listensForMore ? undefined : (entry.selected ? 'true' : 'false')"
					:aria-disabled="entry.option?.disabled ? 'true' : undefined"
					@mousedown.prevent
					@mousemove="activeIndex = index"
					@click="choose(entry)"
				>
					<template v-if="entry.kind === 'more'">{{ moreText(hiddenCount) }}</template>
					<template v-else-if="entry.kind === 'none'">{{ noneLabel }}</template>
					<slot v-else name="option" :option="entry.option" :selected="entry.selected">
						<span class="combobox-option-label">{{ entry.option.label }}</span>
						<span v-if="entry.option.description" class="combobox-option-description">{{ entry.option.description }}</span>
					</slot>
				</li>
				<li v-if="matches.length === 0" class="combobox-message" role="presentation">
					{{ options.length === 0 ? emptyText : noMatchesText }}
				</li>
			</template>
		</ul>
	</div>
</template>

<script setup>
/**
 * A text box that filters a list of options as you type: a searchable select. Every typed word must
 * appear in an option's label or description (case and accents ignored). Arrow keys move through
 * the list, Enter picks, Escape closes it (without closing a surrounding Dialog), and leaving the
 * box puts back the chosen option's label. With `clearable` a None choice and a clear button set
 * the value to null. Clicking the box or typing opens the list. At most `limit` options are listed;
 * past that, a "N more…" item emits `more` with the typed text (e.g. to open a fuller picker), or
 * asks for more typing when nothing listens. The `actions` slot sits beside the box (e.g. a Browse
 * button); the `option` slot renders an option.
 */
import { computed, getCurrentInstance, nextTick, ref, useId, watch } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { ArrowDown01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { matchesAllWords, queryWords } from '../composables/textMatch.js'

const props = defineProps({
	modelValue: {
		type: [String, Number],
		default: null,
	},
	/** { value, label, description?, disabled? } */
	options: {
		type: Array,
		default: () => [],
		validator: (options) => options.every((option) => option && typeof option === 'object'
			&& 'value' in option && typeof option.label === 'string'),
	},
	/** The input's id, e.g. for a FormField's `for`. */
	id: {
		type: String,
		default: '',
	},
	placeholder: {
		type: String,
		default: '',
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	loading: {
		type: Boolean,
		default: false,
	},
	/** Offer a None choice and a clear button, both setting the value to null. */
	clearable: {
		type: Boolean,
		default: false,
	},
	noneLabel: {
		type: String,
		default: '— None —',
	},
	clearLabel: {
		type: String,
		default: 'Clear',
	},
	/** Most options listed at once. */
	limit: {
		type: Number,
		default: 50,
	},
	emptyText: {
		type: String,
		default: 'Nothing to choose from',
	},
	noMatchesText: {
		type: String,
		default: 'No matches',
	},
	loadingText: {
		type: String,
		default: 'Loading…',
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

const emit = defineEmits(['update:modelValue', 'change', 'more'])
// Declared emits are not attrs; the parent's listener is on the vnode's props.
const instance = getCurrentInstance()

const generatedId = useId()
const inputId = computed(() => props.id || `combobox-${generatedId}`)
const listboxId = computed(() => `${inputId.value}-listbox`)

const inputRef = ref(null)
const listboxRef = ref(null)
const isOpen = ref(false)
const query = ref('')
// Whether the text is being typed (filtering) rather than showing the chosen option.
const typing = ref(false)
const activeIndex = ref(-1)

const hasValue = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '')
const selectedOption = computed(() => props.options.find((option) => sameValue(option.value, props.modelValue)))
const selectedLabel = computed(() => {
	if (!hasValue.value) {
		return ''
	}
	return selectedOption.value?.label ?? String(props.modelValue)
})

const matches = computed(() => {
	const words = typing.value ? queryWords(query.value) : []
	return props.options.filter((option) => matchesAllWords([option.label, option.description ?? ''], words))
})
const hiddenCount = computed(() => Math.max(0, matches.value.length - props.limit))
const listensForMore = computed(() => Boolean(instance?.vnode.props?.onMore))

// What the list shows, in order: None (when clearable and not filtering), the options, then "more".
const entries = computed(() => {
	const list = []
	if (props.clearable && !(typing.value && query.value.trim())) {
		list.push({ kind: 'none', key: 'none', selected: !hasValue.value })
	}
	for (const option of matches.value.slice(0, props.limit)) {
		list.push({ kind: 'option', key: `option-${option.value}`, option, selected: sameValue(option.value, props.modelValue) })
	}
	if (hiddenCount.value > 0) {
		list.push({ kind: 'more', key: 'more' })
	}
	return list
})

const activeOptionId = computed(() => (isOpen.value && activeIndex.value >= 0 ? optionId(activeIndex.value) : undefined))

function sameValue(a, b) {
	return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b)
}

function optionId(index) {
	return `${listboxId.value}-${index}`
}

function moreText(count) {
	return listensForMore.value ? `${count} more…` : `${count} more: keep typing to narrow them down`
}

function isPickable(entry) {
	return entry && !(entry.kind === 'option' && entry.option.disabled) && !(entry.kind === 'more' && !listensForMore.value)
}

function showSelected() {
	typing.value = false
	query.value = selectedLabel.value
}

function open() {
	if (props.disabled || isOpen.value) {
		return
	}
	isOpen.value = true
	const selectedIndex = entries.value.findIndex((entry) => entry.selected)
	activeIndex.value = selectedIndex >= 0 ? selectedIndex : entries.value.findIndex(isPickable)
	scrollActiveIntoView()
}

function close() {
	isOpen.value = false
	activeIndex.value = -1
}

function toggle() {
	if (isOpen.value) {
		close()
	} else {
		inputRef.value?.focus()
		open()
	}
}

function setValue(value) {
	emit('update:modelValue', value)
	emit('change', value === null ? null : props.options.find((option) => sameValue(option.value, value)) ?? null)
}

function choose(entry) {
	if (!isPickable(entry)) {
		return
	}
	if (entry.kind === 'more') {
		const text = typing.value ? query.value : ''
		close()
		showSelected()
		emit('more', text)
		return
	}
	setValue(entry.kind === 'none' ? null : entry.option.value)
	close()
	typing.value = false
	query.value = entry.kind === 'none' ? '' : entry.option.label
}

function clear() {
	setValue(null)
	query.value = ''
	typing.value = false
	inputRef.value?.focus()
}

function onInput() {
	typing.value = true
	if (!isOpen.value) {
		open()
	}
	activeIndex.value = entries.value.findIndex(isPickable)
}

function onFocus() {
	inputRef.value?.select()
}

function onBlur() {
	close()
	showSelected()
}

function moveActive(step) {
	const count = entries.value.length
	if (count === 0) {
		return
	}
	let index = activeIndex.value
	for (let tries = 0; tries < count; tries += 1) {
		index = (index + step + count) % count
		if (isPickable(entries.value[index])) {
			activeIndex.value = index
			scrollActiveIntoView()
			return
		}
	}
}

async function scrollActiveIntoView() {
	await nextTick()
	listboxRef.value?.querySelector('.combobox-option-active')?.scrollIntoView?.({ block: 'nearest' })
}

function onKeydown(event) {
	switch (event.key) {
		case 'ArrowDown':
			event.preventDefault()
			if (isOpen.value) {
				moveActive(1)
			} else {
				open()
			}
			break
		case 'ArrowUp':
			event.preventDefault()
			if (isOpen.value) {
				moveActive(-1)
			} else {
				open()
			}
			break
		case 'Enter':
			if (isOpen.value) {
				// Picks, rather than submitting a surrounding form.
				event.preventDefault()
				choose(entries.value[activeIndex.value])
			}
			break
		case 'Escape':
			if (isOpen.value) {
				// Closes the list only, not a surrounding Dialog.
				event.preventDefault()
				event.stopPropagation()
				close()
				showSelected()
			}
			break
		case 'Tab':
			close()
			break
		default:
			break
	}
}

// Shows the chosen option's label when the value or the options change, unless mid-typing.
watch([() => props.modelValue, selectedLabel], () => {
	if (!typing.value) {
		query.value = selectedLabel.value
	}
}, { immediate: true })

defineExpose({
	focus: () => inputRef.value?.focus(),
	open,
	close,
})
</script>

<style scoped>
.combobox {
	position: relative;
	width: 100%;
	min-width: 0;
}

.combobox-field {
	display: flex;
	align-items: center;
	gap: .5em;
}

.combobox-control {
	position: relative;
	flex: 1 1 auto;
	min-width: 0;
}

.combobox-control input {
	width: 100%;
	box-sizing: border-box;
	margin: 0;
	padding-right: 4em;
}

.combobox-clear,
.combobox-toggle {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.75em;
	height: 1.75em;
	margin: 0;
	padding: 0;
	border: none;
	background: none;
	color: inherit;
	opacity: .65;
	cursor: pointer;
}

.combobox-clear:hover,
.combobox-toggle:hover {
	opacity: 1;
}

.combobox-toggle {
	right: .4em;
	transition: transform .15s;
}

.combobox-clear {
	right: 2.2em;
}

.combobox-open .combobox-toggle {
	transform: translateY(-50%) rotate(180deg);
}

.combobox-listbox {
	position: absolute;
	top: calc(100% + .25em);
	left: 0;
	right: 0;
	z-index: 20;
	max-height: 16em;
	overflow-y: auto;
	margin: 0;
	padding: var(--menu-dropdown-padding, .25em);
	list-style: none;
	border: 1px solid var(--menu-dropdown-border-color, var(--border-color));
	border-radius: var(--menu-dropdown-radius, .4em);
	background-color: var(--menu-dropdown-background-color, var(--section-bg-color));
	color: var(--text-color);
	box-shadow: var(--menu-dropdown-shadow);
}

.combobox-option {
	display: flex;
	align-items: baseline;
	gap: .5em;
	padding: .4em .6em;
	border-radius: .25em;
	cursor: pointer;
}

.combobox-option-active {
	background-color: var(--menu-item-hover-background-color, var(--hover-background-color));
	color: var(--hover-text-color, inherit);
}

.combobox-option[aria-selected="true"] {
	font-weight: 600;
}

.combobox-option[aria-disabled="true"] {
	opacity: .5;
	cursor: default;
}

.combobox-option-none,
.combobox-option-more,
.combobox-option-description,
.combobox-message {
	opacity: .75;
}

.combobox-option-more {
	font-style: italic;
}

.combobox-option-description {
	font-size: .85em;
}

.combobox-message {
	padding: .4em .6em;
	font-style: italic;
}
</style>
