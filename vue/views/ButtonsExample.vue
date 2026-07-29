<template>
	<Section
		title="Buttons"
		subtitle="Femtocrank button styles and semantic types"
	>
		<p>
			Buttons use the global Femtocrank theme. Apply karma classes for intent, or
			rely on <code>type</code> attributes for form semantics.
		</p>
	</Section>

	<Section title="Variants" subtitle="Default and karma-styled buttons">
		<div role="toolbar" class="buttons-row">
			<button type="button">Default</button>
			<button type="button" class="neutral">Neutral</button>
			<button type="button" class="good">Good</button>
			<button type="button" class="bad">Bad</button>
			<button type="button" class="warning">Warning</button>
		</div>
	</Section>

	<Section title="Form actions" subtitle="Semantic button types in a fieldset">
		<FormLayout class="buttons-demo-form" @submit.prevent="onSubmit">
			<template #actions>
				<button type="submit">Submit</button>
				<button type="cancel">Cancel</button>
				<button type="reset" @click="onReset">Reset</button>
			</template>
		</FormLayout>
		<p v-if="lastAction" class="subtle">{{ lastAction }}</p>
	</Section>

	<Section title="Links as buttons" subtitle="Anchor elements with the .button class">
		<div role="toolbar" class="buttons-row">
			<a href="#" class="button" @click.prevent>Default link</a>
			<a href="#" class="button neutral" @click.prevent>Neutral link</a>
			<a href="#" class="button good" @click.prevent>Good link</a>
		</div>
	</Section>

	<Section title="Disabled" subtitle="Inactive buttons">
		<div role="toolbar" class="buttons-row">
			<button type="button" disabled>Disabled default</button>
			<button type="submit" disabled>Disabled submit</button>
			<button type="button" class="good" disabled>Disabled good</button>
		</div>
	</Section>

	<Section title="Toolbars" subtitle="Grouped actions in section headers and content">
		<template #toolbar>
			<button type="button">Preview</button>
			<button type="button" class="good">Save</button>
		</template>

		<p>
			Section toolbars are a common place for primary and secondary actions. The
			toolbar above mirrors the pattern used across other PicoCrank examples.
		</p>

		<div role="toolbar" class="buttons-row">
			<button type="button" class="neutral">Neutral</button>
			<button type="button" class="good">Good</button>
			<button type="button" class="bad">Bad</button>
		</div>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import Section from '../components/Section.vue'
import FormLayout from '../components/FormLayout.vue'

const lastAction = ref('')

function onSubmit() {
	lastAction.value = 'Form submitted.'
}

function onReset() {
	lastAction.value = 'Form reset.'
}
</script>

<style scoped>
.buttons-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.buttons-demo-form fieldset {
	margin-bottom: 0;
}
</style>
