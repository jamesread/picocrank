<template>
	<div class="readonly-textarea">
		<div v-if="label || showCopyButton" class="readonly-textarea-header">
			<label v-if="label" :for="textareaId">{{ label }}</label>
			<div v-else class="fg1" />
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
import { ref, computed, useId } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Copy01Icon, CopyCheckIcon } from '@hugeicons/core-free-icons'

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
	copyLabel: {
		type: String,
		default: 'Copy',
	},
	copiedLabel: {
		type: String,
		default: 'Copied',
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

const emit = defineEmits(['copy', 'copy-error'])

const generatedId = useId()
const textareaId = props.id || `readonly-textarea-${generatedId}`
const textareaRef = ref(null)
const copied = ref(false)
let copiedTimer = null

const displayValue = computed(() => {
	if (!props.markdownTicks || !props.modelValue) {
		return props.modelValue
	}

	const openingFence = props.markdownLang ? `\`\`\`${props.markdownLang}` : '```'
	return `${openingFence}\n${props.modelValue}\n\`\`\``
})

async function copy() {
	if (!props.modelValue) {
		return
	}

	const text = displayValue.value

	try {
		await navigator.clipboard.writeText(text)
		markCopied()
		emit('copy', text)
	} catch (error) {
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
})
</script>

<style scoped>
.readonly-textarea {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
}

.readonly-textarea-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
}

.readonly-textarea-header label {
	margin: 0;
}

.fg1 {
	flex: 1;
}

.readonly-textarea-copy {
	display: inline-flex;
	align-items: center;
	gap: 0.35em;
}

.readonly-textarea textarea {
	width: 100%;
	resize: vertical;
	margin: 0;
}

.readonly-textarea textarea.monospace {
	font-family: monospace;
	white-space: pre;
}
</style>
