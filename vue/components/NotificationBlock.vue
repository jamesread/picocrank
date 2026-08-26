<template>
	<div
		:class="rootClasses"
		:role="role"
		@click="handleClick"
	>
		<span class="notification-key">{{ displayLabel }}</span>
		<span class="notification-body">
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
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

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
})

const emit = defineEmits(['click', 'dismiss'])

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

const rootClasses = computed(() => ({
	notification: true,
	[props.type]: true,
	clickable: props.clickable || props.dismissible,
}))

function handleClick(event) {
	emit('click', event)
	if (props.dismissible) {
		emit('dismiss', event)
	}
}
</script>
