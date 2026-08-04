<template>
	<Section
		title="User details"
		subtitle="Signed-in account for this example app"
	>
		<p class="subtle">
			This is a minimal profile page used by the header username control.
		</p>

		<dl>
			<dt>Display name</dt>
			<dd>{{ user.displayName }}</dd>

			<dt>Username</dt>
			<dd>{{ user.username }}</dd>

			<dt>Email</dt>
			<dd><a :href="`mailto:${user.email}`">{{ user.email }}</a></dd>

			<dt>Role</dt>
			<dd>{{ user.role }}</dd>

			<dt>Status</dt>
			<dd><span class="tag good">{{ user.status }}</span></dd>
		</dl>
	</Section>
</template>

<script setup>
import Section from '../components/Section.vue'

const user = {
	displayName: 'Guest User',
	username: 'guest',
	email: 'guest@example.com',
	role: 'Viewer',
	status: 'Active',
}
</script>
