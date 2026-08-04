<template>
	<div
		:class="['multiple-checklist', { disabled }]"
		role="group"
		:aria-labelledby="ariaLabelledby || undefined"
		:aria-label="ariaLabel || undefined"
		:aria-disabled="disabled ? 'true' : undefined"
	>
		<label
			v-for="option in normalizedOptions"
			:key="option.key"
			:class="{ disabled: disabled || option.disabled }"
		>
			<input
				type="checkbox"
				:name="groupName"
				:value="option.key"
				:checked="isSelected(option)"
				:disabled="disabled || option.disabled"
				@change="toggle(option)"
			/>
			<span>{{ option.label }}</span>
		</label>
	</div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
	modelValue: {
		type: Array,
		default: () => [],
	},
	options: {
		type: Array,
		required: true,
		validator: (options) => Array.isArray(options) && options.every((option) => {
			if (typeof option === 'string' || typeof option === 'number') {
				return true
			}
			return option
				&& typeof option === 'object'
				&& 'value' in option
				&& typeof option.label === 'string'
		}),
	},
	name: {
		type: String,
		default: '',
	},
	// Accepted for API parity with RadioGroup; CheckGroup has a single Femtocrank layout.
	variant: {
		type: String,
		default: 'default',
		validator: (value) => ['default', 'boolean', 'list'].includes(value),
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	ariaLabelledby: {
		type: String,
		default: '',
	},
	ariaLabel: {
		type: String,
		default: '',
	},
})

const emit = defineEmits(['update:modelValue', 'change'])

const generatedName = useId()

const groupName = computed(() => props.name || generatedName)

const selectedValues = computed(() => (
	Array.isArray(props.modelValue) ? props.modelValue : []
))

const normalizedOptions = computed(() => props.options.map((option, index) => {
	if (typeof option === 'string' || typeof option === 'number') {
		return {
			key: String(index),
			label: String(option),
			value: option,
			disabled: false,
		}
	}

	return {
		key: String(index),
		label: option.label,
		value: option.value,
		disabled: Boolean(option.disabled),
	}
}))

function isSelected(option) {
	return selectedValues.value.includes(option.value)
}

function toggle(option) {
	if (props.disabled || option.disabled) {
		return
	}

	const next = isSelected(option)
		? selectedValues.value.filter((value) => value !== option.value)
		: [...selectedValues.value, option.value]

	emit('update:modelValue', next)
	emit('change', next)
}
</script>

<style scoped>
.multiple-checklist label {
	display: flex;
	align-items: center;
	box-sizing: border-box;
	gap: 0.5em;
	padding-inline: 0.75em;
	margin: 0;
}

.multiple-checklist input[type="checkbox"] {
	margin: 0;
	flex-shrink: 0;
}

.multiple-checklist.disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.multiple-checklist label.disabled,
.multiple-checklist.disabled label {
	background-color: var(--disabled-background-color);
	color: var(--disabled-text-color);
	cursor: not-allowed;
}

.multiple-checklist label.disabled:hover,
.multiple-checklist label.disabled:has(input:focus-visible),
.multiple-checklist label.disabled:has(input:checked),
.multiple-checklist label.disabled:has(input:checked):hover,
.multiple-checklist.disabled label:hover,
.multiple-checklist.disabled label:has(input:focus-visible),
.multiple-checklist.disabled label:has(input:checked),
.multiple-checklist.disabled label:has(input:checked):hover {
	background-color: var(--disabled-background-color);
	color: var(--disabled-text-color);
}
</style>
