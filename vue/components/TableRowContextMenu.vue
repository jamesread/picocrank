<template>
	<ContextMenu
		class="table-row-context-menu"
		aria-label="Row actions"
		:open="open"
		:items="items"
		:client-x="clientX"
		:client-y="clientY"
		:target-count="targetCount"
		@update:open="emit('update:open', $event)"
		@select="emit('select', $event)"
		@cancel="emit('cancel')"
	/>
</template>

<script setup>
// Table's row menu: a ContextMenu named "Row actions". Kept for existing imports.
import ContextMenu from './ContextMenu.vue'

defineProps({
	open: {
		type: Boolean,
		default: false,
	},
	items: {
		type: Array,
		default: () => [],
	},
	clientX: {
		type: Number,
		default: 0,
	},
	clientY: {
		type: Number,
		default: 0,
	},
	targetCount: {
		type: Number,
		default: 1,
	},
})

const emit = defineEmits(['update:open', 'select', 'cancel'])
</script>
