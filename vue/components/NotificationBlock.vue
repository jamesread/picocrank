<template>
	<div
		:class="rootClasses"
		:role="role"
		@click="handleClick"
	>
		<span class="notification-key">{{ displayLabel }}</span>
		<span ref="bodyRef" class="notification-body">
			<slot>
				<template v-if="hasLink">
					<template v-if="messagePrefix">{{ messagePrefix }}</template><RouterLink
						v-if="linkTo"
						:to="linkTo"
						@click.stop
					>{{ linkLabel }}</RouterLink><a
						v-else
						:href="linkHref || '#'"
						@click.stop
					>{{ linkLabel }}</a><template v-if="messageSuffix">{{ messageSuffix }}</template>
				</template>
				<template v-else>{{ message }}</template>
			</slot>
		</span>
		<button
			v-if="showCopyButton"
			type="button"
			class="notification-copy"
			:title="copied ? 'Copied' : 'Copy to clipboard'"
			:aria-label="copied ? 'Copied' : 'Copy to clipboard'"
			@click.stop="copyToClipboard"
		>
			<HugeiconsIcon
				:icon="copied ? CopyCheckIcon : Copy01Icon"
				width="1em"
				height="1em"
				aria-hidden="true"
			/>
		</button>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Copy01Icon, CopyCheckIcon } from '@hugeicons/core-free-icons'

const TYPE_LABELS = {
	info: 'INFO:',
	note: 'NOTE:',
	success: 'SUCCESS:',
	good: 'SUCCESS:',
	warning: 'WARNING:',
	severe: 'SEVERE:',
	critical: 'CRITICAL:',
	error: 'CRITICAL:',
	bad: 'CRITICAL:',
	old: 'OLD:',
}

const COPYABLE_TYPES = new Set(['critical', 'error', 'bad'])

const props = defineProps({
	type: {
		type: String,
		default: 'info',
		validator: (value) => (
			['info', 'note', 'success', 'good', 'warning', 'severe', 'critical', 'error', 'bad', 'old'].includes(value)
		),
	},
	label: {
		type: String,
		default: '',
	},
	message: {
		type: String,
		default: '',
	},
	messagePrefix: {
		type: String,
		default: '',
	},
	linkLabel: {
		type: String,
		default: '',
	},
	linkHref: {
		type: String,
		default: '',
	},
	linkTo: {
		type: [String, Object],
		default: null,
	},
	messageSuffix: {
		type: String,
		default: '',
	},
	clickable: {
		type: Boolean,
		default: false,
	},
	dismissible: {
		type: Boolean,
		default: false,
	},
	role: {
		type: String,
		default: 'status',
	},
	/**
	 * Nest the block directly under a control (flat top edge, shared width).
	 * Pair with an input, select, or textarea immediately above.
	 */
	attachedBelow: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['click', 'dismiss'])

const bodyRef = ref(null)
const copied = ref(false)
let copiedTimer

const displayLabel = computed(() => {
	const trimmed = props.label.trim()
	if (trimmed) {
		return trimmed.endsWith(':') ? trimmed : `${trimmed}:`
	}
	return TYPE_LABELS[props.type]
})

const hasLink = computed(() => Boolean(
	props.linkLabel && (props.linkHref || props.linkTo)
))

const showCopyButton = computed(() => COPYABLE_TYPES.has(props.type))

const rootClasses = computed(() => ({
	notification: true,
	[props.type]: true,
	'attached-below': props.attachedBelow,
	clickable: props.clickable || props.dismissible,
}))

function handleClick(event) {
	emit('click', event)
	if (props.dismissible) {
		emit('dismiss', event)
	}
}

function copyText() {
	const fromBody = bodyRef.value?.textContent?.trim()
	if (fromBody) {
		return fromBody
	}
	return props.message.trim()
}

function markCopied() {
	copied.value = true
	clearTimeout(copiedTimer)
	copiedTimer = setTimeout(() => {
		copied.value = false
	}, 1500)
}

async function copyToClipboard() {
	const text = copyText()
	if (!text) {
		return
	}

	try {
		await navigator.clipboard.writeText(text)
		markCopied()
	} catch (_error) {
		try {
			const textarea = document.createElement('textarea')
			textarea.value = text
			textarea.setAttribute('readonly', '')
			textarea.style.position = 'fixed'
			textarea.style.opacity = '0'
			document.body.appendChild(textarea)
			textarea.select()
			document.execCommand('copy')
			document.body.removeChild(textarea)
			markCopied()
		} catch (_fallbackError) {
			// Clipboard unavailable; leave UI unchanged.
		}
	}
}
</script>

<style scoped>
.notification.attached-below {
	box-sizing: border-box;
	width: 100%;
	margin: 0;
	border-top: none;
	border-radius: 0 0 0.4em 0.4em;
}

.notification.attached-below.bad,
.notification.attached-below.error,
.notification.attached-below.critical {
	border-color: var(--karma-bad-border);
}

.notification-copy {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	align-self: center;
	width: 1.75rem;
	height: 1.75rem;
	margin: 0 0.35rem 0 0;
	padding: 0;
	border: 0;
	border-radius: 0.35rem;
	background: transparent;
	color: var(--text-color);
	cursor: pointer;
	opacity: 0.7;
}

.notification-copy:hover {
	opacity: 1;
	background: var(--hover-background-color, color-mix(in srgb, var(--text-color) 10%, transparent));
}
</style>
