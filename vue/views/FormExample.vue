<template>
	<Section 
		title="Form Example" 
		subtitle="A simple form demonstrating Femtocrank form layout"
	>
		<template #toolbar>
			<button @click="resetForm">Reset</button>
		</template>

		<FormLayout @submit.prevent="handleSubmit">
			<FormField label="Name" for="name">
				<input 
					id="name"
					v-model="formData.name" 
					type="text" 
					placeholder="Enter your name"
					required
				/>
			</FormField>

			<FormField label="Role" fake>
				<div class="radio-group">
					<label>
						<input 
							type="radio" 
							name="role"
							value="sales"
							v-model="formData.role"
						/>
						<span>Sales</span>
					</label>
					<label>
						<input 
							type="radio" 
							name="role"
							value="engineering"
							v-model="formData.role"
						/>
						<span>Engineering</span>
					</label>
					<label>
						<input 
							type="radio" 
							name="role"
							value="hr"
							v-model="formData.role"
						/>
						<span>HR</span>
					</label>
				</div>
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

			<FormField label="Email" for="email">
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

			<FormField label="Website" for="website">
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

			<FormField label="Newsletters" fake>
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

			<FormField label="Comments" for="comments">
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
import { ref } from 'vue'
import Section from '../components/Section.vue'
import FormLayout from '../components/FormLayout.vue'
import FormField from '../components/FormField.vue'

const formData = ref({
	name: '',
	role: '',
	salary: '0',
	email: '',
	isAdmin: false,
	website: '',
	favouriteFood: '',
	favouriteColour: '#dee3e7',
	favouriteNumber: 50,
	newsletter1: false,
	newsletter2: false,
	comments: '',
	readonlyText: 'This is a readonly textarea.',
	disabledText: 'This is a disabled textarea.',
	datetime: ''
})

const submitted = ref(false)

function handleSubmit() {
	submitted.value = true
	console.log('Form submitted:', formData.value)
	// In a real application, you would send this data to a server
	alert('Form submitted! Check the console and the form result below.')
}

function handleCancel() {
	// For demo purposes, just reset submitted state
	submitted.value = false
}

function resetForm() {
	formData.value = {
		name: '',
		role: '',
		salary: '0',
		email: '',
		isAdmin: false,
		website: '',
		favouriteFood: '',
		favouriteColour: '#dee3e7',
		favouriteNumber: 50,
		newsletter1: false,
		newsletter2: false,
		comments: '',
		readonlyText: 'This is a readonly textarea.',
		disabledText: 'This is a disabled textarea.',
		datetime: ''
	}
	submitted.value = false
}
</script>
