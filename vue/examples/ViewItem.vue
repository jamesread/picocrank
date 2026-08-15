<template>
	<section class="with-header-and-content">
		<div class="section-header flex-row">
			<div class="fg1">
				<h2 :title="item.subtitle">{{ item.title }}</h2>
			</div>
			<div role="toolbar">
				<router-link :to="{ name: 'TableExample' }" class="button neutral">Back to table</router-link>
				<button type="button" class="good">Edit</button>
			</div>
		</div>

		<div class="section-content padding">
			<p>{{ item.summary }}</p>

			<dl>
				<dt>ID</dt>
				<dd>{{ id }}</dd>

				<dt>Name</dt>
				<dd>{{ item.name }}</dd>

				<dt>Status</dt>
				<dd>
					<span class="tag" :class="item.statusClass">{{ item.status }}</span>
				</dd>

				<dt>Role</dt>
				<dd>{{ item.role }}</dd>

				<dt>Location</dt>
				<dd>{{ item.location }}</dd>
			</dl>
		</div>

		<div class="section-subheader">
			<h3>Contact</h3>
		</div>

		<div class="section-content padding">
			<dl>
				<dt>Email</dt>
				<dd><a :href="`mailto:${item.email}`">{{ item.email }}</a></dd>

				<dt>Phone</dt>
				<dd>{{ item.phone }}</dd>

				<dt>Timezone</dt>
				<dd>{{ item.timezone }}</dd>
			</dl>
		</div>

		<div class="section-subheader">
			<h3>Details</h3>
		</div>

		<div class="section-content padding">
			<dl>
				<dt>Department</dt>
				<dd>{{ item.department }}</dd>

				<dt>Manager</dt>
				<dd>{{ item.manager }}</dd>

				<dt>Start date</dt>
				<dd>{{ item.startDate }}</dd>

				<dt>Last updated</dt>
				<dd>{{ item.lastUpdated }}</dd>
			</dl>
		</div>

		<div class="section-subheader">
			<h3>Recent activity</h3>
		</div>

		<div class="section-content padding">
			<ul>
				<li v-for="(entry, index) in item.activity" :key="index">
					<span class="subtle">{{ entry.when }}</span>
					— {{ entry.text }}
				</li>
			</ul>
		</div>
	</section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	id: {
		type: [String, Number],
		required: true,
	},
})

const itemsById = {
	1: {
		title: 'Acme deployment',
		subtitle: 'Production release #1842',
		summary: 'Read-only detail view for a single record, using Femtocrank definition lists and section subheaders.',
		name: 'Acme deployment',
		status: 'Active',
		statusClass: 'fg-good',
		role: 'Release',
		location: 'us-east-1',
		email: 'releases@example.com',
		phone: '+1 555 0100',
		timezone: 'UTC',
		department: 'Platform engineering',
		manager: 'Alex Morgan',
		startDate: '12 March 2026',
		lastUpdated: '9 July 2026, 09:14',
		activity: [
			{ when: '2 hours ago', text: 'Health check passed for all regions.' },
			{ when: 'Yesterday', text: 'Configuration reviewed by on-call engineer.' },
			{ when: '3 days ago', text: 'Deployed from build 1842.' },
		],
	},
	Alice: {
		title: 'Alice',
		subtitle: 'Senior analyst',
		summary: 'Example person record linked from the table example.',
		name: 'Alice',
		status: 'Active',
		statusClass: 'fg-good',
		role: 'Senior analyst',
		location: 'New York',
		email: 'alice@example.com',
		phone: '+1 555 0142',
		timezone: 'America/New_York',
		department: 'Operations',
		manager: 'Jordan Lee',
		startDate: '4 June 2022',
		lastUpdated: '8 July 2026, 16:30',
		activity: [
			{ when: 'Today', text: 'Approved quarterly forecast submission.' },
			{ when: '2 days ago', text: 'Updated territory assignment.' },
		],
	},
	Bob: {
		title: 'Bob',
		subtitle: 'Support specialist',
		summary: 'Example person record linked from the table example.',
		name: 'Bob',
		status: 'Away',
		statusClass: 'fg-warning',
		role: 'Support specialist',
		location: 'Los Angeles',
		email: 'bob@example.com',
		phone: '+1 555 0198',
		timezone: 'America/Los_Angeles',
		department: 'Customer success',
		manager: 'Sam Patel',
		startDate: '19 January 2024',
		lastUpdated: '5 July 2026, 11:02',
		activity: [
			{ when: '4 hours ago', text: 'Set status to away.' },
			{ when: 'Yesterday', text: 'Closed ticket #8821.' },
		],
	},
}

const item = computed(() => {
	const key = String(props.id)
	if (itemsById[key]) {
		return itemsById[key]
	}

	const label = key.charAt(0).toUpperCase() + key.slice(1)
	return {
		title: label,
		subtitle: `Record ${key}`,
		summary: 'Generic detail view for records opened from the table or navigation.',
		name: label,
		status: 'Unknown',
		statusClass: 'fg-note',
		role: '—',
		location: '—',
		email: `${key.toLowerCase()}@example.com`,
		phone: '—',
		timezone: 'UTC',
		department: '—',
		manager: '—',
		startDate: '—',
		lastUpdated: '—',
		activity: [{ when: '—', text: 'No activity recorded for this item.' }],
	}
})
</script>
