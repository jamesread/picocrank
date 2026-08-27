<template>
	<Section 
		title="Form Example" 
		subtitle="A simple form demonstrating Femtocrank form layout"
	>
		<template #toolbar>
			<button @click="resetForm">Reset</button>
		</template>

		<FormLayout @submit.prevent="handleSubmit">
			<FormField
				label="Name"
				for="name"
				description="Your full name as it will appear on your profile."
			>
				<input 
					id="name"
					v-model="formData.name" 
					type="text" 
					placeholder="Enter your name"
					required
				/>
			</FormField>

			<FormField label="Role" component-has-label>
				<RadioGroup
					v-model="formData.role"
					name="role"
					:options="roleOptions"
				/>
			</FormField>

			<FormField label="Term" component-has-label>
				<RadioGroup
					v-model="formData.term"
					name="term"
					variant="boolean"
					:options="termOptions"
				/>
			</FormField>

			<FormField label="Salary" for="salary">
				<select id="salary" v-model="formData.salary">
					<option value="0">Select a salary</option>
					<option value="10000">£10,000</option>
					<option value="20000">£20,000</option>
					<option value="30000">£30,000</option>
					<option value="40000">£40,000</option>
					<option value="50000">£50,000</option>
				</select>
			</FormField>

			<FormField
				label="Compensation"
				component-has-label
				label-required
				description-above
				description="Select the incentive plan that applies to this role."
				docs-url="https://github.com/jamesread/femtocrank"
				docs-url-title="Femtocrank documentation"
			>
				<RadioGroup
					v-model="formData.compensation"
					name="compensation"
					variant="list"
					:options="compensationOptions"
				/>
			</FormField>

			<FormField
				label="Accessibility requirements"
				component-has-label
				description-above
				description="Choose any accommodations needed for this role."
				docs-url="https://www.w3.org/WAI/fundamentals/accessibility-intro/"
				docs-url-title="Web accessibility introduction"
				:validate="validateAccessibilityRequirements"
				:validate-deps="[formData.accessibility]"
			>
				<CheckGroup
					v-model="formData.accessibility"
					name="accessibility"
					:options="accessibilityOptions"
				/>
			</FormField>

			<FormField
				label="Email"
				for="email"
				:error="emailError"
				description="We'll use this address for account notifications only."
				docs-url="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email"
				docs-url-title="HTML email input reference"
			>
				<input 
					id="email"
					v-model="formData.email" 
					type="email" 
					placeholder="Enter your email"
					required
				/>
			</FormField>

			<FormField label="Is Administrator?">
				<input 
					type="checkbox" 
					id="is-admin"
					v-model="formData.isAdmin"
				/>
			</FormField>

			<FormField
				label="Website"
				for="website"
				description="Include https:// for external links."
				docs-url="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url"
				docs-url-title="HTML URL input reference"
			>
				<input 
					id="website"
					v-model="formData.website" 
					type="url" 
					placeholder="https://example.com"
				/>
			</FormField>

			<FormField label="Favourite Food" for="favourite-food">
				<input 
					id="favourite-food"
					v-model="formData.favouriteFood"
					type="text"
					placeholder="e.g. Pizza"
					disabled
				/>
			</FormField>

			<FormField label="Favourite Colour" for="favourite-colour">
				<input
					id="favourite-colour"
					v-model="formData.favouriteColour"
					type="color"
				/>
			</FormField>

			<FormField label="Favourite Number" for="favourite-number">
				<input
					id="favourite-number"
					v-model.number="formData.favouriteNumber"
					type="number"
					min="0"
					max="100"
					step="1"
				/>
			</FormField>

			<FormField label="Newsletters" component-has-label>
				<div>
					<label>
						<input 
							type="checkbox"
							id="newsletter1"
							v-model="formData.newsletter1"
						/>
						<span>Newsletter 1</span>
					</label>

					<label>
						<input 
							type="checkbox"
							id="newsletter2"
							v-model="formData.newsletter2"
						/>
						<span>Newsletter 2</span>
					</label>
				</div>
			</FormField>

			<FormField
				label="Comments"
				for="comments"
				:error="commentsError"
				description="Optional feedback or notes about this submission (minimum 50 characters when provided)."
			>
				<textarea
					id="comments"
					v-model="formData.comments"
				></textarea>
			</FormField>

			<FormField label="Readonly" for="readonly">
				<textarea
					id="readonly"
					v-model="formData.readonlyText"
					readonly
				></textarea>
			</FormField>

			<FormField label="Disabled" for="disabled">
				<textarea
					id="disabled"
					v-model="formData.disabledText"
					disabled
				></textarea>
			</FormField>

			<FormField label="Datetime" for="datetime">
				<input
					id="datetime"
					type="datetime-local"
					v-model="formData.datetime"
				/>
			</FormField>

			<template #actions>
				<button type="submit">Submit</button>
				<button type="button" @click="handleCancel">Cancel</button>
				<button type="reset" @click="resetForm">Reset</button>
				<button type="submit" disabled>Disabled</button>
			</template>
		</FormLayout>

		<div v-if="submitted" class="form-result">
			<h3>Form Submitted!</h3>
			<pre>{{ JSON.stringify(formData, null, 2) }}</pre>
		</div>
	</Section>
