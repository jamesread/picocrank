<template>
	<div class="readonly-textarea">
		<div v-if="showHeader" class="readonly-textarea-header">
			<label v-if="label" :for="textareaId">{{ label }}</label>
			<div v-if="pushActionsEnd" class="fg1" />
			<div
				v-if="showActions"
				class="readonly-textarea-actions"
			>
				<div v-if="hasActions" class="readonly-textarea-actions-slot">
					<slot name="actions" />
				</div>
				<button
					v-if="showClearButton"
					type="button"
					class="readonly-textarea-clear neutral"
					title="Clear contents"
					:disabled="!modelValue"
					@click="clear"
				>
					<HugeiconsIcon :icon="Delete02Icon" width="1em" height="1em" />
					<span>{{ clearLabel }}</span>
				</button>
				<button
					v-if="showCopyButton"
					type="button"
					class="readonly-textarea-copy"
					:title="copied ? 'Copied' : 'Copy to clipboard'"
					:disabled="!modelValue"
					@click="copy"
				>
					<HugeiconsIcon :icon="copied ? CopyCheckIcon : Copy01Icon" width="1em" height="1em" />
					<span>{{ copied ? copiedLabel : copyLabel }}</span>
				</button>
			</div>
		</div>
		<textarea
			:id="textareaId"
			ref="textareaRef"
			:value="displayValue"
			readonly
			:rows="rows"
			:placeholder="placeholder"
			:class="{ monospace }"
		/>
	</div>
</template>

<script setup>
import { ref, computed, useId, useSlots, watch, Comment } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Copy01Icon, CopyCheckIcon, Delete02Icon } from '@hugeicons/core-free-icons'

const props = defineProps({
	modelValue: {
		type: String,
		default: '',
	},
	label: {
		type: String,
		default: '',
	},
	id: {
		type: String,
		default: '',
	},
	rows: {
		type: Number,
		default: 8,
	},
	placeholder: {
		type: String,
		default: '',
	},
	monospace: {
		type: Boolean,
		default: true,
	},
	showCopyButton: {
		type: Boolean,
		default: true,
	},
	showClearButton: {
		type: Boolean,
		default: false,
	},
	copyLabel: {
		type: String,
		default: 'Copy',
	},
	copiedLabel: {
		type: String,
		default: 'Copied',
	},
	clearLabel: {
		type: String,
		default: 'Clear',
	},
	copiedFeedbackMs: {
		type: Number,
		default: 2000,
	},
	markdownTicks: {
		type: Boolean,
		default: false,
	},
	markdownLang: {
		type: String,
		default: '',
	},
})

const emit = defineEmits(['copy', 'copy-error', 'clear', 'update:modelValue'])

const slots = useSlots()

const slotActionCount = computed(() => {
	const render = slots.actions
	if (!render) {
		return 0
	}
	return render().filter((vnode) => vnode.type !== Comment).length
})

const hasActions = computed(() => slotActionCount.value > 0)

const builtInActionCount = computed(() => {
	let count = 0
	if (props.showClearButton) count++
	if (props.showCopyButton) count++
	return count
})

const actionButtonCount = computed(
	() => slotActionCount.value + builtInActionCount.value,
)

const showActions = computed(
	() => actionButtonCount.value > 0,
)

const showHeader = computed(
	() => Boolean(props.label) || showActions.value,
)

const pushActionsEnd = computed(() => showActions.value)

const generatedId = useId()
const textareaId = props.id || `readonly-textarea-${generatedId}`
const textareaRef = ref(null)
const copied = ref(false)
const content = ref(props.modelValue)
let copiedTimer = null

watch(() => props.modelValue, (value) => {
	content.value = value
})

const displayValue = computed(() => {
	if (!props.markdownTicks || !content.value) {
		return content.value
	}

	const openingFence = props.markdownLang ? `\`\`\`${props.markdownLang}` : '```'
	return `${openingFence}\n${content.value}\n\`\`\``
})

function append(text) {
	content.value += text
	emit('update:modelValue', content.value)
}

function appendYamlProperty(k, v) {
	const line = `${k}: ${v}`
	if (content.value && !content.value.endsWith('\n')) {
		content.value += '\n'
	}
	content.value += line
	emit('update:modelValue', content.value)
}

function appendSection(sectionName) {
	content.value += `\n# ${sectionName} ####\n`
	emit('update:modelValue', content.value)
}

function clear() {
	content.value = ''
	emit('update:modelValue', content.value)
	emit('clear')
}

function getContentAsString() {
	return content.value
}

async function copy() {
	if (!content.value) {
		return
	}

	const text = displayValue.value

	try {
		await navigator.clipboard.writeText(text)
		markCopied()
		emit('copy', text)
	} catch (_error) {
		try {
			textareaRef.value?.select()
			document.execCommand('copy')
			markCopied()
			emit('copy', text)
		} catch (fallbackError) {
			emit('copy-error', fallbackError)
		}
	}
}

function markCopied() {
	copied.value = true
	clearTimeout(copiedTimer)
	copiedTimer = setTimeout(() => {
		copied.value = false
	}, props.copiedFeedbackMs)
}

defineExpose({
	copy,
	append,
	appendYamlProperty,
	appendSection,
	clear,
	getContentAsString,
})
</script>

<style scoped>
.readonly-textarea {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
	min-width: 0;
	max-width: 100%;
}

.readonly-textarea-header {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.readonly-textarea-header label {
	margin: 0;
}

.fg1 {
	flex: 1;
	min-width: 0;
}

.readonly-textarea-actions {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	margin-left: auto;
	flex-shrink: 0;
}

.readonly-textarea-actions-slot {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	flex-wrap: wrap;
}

.readonly-textarea-copy,
.readonly-textarea-clear {
	display: inline-flex;
	align-items: center;
	gap: 0.35em;
	flex-shrink: 0;
}

.readonly-textarea textarea {
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	resize: vertical;
	margin: 0;
}

.readonly-textarea textarea.monospace {
	font-family: monospace;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
</style>
