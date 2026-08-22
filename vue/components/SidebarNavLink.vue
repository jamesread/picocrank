<template>
	<li
		:title="link.title"
		:class="{ disabled: link.disabled }"
	>
		<div v-if="link.type === 'separator'" class="separator" role="separator" />
		<div v-else-if="link.type === 'html'" v-html="link.html"></div>
		<a
			v-else-if="link.type === 'callback' || link.disabled"
			href="#"
			:class="{ active: active, disabled: link.disabled }"
			:aria-label="accessibleName"
			:aria-disabled="link.disabled || undefined"
			:tabindex="link.disabled ? -1 : undefined"
			@click.prevent="emit('select', link)"
		>
			<HugeiconsIcon :icon="link.icon" aria-hidden="true" />
			<span class="nav-link-title" aria-hidden="true">{{ link.title }}</span>
			<span
				v-if="showCount"
				class="nav-link-count"
				aria-hidden="true"
			>{{ formatCount(link.count) }}</span>
			<span
				v-else-if="showIndicator"
				class="nav-link-indicator"
				aria-hidden="true"
			/>
		</a>
		<router-link
			v-else
			v-bind="link.props || {}"
			:to="link.to || link.path"
			:class="{ active }"
			:aria-label="needsCustomName ? accessibleName : undefined"
			:aria-current="active ? 'page' : undefined"
			@click="emit('select', link)"
		>
			<HugeiconsIcon :icon="link.icon" aria-hidden="true" />
			<span class="nav-link-title" :aria-hidden="needsCustomName ? 'true' : undefined">{{ link.title }}</span>
			<span
				v-if="showCount"
				class="nav-link-count"
				aria-hidden="true"
			>{{ formatCount(link.count) }}</span>
			<span
				v-else-if="showIndicator"
				class="nav-link-indicator"
				aria-hidden="true"
			/>
		</router-link>
	</li>
</template>

<script setup>
import { computed } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'

const props = defineProps({
	link: {
		type: Object,
		required: true,
	},
	active: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['select'])

const showCount = computed(() => (
	!props.link.disabled && props.link.count != null && props.link.count > 0
))

const showIndicator = computed(() => (
	props.link.indicator && !props.link.disabled && !showCount.value
))

const needsCustomName = computed(() => showCount.value || showIndicator.value)

const accessibleName = computed(() => {
	const parts = [props.link.title]
	if (showCount.value) {
		parts.push(`${props.link.count} notifications`)
	} else if (showIndicator.value) {
		parts.push('Requires attention')
	}
	if (props.link.disabled) {
		parts.push('unavailable')
	}
	return parts.join(', ')
})

function formatCount(count) {
	return count > 99 ? '99+' : String(count)
}
</script>

<style scoped>
a {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: .75em;
	border-radius: 0;
	position: relative;
	color: var(--text-color);
}

a.active {
	text-decoration: underline;
}

.nav-link-title {
	flex: 1;
	min-width: 0;
}

.nav-link-indicator {
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 50%;
	background: var(--indicator-color, #dc3545);
	flex-shrink: 0;
}

.nav-link-count {
	min-width: 1.25rem;
	padding: 0.1rem 0.4rem;
	border-radius: 999px;
	background: var(--indicator-color, #dc3545);
	color: #fff;
	font-size: 0.75em;
	font-weight: 600;
	line-height: 1.2;
	text-align: center;
	flex-shrink: 0;
}

a.disabled,
li.disabled a {
	cursor: not-allowed;
	opacity: 0.55;
}

.separator {
	height: 1px;
	background-color: var(--border-color);
	margin: 0.5rem 0.75rem;
}

a:hover,
a:focus-visible {
	background-color: var(--sidebar-hover-bg-color);
	color: var(--hover-text-color);
}
</style>
