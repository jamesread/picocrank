<template>
	<label v-if="!fake" :for="controlId" :class="{ disabled }">{{ label }}</label>
	<span v-else class="fake-label" :class="{ disabled }">{{ label }}</span>
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
	disabled: {
		type: Boolean,
		default: false,
	},
})

const controlId = computed(() => props.htmlFor || props.for)
</script>

<style scoped>
label.disabled,
.fake-label.disabled {
	color: var(--disabled-text-color);
	cursor: not-allowed;
}
</style>
