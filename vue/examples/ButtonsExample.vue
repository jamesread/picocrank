<template>
	<Section
		title="Buttons"
		subtitle="Femtocrank button styles and semantic types"
	>
		<p>
			Buttons use the global Femtocrank theme. Apply karma classes for intent, or
			rely on <code>type</code> attributes for form semantics. Use
			<code>.inline-icon</code> on buttons with icons, and
			<code>aria-label</code> when there is no visible text.
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

	<Section title="Icon and text" subtitle="Hugeicons with a visible label">
		<div role="toolbar" class="buttons-row">
			<button type="button" class="inline-icon">
				<HugeiconsIcon :icon="Add01Icon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
				<span>Add item</span>
			</button>
			<button type="button" class="inline-icon neutral">
				<HugeiconsIcon :icon="EditIcon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
				<span>Edit</span>
			</button>
			<button type="button" class="inline-icon good">
				<HugeiconsIcon :icon="SearchIcon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
				<span>Search</span>
			</button>
			<button type="button" class="inline-icon">
				<HugeiconsIcon :icon="Copy01Icon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
				<span>Copy</span>
			</button>
		</div>
	</Section>

	<Section title="Icon only" subtitle="Hugeicons without visible text">
		<div role="toolbar" class="buttons-row">
			<button type="button" class="inline-icon" aria-label="Add item">
				<HugeiconsIcon :icon="Add01Icon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
			</button>
			<button type="button" class="inline-icon neutral" aria-label="Edit">
				<HugeiconsIcon :icon="EditIcon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
			</button>
			<button type="button" class="inline-icon good" aria-label="Search">
				<HugeiconsIcon :icon="SearchIcon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
			</button>
			<button type="button" class="inline-icon bad" aria-label="Delete">
				<HugeiconsIcon :icon="Delete02Icon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
			</button>
			<button type="button" class="inline-icon neutral" aria-label="Settings">
				<HugeiconsIcon :icon="Settings01Icon" width="1em" height="1em" :strokeWidth="iconStrokeWidth" aria-hidden="true" />
			</button>
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
import { HugeiconsIcon } from '@hugeicons/vue'
import {
	Add01Icon,
	Copy01Icon,
	Delete02Icon,
	EditIcon,
	SearchIcon,
	Settings01Icon,
} from '@hugeicons/core-free-icons'
import Section from '../components/Section.vue'
import FormLayout from '../components/FormLayout.vue'

const lastAction = ref('')
const iconStrokeWidth = 2.5

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
