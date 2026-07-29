<template>
	<label v-if="!fake" :for="controlId">{{ label }}</label>
	<span v-else class="fake-label">{{ label }}</span>
	<slot />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	label: {
		type: String,
		required: true,
	},
	for: {
		type: String,
		default: '',
	},
	htmlFor: {
		type: String,
		default: '',
	},
	fake: {
		type: Boolean,
		default: false,
	},
})

const controlId = computed(() => props.htmlFor || props.for)
</script>
