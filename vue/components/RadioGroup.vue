<template>
	<div
		:class="rootClasses"
		role="radiogroup"
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
				type="radio"
				:name="groupName"
				:value="option.key"
				:checked="isSelected(option)"
				:disabled="disabled || option.disabled"
				@change="select(option)"
			/>
			<span>{{ option.label }}</span>
		</label>
	</div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
	modelValue: {
		type: [String, Number, Boolean, null],
		default: null,
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

const rootClasses = computed(() => ({
	'radio-group': true,
	'radio-boolean': props.variant === 'boolean',
	'radio-list': props.variant === 'list',
	disabled: props.disabled,
}))

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
	return props.modelValue === option.value
}

function select(option) {
	if (props.disabled || option.disabled) {
		return
	}
	emit('update:modelValue', option.value)
	emit('change', option.value)
}
</script>

<style scoped>
/*
 * Default and boolean variants: hide the native radio chrome; keep the input
 * for semantics/keyboard. List (stacked) keeps the visible radio icon.
 */
.radio-group label {
	display: flex;
	align-items: center;
	box-sizing: border-box;
	padding-inline: 0.75em;
	gap: 0.5em;
}

.radio-group:not(.radio-list) label {
	position: relative;
	justify-content: center;
}

.radio-group input[type="radio"] {
	margin: 0;
	flex-shrink: 0;
}

.radio-group:not(.radio-list) input[type="radio"] {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	padding: 0;
	opacity: 0;
	cursor: inherit;
	z-index: 1;
}

.radio-group label:has(input:focus-visible) {
	outline: 2px solid black;
	outline-offset: 2px;
	z-index: 2;
}

/* Beat Femtocrank's gray .radio-group focus/hover when the option is selected. */
.radio-group label:has(input:checked):hover,
.radio-group label:has(input:checked:focus-visible) {
	background-color: #3a6f3a;
	color: white;
}

.radio-group.disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.radio-group label.disabled,
.radio-group.disabled label {
	background-color: var(--disabled-background-color);
	color: var(--disabled-text-color);
	cursor: not-allowed;
}

.radio-group label.disabled:hover,
.radio-group label.disabled:has(input:focus-visible),
.radio-group label.disabled:has(input:checked),
.radio-group label.disabled:has(input:checked):hover,
.radio-group.disabled label:hover,
.radio-group.disabled label:has(input:focus-visible),
.radio-group.disabled label:has(input:checked),
.radio-group.disabled label:has(input:checked):hover {
	background-color: var(--disabled-background-color);
	color: var(--disabled-text-color);
}

.radio-group label.disabled:has(input:focus-visible),
.radio-group.disabled label:has(input:focus-visible) {
	outline: 2px solid black;
	outline-offset: 2px;
}
</style>
