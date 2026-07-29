<template>
	<Section
		title="Notifications"
		subtitle="Block-level status messages using Femtocrank .notification with karma background classes"
	>
		<template #toolbar>
			<button type="button" @click="resetNotifications">Reset notifications</button>
			<button type="button" class="good" @click="showSampleNotification">Show sample</button>
		</template>

		<p>Click a notification to dismiss it.</p>

		<div
			v-for="notification in visibleNotifications"
			:key="notification.id"
			class="notification show"
			:class="notification.class"
			role="status"
			@click="dismissNotification(notification.id)"
		>
			<strong>{{ notification.label }}:</strong>
			{{ notification.message }}
		</div>

		<p v-if="visibleNotifications.length === 0" class="subtle">
			All notifications dismissed. Use the toolbar to restore them.
		</p>
	</Section>

	<Section
		title="Inline notifications"
		subtitle="Status embedded in content flow using .inline-notification with karma foreground or background classes"
	>
		<p class="fg-info show inline-notification">
			<strong>INFO:</strong>
			This is an informational message.
		</p>

		<p class="fg-note show inline-notification">
			<strong>NOTE:</strong>
			This is a note.
		</p>

		<p class="fg-success show inline-notification">
			<strong>SUCCESS:</strong>
			This is a success message.
		</p>

		<p class="fg-important show inline-notification">
			<strong>IMPORTANT:</strong>
			This is an important message.
		</p>

		<p class="fg-warning show inline-notification">
			<strong>WARNING:</strong>
			This is a warning message.
		</p>

		<p class="fg-severe show inline-notification">
			<strong>SEVERE:</strong>
			This is a severe message.
		</p>

		<p class="critical show inline-notification">
			<strong>CRITICAL:</strong>
			This is a critical message using a background karma class.
		</p>
	</Section>

	<Section
		title="Notification popups"
		subtitle="Transient corner toasts via useNotificationPopups()"
	>
		<template #toolbar>
			<button type="button" class="good" @click="showSuccessPopup">Success</button>
			<button type="button" class="warning" @click="showWarningPopup">Warning</button>
			<button type="button" @click="showLinkedPopup">With link</button>
			<button type="button" @click="showStackedPopups">Stack three</button>
			<button type="button" class="bad" @click="dismissAllPopups">Dismiss all</button>
		</template>

		<p>
			Popups stack in the bottom-right, fade away after 5 seconds, and can be dismissed
			manually or link to another page.
		</p>
	</Section>

	<Section
		title="In context"
		subtitle="Inline notifications beside or below form fields"
	>
		<FormLayout class="status-form" @submit.prevent="submitForm">
			<FormField label="Email" for="status-email">
				<input
					id="status-email"
					v-model="formEmail"
					type="email"
					placeholder="you@example.com"
					required
				/>
			</FormField>

			<p
				v-if="formMessage"
				class="show inline-notification"
				:class="formMessageClass"
				role="status"
			>
				<strong>{{ formMessageLabel }}:</strong>
				{{ formMessage }}
			</p>

			<template #actions>
				<button type="submit" class="good">Save</button>
				<button type="button" @click="clearForm">Clear</button>
			</template>
		</FormLayout>
	</Section>
</template>

<script setup>
import { ref, computed } from 'vue'
import Section from '../components/Section.vue'
import FormLayout from '../components/FormLayout.vue'
import FormField from '../components/FormField.vue'
import { useNotificationPopups } from '../composables/useNotificationPopups.js'

const { show: showPopup, dismissAll: dismissAllPopups } = useNotificationPopups()

const blockNotifications = ref([
	{
		id: 'info',
		class: 'info',
		label: 'INFO',
		message: 'This is an informational message.',
	},
	{
		id: 'note',
		class: 'note',
		label: 'NOTE',
		message: 'This is a note.',
	},
	{
		id: 'success',
		class: 'success',
		label: 'SUCCESS',
		message: 'The operation completed successfully.',
	},
	{
		id: 'important',
		class: 'important',
		label: 'IMPORTANT',
		message: 'Please review this before continuing.',
	},
	{
		id: 'warning',
		class: 'warning',
		label: 'WARNING',
		message: 'This action may have side effects.',
	},
	{
		id: 'severe',
		class: 'severe',
		label: 'SEVERE',
		message: 'A severe problem was detected.',
	},
	{
		id: 'critical',
		class: 'critical',
		label: 'CRITICAL',
		message: 'Immediate attention is required.',
	},
])

const initialNotificationIds = blockNotifications.value.map((notification) => notification.id)

const visibleNotificationIds = ref([...initialNotificationIds])
const sampleCounter = ref(0)

const visibleNotifications = computed(() =>
	blockNotifications.value.filter((notification) => visibleNotificationIds.value.includes(notification.id))
)

const formEmail = ref('')
const formMessage = ref('')
const formMessageClass = ref('fg-note')
const formMessageLabel = ref('NOTE')

function dismissNotification(id) {
	visibleNotificationIds.value = visibleNotificationIds.value.filter((visibleId) => visibleId !== id)
}

function resetNotifications() {
	blockNotifications.value = blockNotifications.value.filter((notification) =>
		initialNotificationIds.includes(notification.id)
	)
	visibleNotificationIds.value = [...initialNotificationIds]
	sampleCounter.value = 0
}

function showSampleNotification() {
	sampleCounter.value += 1
	const sample = {
		id: `sample-${sampleCounter.value}`,
		class: 'info',
		label: 'INFO',
		message: `Sample notification #${sampleCounter.value}.`,
	}
	blockNotifications.value.push(sample)
	visibleNotificationIds.value = [...visibleNotificationIds.value, sample.id]
}

function submitForm() {
	if (!formEmail.value.trim()) {
		formMessageClass.value = 'fg-warning'
		formMessageLabel.value = 'WARNING'
		formMessage.value = 'Please enter an email address.'
		return
	}

	formMessageClass.value = 'fg-success'
	formMessageLabel.value = 'SUCCESS'
	formMessage.value = `Saved preferences for ${formEmail.value.trim()}.`
}

function clearForm() {
	formEmail.value = ''
	formMessage.value = ''
	formMessageClass.value = 'fg-note'
	formMessageLabel.value = 'NOTE'
}

function showSuccessPopup() {
	showPopup({
		label: 'SUCCESS',
		class: 'success',
		message: 'Your changes were saved.',
	})
}

function showWarningPopup() {
	showPopup({
		label: 'WARNING',
		class: 'warning',
		message: 'Disk space is running low.',
	})
}

function showLinkedPopup() {
	showPopup({
		label: 'INFO',
		class: 'info',
		message: 'A new table example is available.',
		linkTo: { name: 'TableExample' },
		linkLabel: 'Open table example',
	})
}

function showStackedPopups() {
	const items = [
		{ label: 'NOTE', class: 'note', message: 'First popup in the stack.' },
		{ label: 'INFO', class: 'info', message: 'Second popup in the stack.' },
		{ label: 'SUCCESS', class: 'success', message: 'Third popup in the stack.' },
	]

	for (const [index, item] of items.entries()) {
		window.setTimeout(() => showPopup(item), index * 250)
	}
}
</script>

<style scoped>
.status-form {
	max-width: 32rem;
}
</style>
