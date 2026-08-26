<template>
	<Section
		title="Notifications"
		subtitle="Block-level status messages using Femtocrank .notification-key and .notification-body"
	>
		<p>
			Each block uses a karma type class for the key tint
			(<code>.notification.info</code>, <code>.notification.warning</code>, …).
			Add <code>clickable</code> when the whole notification is interactive.
		</p>

		<FormLayout class="notification-builder" @submit.prevent="addBuiltNotification">
			<FormField label="Type" for="notification-type">
				<select id="notification-type" v-model="builder.type">
					<option
						v-for="option in notificationTypeOptions"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</option>
				</select>
			</FormField>

			<FormField label="Key label" for="notification-label">
				<input
					id="notification-label"
					v-model="builder.label"
					type="text"
					placeholder="Defaults from type, e.g. INFO:"
				/>
			</FormField>

			<FormField
				:label="builderFeatures.includes('link') ? 'Text before link' : 'Body message'"
				for="notification-message"
			>
				<textarea
					id="notification-message"
					v-model="builder.message"
					rows="2"
					placeholder="Notification body text"
					required
				/>
			</FormField>

			<CheckGroup
				v-model="builderFeatures"
				:options="builderFeatureOptions"
				name="notification-builder-features"
			/>

			<template v-if="builderFeatures.includes('link')">
				<FormField label="Link text" for="notification-link-label">
					<input
						id="notification-link-label"
						v-model="builder.linkLabel"
						type="text"
						placeholder="e.g. New version available"
					/>
				</FormField>

				<FormField label="Text after link" for="notification-link-suffix">
					<input
						id="notification-link-suffix"
						v-model="builder.messageSuffix"
						type="text"
						placeholder="e.g. — click to view release notes."
					/>
				</FormField>
			</template>

			<template #actions>
				<button type="submit" class="good">Add notification</button>
				<button type="button" @click="resetNotifications">Reset</button>
				<button type="button" class="bad" @click="clearNotifications">Clear all</button>
			</template>
		</FormLayout>

		<p v-if="dismissibleNotifications" class="subtle">
			Click a dismissible notification to remove it.
		</p>

		<NotificationBlock
			v-for="notification in notifications"
			:key="notification.id"
			v-bind="notificationProps(notification)"
			:dismissible="notification.dismissible"
			@dismiss="dismissNotification(notification.id)"
		/>
	</Section>

	<Section
		title="Inline karma"
		subtitle="Annotations and tags for inline status (Femtocrank 2.7)"
	>
		<p>
			Inline status no longer uses <code>.inline-notification</code>. Use
			<code>.annotation</code> key/value pairs or <code>.tag</code> chips with karma type classes.
		</p>

		<span class="annotation">
			<span class="annotation-key">fyi</span>
			<span class="annotation-val">This is an annotation.</span>
		</span>

		<span class="annotation note">
			<span class="annotation-key">scheduled</span>
			<span class="annotation-val">next release</span>
		</span>

		<span class="annotation good">
			<span class="annotation-key">status</span>
			<span class="annotation-val">active</span>
		</span>

		<br /><br />

		<span class="tag">Neutral tag</span>
		<span class="tag info">info</span>
		<span class="tag note">note</span>
		<span class="tag good">good/success</span>
		<span class="tag warning">warning</span>
		<span class="tag severe">severe</span>
		<span class="tag bad">bad/critical</span>
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
		subtitle="Block notifications beside form fields"
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

			<NotificationBlock
				v-if="formNotification"
				v-bind="formNotification"
			/>

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
import CheckGroup from '../components/CheckGroup.vue'
import NotificationBlock from '../components/NotificationBlock.vue'
import { useNotificationPopups } from '../composables/useNotificationPopups.js'

const { show: showPopup, dismissAll: dismissAllPopups } = useNotificationPopups()

const notificationTypeOptions = [
	{ value: 'info', label: 'Info' },
	{ value: 'note', label: 'Note' },
	{ value: 'success', label: 'Success' },
	{ value: 'warning', label: 'Warning' },
	{ value: 'severe', label: 'Severe' },
	{ value: 'critical', label: 'Critical' },
	{ value: 'old', label: 'Old' },
]

