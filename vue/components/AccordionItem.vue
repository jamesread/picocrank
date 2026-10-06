<template>
	<details
		:id="`accordion-item-${itemId}`"
		class="accordion-item"
		:open="open"
		@toggle="onToggle"
	>
		<summary
			class="section-subheader accordion-trigger flex-row"
			:id="`accordion-trigger-${itemId}`"
		>
			<HugeiconsIcon
				class="accordion-chevron"
				:icon="ArrowDown01Icon"
				width="1em"
				height="1em"
				aria-hidden="true"
			/>
			<h3>{{ title }}</h3>
		</summary>
		<div
			:id="`accordion-panel-${itemId}`"
			class="section-content padding"
		>
			<slot />
		</div>
	</details>
</template>

<script setup>
import { computed, inject } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { accordionContextKey } from './accordionContext.js'

const props = defineProps({
	itemId: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
})

const accordion = inject(accordionContextKey, null)

const open = computed(() => accordion?.isOpen(props.itemId) ?? false)

function onToggle(event) {
	accordion?.setOpen(props.itemId, event.currentTarget.open)
}
</script>

<style scoped>
.accordion-trigger {
	width: 100%;
	margin: 0;
	padding-right: 1em;
	border: none;
	background: none;
	cursor: pointer;
	font: inherit;
	color: inherit;
	text-align: left;
	list-style: none;
	gap: 0.35rem;
	box-sizing: border-box;
	transition: background-color 0.15s ease, color 0.15s ease;
}

.accordion-trigger:hover {
	background-color: var(--hover-background-color);
	color: var(--hover-text-color, inherit);
}

.accordion-trigger:focus-visible {
	outline: 2px solid var(--focus-outline-color, var(--text-color));
	outline-offset: -2px;
}

.accordion-trigger::-webkit-details-marker {
	display: none;
}

.accordion-trigger::marker {
	content: '';
}

.accordion-trigger h3 {
	margin: 0;
}

.accordion-chevron {
	flex-shrink: 0;
	transition: transform 0.15s ease;
}

.accordion-item[open] .accordion-chevron {
	transform: rotate(180deg);
}
</style>
