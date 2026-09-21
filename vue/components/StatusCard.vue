<template>
	<component
		:is="rootComponent"
		v-bind="rootBindings"
		:class="rootClasses"
	>
		<div
			v-if="karma"
			class="status-card-bar"
			:class="{ 'status-card-bar--labeled': Boolean(barLabel) }"
		>
			<span
				v-if="barLabel"
				class="status-card-bar-label"
			>{{ barLabel }}</span>
		</div>
		<div class="status-card-body">
			<slot />
		</div>
	</component>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
	karma: {
		type: String,
		default: '',
		validator: (value) => (
			value === ''
			|| ['info', 'note', 'success', 'good', 'warning', 'severe', 'critical', 'error', 'bad', 'old'].includes(value)
		),
	},
	barLabel: {
		type: String,
		default: '',
	},
	align: {
		type: String,
		default: 'start',
		validator: (value) => ['start', 'center'].includes(value),
	},
	compact: {
		type: Boolean,
		default: false,
	},
	to: {
		type: [String, Object],
		default: null,
	},
	href: {
		type: String,
		default: '',
	},
})

const isLink = computed(() => Boolean(props.to || props.href))

const rootComponent = computed(() => {
	if (props.to) {
		return RouterLink
	}
	if (props.href) {
		return 'a'
	}
	return 'div'
})

const rootBindings = computed(() => {
	if (props.to) {
		return { to: props.to }
	}
	if (props.href) {
		return { href: props.href }
	}
	return {}
})

const rootClasses = computed(() => ({
	'status-card': true,
	'status-card--link': isLink.value,
	[`status-card--${props.karma}`]: Boolean(props.karma),
	[`status-card--align-${props.align}`]: true,
	'status-card--compact': props.compact,
}))
</script>

<style scoped>
.status-card {
	display: flex;
	align-items: stretch;
	position: relative;
	padding: 0;
	overflow: hidden;
	background: transparent;
	border: 1px solid var(--nav-grid-border);
	border-radius: 8px;
	color: inherit;
	text-align: left;
	transition: all 0.2s ease;
}

a.status-card {
	text-decoration: none;
	cursor: pointer;
}

.status-card:hover {
	border-color: var(--nav-grid-accent-fg);
	background: var(--nav-grid-hover-bg);
	color: var(--text-color);
	transform: translateY(-2px);
	box-shadow: 0 4px 8px var(--nav-grid-hover-shadow);
}

.status-card-bar {
	position: relative;
	flex: 0 0 0.35em;
	width: 0.35em;
}

.status-card-bar--labeled {
	flex-basis: 1.35em;
	width: 1.35em;
}

.status-card-bar-label {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%) rotate(270deg);
	font-size: 0.65em;
	font-weight: 600;
	letter-spacing: 0.06em;
	line-height: 1;
	text-transform: uppercase;
	white-space: nowrap;
	color: var(--text-color);
	user-select: none;
}

.status-card-body {
	display: flex;
	flex: 1;
	flex-direction: column;
	justify-content: flex-start;
	gap: 0.25rem;
	min-width: 0;
	padding: 1.25rem 0.75rem;
}

.status-card--compact .status-card-body {
	padding: 0.75rem 0.5rem;
	gap: 0.15rem;
}

.status-card--align-start .status-card-body {
	align-items: flex-start;
	text-align: left;
}

.status-card--align-center .status-card-body {
	align-items: center;
	text-align: center;
}

.status-card-body :deep(h4) {
	margin: 0;
}

.status-card-body :deep(.subtle) {
	margin-top: 0.35rem;
}

.status-card--compact .status-card-body :deep(.subtle) {
	margin-top: 0.2rem;
}

.status-card--good .status-card-bar,
.status-card--success .status-card-bar {
	background-color: var(--karma-good-tint);
}

.status-card--bad .status-card-bar,
.status-card--critical .status-card-bar,
.status-card--error .status-card-bar {
	background-color: var(--karma-bad-tint);
}

.status-card--warning .status-card-bar {
	background-color: var(--karma-warning-tint);
}

.status-card--severe .status-card-bar {
	background-color: var(--karma-severe-tint);
}

.status-card--note .status-card-bar {
	background-color: var(--karma-note-tint);
}

.status-card--info .status-card-bar {
	background-color: var(--karma-info-tint);
}

.status-card--old .status-card-bar {
	background-color: var(--karma-old-tint);
}
</style>
