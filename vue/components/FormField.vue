<template>
	<label v-if="!fake" :for="controlId" :class="{ disabled }">{{ label }}</label>
	<span v-else class="fake-label" :class="{ disabled }">{{ label }}</span>
	<div v-if="hasFieldMeta" class="form-field-control">
		<template v-if="descriptionAbove">
			<div v-if="description || docsUrl" class="form-field-meta">
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
		</template>
		<template v-else>
			<slot />
			<div v-if="description || docsUrl" class="form-field-meta">
				<p v-if="description" class="subtle form-field-description">{{ description }}</p>
				<a
					v-if="docsUrl"
					class="form-field-docs-link"
					:href="docsUrl"
					target="_blank"
					rel="noopener noreferrer"
				>{{ docsLinkTitle }}</a>
			</div>
		</template>
	</div>
	<slot v-else />
</template>

<script setup>
import { computed } from 'vue'

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
const hasFieldMeta = computed(() => Boolean(props.description || props.docsUrl))
const docsLinkTitle = computed(() => props.docsUrlTitle || props.docsUrl)
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
</style>