const builderFeatureOptions = [
	{ value: 'link', label: 'Include inline link in body' },
	{ value: 'clickable', label: 'Whole notification is clickable' },
	{ value: 'dismissible', label: 'Dismiss on click' },
]

const referenceNotifications = [
	{
		id: 'ref-info',
		type: 'info',
		linkLabel: 'New version available',
		linkHref: '#',
		messageSuffix: ' — click to view release notes.',
	},
	{
		id: 'ref-note',
		type: 'note',
		messagePrefix: 'See the ',
		linkLabel: 'release notes',
		linkHref: '#',
		messageSuffix: ' for what changed.',
	},
	{
		id: 'ref-success',
		type: 'success',
		message: 'This is a success message.',
	},
	{
		id: 'ref-warning',
		type: 'warning',
		messagePrefix: 'Disk usage is high — ',
		linkLabel: 'manage storage',
		linkHref: '#',
		messageSuffix: ' before continuing.',
	},
	{
		id: 'ref-severe',
		type: 'severe',
		messagePrefix: 'Service is degraded. Check the ',
		linkLabel: 'status page',
		linkHref: '#',
		messageSuffix: ' for updates.',
	},
	{
		id: 'ref-critical',
		type: 'critical',
		clickable: true,
		linkLabel: 'Database unreachable',
		linkHref: '#',
		messageSuffix: ' — follow the recovery runbook immediately.',
	},
]

let nextNotificationId = 1

const builder = ref({
	type: 'info',
	label: '',
	message: '',
	linkLabel: '',
	messageSuffix: '',
})

const builderFeatures = ref([])

const notifications = ref(referenceNotifications.map(cloneNotification))

const dismissibleNotifications = computed(() =>
	notifications.value.some((notification) => notification.dismissible)
)

const formEmail = ref('')
const formNotification = ref(null)

function cloneNotification(notification) {
	return { ...notification }
}

function notificationProps(notification) {
	return {
		type: notification.type,
		label: notification.label,
		message: notification.message,
		messagePrefix: notification.messagePrefix,
		linkLabel: notification.linkLabel,
		linkHref: notification.linkHref,
		linkTo: notification.linkTo,
		messageSuffix: notification.messageSuffix,
		clickable: notification.clickable,
	}
}

function createNotificationFromBuilder() {
	const includeLink = builderFeatures.value.includes('link')
	const id = `custom-${nextNotificationId++}`
	const trimmedMessage = builder.value.message.trim()

	return {
		id,
		type: builder.value.type,
		label: builder.value.label.trim(),
		message: includeLink ? '' : trimmedMessage,
		messagePrefix: includeLink ? trimmedMessage : '',
		linkLabel: includeLink ? builder.value.linkLabel.trim() : '',
		linkHref: includeLink ? '#' : '',
		messageSuffix: includeLink ? builder.value.messageSuffix : '',
		clickable: builderFeatures.value.includes('clickable'),
		dismissible: builderFeatures.value.includes('dismissible'),
	}
}

function addBuiltNotification() {
	notifications.value.push(createNotificationFromBuilder())
}

function resetNotifications() {
	notifications.value = referenceNotifications.map(cloneNotification)
	builder.value = {
		type: 'info',
		label: '',
		message: '',
		linkLabel: '',
		messageSuffix: '',
	}
	builderFeatures.value = []
	nextNotificationId = 1
}

function clearNotifications() {
	notifications.value = []
}

function dismissNotification(id) {
	notifications.value = notifications.value.filter((notification) => notification.id !== id)
}

function submitForm() {
	if (!formEmail.value.trim()) {
		formNotification.value = {
			type: 'warning',
			message: 'Please enter an email address.',
		}
		return
	}

	formNotification.value = {
		type: 'success',
		message: `Saved preferences for ${formEmail.value.trim()}.`,
	}
}

function clearForm() {
	formEmail.value = ''
	formNotification.value = null
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
.notification-builder,
.status-form {
	max-width: 36rem;
}
</style>
