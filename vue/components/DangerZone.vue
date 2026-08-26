<template>
	<section class="with-header-and-content danger-zone">
		<details
			class="danger-zone-details"
			:open="open"
			@toggle="onToggle"
		>
			<summary class="danger-zone-summary section-header flex-row">
				<div class="fg1 danger-zone-heading">
					<h2 :title="subtitle || undefined" class="danger-zone-title">
						<HugeiconsIcon
							v-if="icon"
							:icon="icon"
							class="danger-zone-title-icon"
							width="1.1em"
							height="1.1em"
							:strokeWidth="2"
							aria-hidden="true"
						/>
						<span>{{ title }}</span>
					</h2>
					<span v-if="subtitle" class="danger-zone-subtitle subtle">{{ subtitle }}</span>
					<span v-if="description" class="danger-zone-description subtle">{{ description }}</span>
				</div>
				<span class="danger-zone-chevron" aria-hidden="true">▸</span>
			</summary>
			<Section
				:title="title"
				:subtitle="subtitle"
				:padding="padding"
				:icon="icon"
				:id="sectionId"
				classes="danger-zone-section"
			>
				<template v-if="$slots.toolbar" #toolbar>
					<slot name="toolbar" />
				</template>
				<p v-if="warning" class="danger-zone-warning">{{ warning }}</p>
				<slot />
			</Section>
		</details>
	</section>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import Section from './Section.vue'

defineProps({
	title: {
		type: String,
		default: 'Danger zone',
	},
	subtitle: {
		type: String,
		default: '',
	},
	description: {
		type: String,
		default: '',
	},
	warning: {
		type: String,
		default: 'These actions are permanent and cannot be undone.',
	},
	padding: {
		type: Boolean,
		default: true,
	},
	icon: {
		type: [Object, Array, Function],
		default: () => Alert02Icon,
	},
	sectionId: {
		type: String,
		default: '',
	},
})

const open = defineModel('open', {
	type: Boolean,
	default: false,
})

function onToggle(event) {
	open.value = event.target.open
}
</script>

<style scoped>
.danger-zone-details {
	display: block;
}

.danger-zone-summary {
	cursor: pointer;
	list-style: none;
	user-select: none;
	transition: background-color 0.2s ease;
}

.danger-zone-heading {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.35em 0.75em;
	min-width: 0;
}

.danger-zone-subtitle,
.danger-zone-description {
	line-height: 1.4;
}

.danger-zone-chevron {
	flex-shrink: 0;
	margin-left: 0.75em;
	transition: transform 0.15s ease;
}

.danger-zone-details[open] > .danger-zone-summary .danger-zone-chevron {
	transform: rotate(90deg);
}

.danger-zone-details[open] > .danger-zone-summary {
	background: var(--danger-zone-summary-hover-bg);
	border-bottom-color: var(--danger-zone-border);
}

.danger-zone-details:not([open]) > .danger-zone-summary {
	border-radius: 0.4em;
	border-bottom: none;
}

.danger-zone-summary::-webkit-details-marker {
	display: none;
}

.danger-zone-summary:hover {
	background: var(--danger-zone-summary-hover-bg);
}

.danger-zone-summary:focus {
	outline: none;
}

.danger-zone-summary:focus-visible {
	outline: 2px solid var(--danger-zone-focus-outline);
	outline-offset: -2px;
}

.danger-zone-title {
	display: inline-flex;
	align-items: center;
	gap: 0.45em;
	margin: 0;
	padding-top: 0.5em;
	padding-bottom: 0.5em;
}

.danger-zone-title-icon {
	flex: 0 0 auto;
}

.danger-zone :deep(.danger-zone-section.with-header-and-content) {
	margin: 0;
	border: none;
	border-radius: 0;
	box-shadow: none;
	background: transparent;
}

.danger-zone :deep(.danger-zone-section .section-header) {
	display: none;
}

.danger-zone :deep(.danger-zone-section .section-content) {
	border-top: none;
}

.danger-zone-warning {
	margin: 0 0 1rem;
	color: var(--danger-zone-warning-fg);
}
</style>
