<template>
	<div
		class="loading-area"
		:class="{
			'is-loading': loading,
			'is-overlay': loading && overlay && hasContent,
		}"
		:style="rootStyle"
		:aria-busy="loading ? 'true' : 'false'"
	>
		<div
			v-if="loading"
			class="loading-area-placeholder"
			role="status"
			aria-live="polite"
		>
			<slot name="placeholder">
				<HugeiconsIcon
					:icon="resolvedIcon"
					class="loading-area-spinner"
					:size="resolvedIconSize"
					:strokeWidth="2"
					aria-hidden="true"
				/>
				<p v-if="message" class="loading-area-message">{{ message }}</p>
			</slot>
		</div>

		<div
			v-if="hasContent"
			v-show="!loading || overlay"
			class="loading-area-content"
			:aria-hidden="loading && overlay ? 'true' : undefined"
		>
			<slot />
		</div>
	</div>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Loading03Icon } from '@hugeicons/core-free-icons'

const props = defineProps({
	/**
	 * When true, shows the loading placeholder (and optionally overlays content).
	 */
	loading: {
		type: Boolean,
		default: true,
	},
	/**
	 * Status text announced to assistive tech and shown under the spinner.
	 * Pass an empty string to hide the message.
	 */
	message: {
		type: String,
		default: 'Loading…',
	},
	/**
	 * Keep default-slot content in the layout and cover it with the placeholder.
	 */
	overlay: {
		type: Boolean,
		default: false,
	},
	/**
	 * Hugeicons icon definition. Defaults to Loading03Icon.
	 */
	icon: {
		type: [Object, Array, Function],
		default: null,
	},
	/**
	 * Spinner size in px, or a CSS length string (e.g. "1.5em").
	 */
	iconSize: {
		type: [Number, String],
		default: 28,
	},
	/**
	 * Minimum height of the loading area (number = px, or any CSS length).
	 */
	minHeight: {
		type: [Number, String],
		default: null,
	},
})

const slots = useSlots()

const hasContent = computed(() => typeof slots.default === 'function')

const resolvedIcon = computed(() => props.icon || Loading03Icon)

const resolvedIconSize = computed(() => {
	if (typeof props.iconSize === 'number') {
		return props.iconSize
	}
	const parsed = Number.parseFloat(props.iconSize)
	return Number.isFinite(parsed) ? parsed : 28
})

const rootStyle = computed(() => {
	if (props.minHeight == null || props.minHeight === '') {
		return undefined
	}
	const value = typeof props.minHeight === 'number'
		? `${props.minHeight}px`
		: props.minHeight
	return { minHeight: value }
})
</script>

<style scoped>
.loading-area {
	position: relative;
	display: block;
	min-width: 0;
}

.loading-area-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	padding: 2rem 1rem;
	text-align: center;
	color: var(--table-muted-fg, var(--muted-text-color));
}

.loading-area.is-overlay > .loading-area-placeholder {
	position: absolute;
	inset: 0;
	z-index: 1;
	box-sizing: border-box;
	background-color: color-mix(in srgb, var(--section-bg-color, #fff) 78%, transparent);
}

.loading-area-spinner {
	display: block;
	flex: 0 0 auto;
	animation: loading-area-spin 0.8s linear infinite;
}

.loading-area-message {
	margin: 0;
	font-size: 0.95em;
}

.loading-area-content {
	min-width: 0;
}

.loading-area.is-overlay > .loading-area-content {
	pointer-events: none;
	user-select: none;
}

@keyframes loading-area-spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.loading-area-spinner {
		animation: none;
	}
}
</style>
