<template>
	<label v-if="showLabel && !componentHasLabel" :for="controlId" :class="{ disabled }">
		<span class="form-field-label-text">{{ label }}</span><span v-if="showRequiredLabel" class="form-field-required" aria-hidden="true">*</span>
	</label>
	<span v-else-if="showLabel" class="fake-label" :class="{ disabled }">
		<span class="form-field-label-text">{{ label }}</span><span v-if="showRequiredLabel" class="form-field-required" aria-hidden="true">*</span>
	</span>
	<div
		ref="fieldControlRef"
		class="form-field-control"
		:class="{ 'form-field-label-skip': labelSkip }"
	>
		<div v-if="descriptionAbove && hasFieldMeta" class="form-field-meta">
			<p v-if="description" class="subtle form-field-description">{{ description }}</p>
			<a
				v-if="docsUrl"
				class="form-field-docs-link"
				:href="docsUrl"
				target="_blank"
				rel="noopener noreferrer"
			>{{ docsLinkTitle }}</a>
		</div>
		<slot />
		<NotificationBlock
			v-if="fieldError"
			:id="errorId"
			class="form-field-error"
			type="bad"
			label="Error"
			:message="fieldError"
			role="alert"
		/>
		<div v-if="!descriptionAbove && hasFieldMeta" class="form-field-meta">
			<p v-if="description" class="subtle form-field-description">{{ description }}</p>
			<a
				v-if="docsUrl"
				class="form-field-docs-link"
				:href="docsUrl"
				target="_blank"
				rel="noopener noreferrer"
			>{{ docsLinkTitle }}</a>
		</div>
	</div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import NotificationBlock from './NotificationBlock.vue'

const props = defineProps({
	label: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		default: '',
	},
	descriptionAbove: {
		type: Boolean,
		default: false,
	},
	docsUrl: {
		type: String,
		default: '',
	},
	docsUrlTitle: {
		type: String,
		default: '',
	},
	for: {
		type: String,
		default: '',
	},
	htmlFor: {
		type: String,
		default: '',
	},
	componentHasLabel: {
		type: Boolean,
		default: false,
	},
	labelSkip: {
		type: Boolean,
		default: false,
	},
	labelRequired: {
		type: Boolean,
		default: false,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	error: {
		type: String,
		default: '',
	},
	validate: {
		type: Function,
		default: null,
	},
	validateDeps: {
		type: Array,
		default: () => [],
	},
})

const emit = defineEmits(['update:error'])

const controlId = computed(() => props.htmlFor || props.for)
const showLabel = computed(() => !props.labelSkip)
const hasFieldMeta = computed(() => Boolean(props.description || props.docsUrl))
const docsLinkTitle = computed(() => props.docsUrlTitle || props.docsUrl)
const errorId = useId()
const FIELD_INVALID_CLASS = 'field-invalid'
const fieldControlRef = ref(null)
const controlRequired = ref(false)
let boundControl = null

function onControlInput() {
	if (props.error.trim()) {
		emit('update:error', '')
	}
}

function bindControlListeners() {
	unbindControlListeners()
	const element = getControlElement()
	if (!element) {
		return
	}
	element.addEventListener('input', onControlInput)
	element.addEventListener('change', onControlInput)
	boundControl = element
}

function unbindControlListeners() {
	if (!boundControl) {
		return
	}
	boundControl.removeEventListener('input', onControlInput)
	boundControl.removeEventListener('change', onControlInput)
	boundControl = null
}

const showRequiredLabel = computed(() => props.labelRequired || controlRequired.value)

const fieldError = computed(() => {
	// Re-run when parent passes reactive deps (e.g. v-model values).
	void props.validateDeps

	if (props.error.trim()) {
		return props.error.trim()
	}
	if (typeof props.validate === 'function') {
		const result = props.validate()
		return typeof result === 'string' ? result.trim() : ''
	}
	return ''
})

function getControlElement() {
	if (!controlId.value) {
		return null
	}
	return document.getElementById(controlId.value)
}

function syncRequiredState() {
	const linkedControl = getControlElement()
	if (linkedControl) {
		controlRequired.value = linkedControl.required === true
		return
	}

	const container = fieldControlRef.value
	controlRequired.value = Boolean(
		container?.querySelector('input[required], select[required], textarea[required]'),
	)
}

function syncControlState() {
	syncNativeValidity()
	syncRequiredState()
}

function syncNativeValidity() {
	const element = getControlElement()
	const canUseNativeValidity = Boolean(
		controlId.value
		&& !props.componentHasLabel
		&& element
		&& typeof element.setCustomValidity === 'function',
	)

	if (!canUseNativeValidity) {
		clearNativeFieldState(element)
		return
	}

	element.setCustomValidity(fieldError.value || '')
	if (fieldError.value) {
		element.setAttribute('aria-invalid', 'true')
		element.classList.add(FIELD_INVALID_CLASS)
		setErrorDescribedBy(element)
	} else {
		element.removeAttribute('aria-invalid')
		element.classList.remove(FIELD_INVALID_CLASS)
		removeErrorDescribedBy(element)
	}
}

function clearNativeFieldState(element) {
	if (!element) {
		return
	}
	if (typeof element.setCustomValidity === 'function') {
		element.setCustomValidity('')
	}
	element.removeAttribute('aria-invalid')
	element.classList.remove(FIELD_INVALID_CLASS)
	removeErrorDescribedBy(element)
}

function setErrorDescribedBy(element) {
	const existing = element.getAttribute('aria-describedby')
	const ids = existing ? existing.split(/\s+/).filter(Boolean) : []
	if (!ids.includes(errorId)) {
		ids.push(errorId)
	}
	element.setAttribute('aria-describedby', ids.join(' '))
}

function removeErrorDescribedBy(element) {
	const existing = element.getAttribute('aria-describedby')
	if (!existing) {
		return
	}
	const ids = existing.split(/\s+/).filter((id) => id !== errorId)
	if (ids.length > 0) {
		element.setAttribute('aria-describedby', ids.join(' '))
	} else {
		element.removeAttribute('aria-describedby')
	}
}

watch(
	() => [fieldError.value, controlId.value, props.componentHasLabel],
	() => {
		nextTick(syncControlState)
	},
	{ flush: 'post' },
)

watch(
	controlId,
	() => {
		nextTick(bindControlListeners)
	},
)

onMounted(() => {
	nextTick(() => {
		syncControlState()
		bindControlListeners()
	})
})

onBeforeUnmount(() => {
	const element = boundControl || getControlElement()
	unbindControlListeners()
	clearNativeFieldState(element)
})
</script>

<style scoped>
label.disabled,
.fake-label.disabled {
	color: var(--disabled-text-color);
	cursor: not-allowed;
}

.form-field-control {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: 100%;
}

.form-field-meta {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}

.form-field-description {
	margin: 0;
}

.form-field-docs-link {
	font-size: 0.9em;
	align-self: flex-start;
}

.form-field-control :deep(.form-field-error) {
	font-size: 0.9em;
}

.form-field-required {
	color: var(--form-field-required-fg);
	margin-left: 0.15em;
}
</style>
