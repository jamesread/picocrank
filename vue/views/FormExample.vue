<template>
	<Section 
		title="Form Example" 
		subtitle="A simple form with various input types"
		>
		<template #toolbar>
			<button @click="resetForm">Reset</button>
		</template>

		<form @submit.prevent="handleSubmit">
			<div class="form-group">
				<label for="name">Name</label>
				<input 
					id="name"
					v-model="formData.name" 
					type="text" 
					placeholder="Enter your name"
					required
				/>
			</div>

			<div class="form-group">
				<label for="email">Email</label>
				<input 
					id="email"
					v-model="formData.email" 
					type="email" 
					placeholder="Enter your email"
					required
				/>
			</div>

			<div class="form-group">
				<label for="country">Country</label>
				<select id="country" v-model="formData.country" required>
					<option value="">Select a country</option>
					<option value="us">United States</option>
					<option value="uk">United Kingdom</option>
					<option value="ca">Canada</option>
					<option value="au">Australia</option>
					<option value="de">Germany</option>
					<option value="fr">France</option>
				</select>
			</div>

			<div class="form-group">
				<label for="message">Message</label>
				<textarea 
					id="message"
					v-model="formData.message" 
					placeholder="Enter your message"
					rows="4"
				></textarea>
			</div>

			<div class="form-group">
				<label>
					<input 
						type="checkbox" 
						v-model="formData.newsletter"
					/>
					Subscribe to newsletter
				</label>
			</div>

			<div class="form-group">
				<label>Preferred Contact Method</label>
				<div class="radio-group">
					<label>
						<input 
							type="radio" 
							v-model="formData.contactMethod" 
							value="email"
						/>
						Email
					</label>
					<label>
						<input 
							type="radio" 
							v-model="formData.contactMethod" 
							value="phone"
						/>
						Phone
					</label>
					<label>
						<input 
							type="radio" 
							v-model="formData.contactMethod" 
							value="mail"
						/>
						Mail
					</label>
				</div>
			</div>

			<div class="form-actions">
				<button type="submit">Submit</button>
				<button type="button" @click="resetForm">Clear</button>
			</div>
		</form>

		<div v-if="submitted" class="form-result">
			<h3>Form Submitted!</h3>
			<pre>{{ JSON.stringify(formData, null, 2) }}</pre>
		</div>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import Section from '../components/Section.vue'

const formData = ref({
	name: '',
	email: '',
	country: '',
	message: '',
	newsletter: false,
	contactMethod: 'email'
})

const submitted = ref(false)

function handleSubmit() {
	submitted.value = true
	console.log('Form submitted:', formData.value)
	// In a real application, you would send this data to a server
	alert('Form submitted! Check the console and the form result below.')
}

function resetForm() {
	formData.value = {
		name: '',
		email: '',
		country: '',
		message: '',
		newsletter: false,
		contactMethod: 'email'
	}
	submitted.value = false
}
</script>

<style scoped>
.form-group {
	margin-bottom: 1.5rem;
}

.form-group label {
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group select,
.form-group textarea {
	width: 100%;
	padding: 0.5rem;
	border: 1px solid #ccc;
	border-radius: 0.25rem;
	font-size: 1rem;
}

.form-group textarea {
	resize: vertical;
	font-family: inherit;
}

.form-group input[type="checkbox"],
.form-group input[type="radio"] {
	margin-right: 0.5rem;
}

.form-group label:has(input[type="checkbox"]) {
	display: flex;
	align-items: center;
	font-weight: normal;
}

.radio-group {
	display: flex;
	gap: 1.5rem;
	flex-wrap: wrap;
}

.radio-group label {
	display: flex;
	align-items: center;
	font-weight: normal;
}

.form-actions {
	display: flex;
	gap: 1rem;
	margin-top: 2rem;
}

.form-actions button {
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.25rem;
	font-size: 1rem;
	cursor: pointer;
}

.form-actions button[type="submit"] {
	background-color: #0366d6;
	color: white;
}

.form-actions button[type="submit"]:hover {
	background-color: #0256c2;
}

.form-actions button[type="button"] {
	background-color: #6c757d;
	color: white;
}

.form-actions button[type="button"]:hover {
	background-color: #5a6268;
}

.form-result {
	margin-top: 2rem;
	padding: 1rem;
	background-color: #f8f9fa;
	border-radius: 0.25rem;
	border: 1px solid #dee2e6;
}

.form-result h3 {
	margin-top: 0;
	margin-bottom: 1rem;
}

.form-result pre {
	margin: 0;
	padding: 1rem;
	background-color: white;
	border-radius: 0.25rem;
	overflow-x: auto;
}

@media (prefers-color-scheme: dark) {
	.form-group input[type="text"],
	.form-group input[type="email"],
	.form-group select,
	.form-group textarea {
		background-color: #333;
		border-color: #555;
		color: #fff;
	}

	.form-result {
		background-color: #2d2d2d;
		border-color: #444;
	}

	.form-result pre {
		background-color: #1a1a1a;
		color: #fff;
	}
}
</style>