</template>

<script setup>
import { computed, ref } from 'vue'
import Section from '../components/Section.vue'
import FormLayout from '../components/FormLayout.vue'
import FormField from '../components/FormField.vue'
import RadioGroup from '../components/RadioGroup.vue'
import CheckGroup from '../components/CheckGroup.vue'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_COMMENTS_LENGTH = 50

function createDefaultFormData() {
	return {
		name: '',
		role: '',
		term: '',
		salary: '0',
		compensation: 'sales-target-incentive',
		accessibility: ['screen-reader', 'high-contrast'],
		email: 'not-an-email',
		isAdmin: false,
		website: '',
		favouriteFood: '',
		favouriteColour: '#dee3e7',
		favouriteNumber: 50,
		newsletter1: false,
		newsletter2: false,
		comments: 'Too short.',
		readonlyText: 'This is a readonly textarea.',
		disabledText: 'This is a disabled textarea.',
		datetime: '',
	}
}

// From femtocrank/tests/simple.html — Role (default), Term (boolean), Compensation (list)
const roleOptions = [
	{ label: 'Sales', value: 'sales' },
	{ label: 'Engineering', value: 'engineering' },
	{ label: 'HR', value: 'hr' },
]

const termOptions = [
	{ label: 'Full Time', value: 'full-time' },
	{ label: 'Part Time', value: 'part-time' },
]

const compensationOptions = [
	{ label: 'Performance Incentive', value: 'performance-incentive' },
	{ label: 'Sales Target Incentive', value: 'sales-target-incentive' },
	{ label: 'Objective Incentive', value: 'objective-incentive' },
]

const accessibilityOptions = [
	{ label: 'Screen reader support', value: 'screen-reader' },
	{ label: 'Keyboard navigation', value: 'keyboard-navigation' },
	{ label: 'High contrast', value: 'high-contrast' },
	{ label: 'Low contrast UI', value: 'low-contrast' },
	{ label: 'Captions / transcripts', value: 'captions' },
]

function validateAccessibilityRequirements() {
	const selected = formData.value.accessibility
	if (selected.includes('high-contrast') && selected.includes('low-contrast')) {
		return 'High contrast and low contrast UI cannot both be selected.'
	}
	return ''
}

const formData = ref(createDefaultFormData())

const emailError = computed(() => {
	const email = formData.value.email.trim()
	if (!email) {
		return 'Email is required.'
	}
	if (!EMAIL_PATTERN.test(email)) {
		return 'Enter a valid email address.'
	}
	return ''
})

const commentsError = computed(() => {
	const comments = formData.value.comments.trim()
	if (comments.length > 0 && comments.length < MIN_COMMENTS_LENGTH) {
		return `Comments must be at least ${MIN_COMMENTS_LENGTH} characters.`
	}
	return ''
})

const submitted = ref(false)

function handleSubmit(event) {
	if (!event.target.reportValidity()) {
		return
	}

	if (validateAccessibilityRequirements()) {
		return
	}

	submitted.value = true
	console.log('Form submitted:', formData.value)
	alert('Form submitted! Check the console and the form result below.')
}

function handleCancel() {
	// For demo purposes, just reset submitted state
	submitted.value = false
}

function resetForm() {
	formData.value = createDefaultFormData()
	submitted.value = false
}
</script>
