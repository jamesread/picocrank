<template>
	<Section 
		title="Admin Panel" 
		subtitle="Administrative interface for system management"
		padding
	>
		<div class="admin-content">
			<div class="admin-section">
				<h3>System Overview</h3>
				<p>Welcome to the administrative panel. This is a placeholder for administrative functionality.</p>

				<FormLayout @submit.prevent>
					<FormField
						label="Grid"
						component-has-label
						description="How many StatusCard columns to show."
					>
						<RadioGroup
							v-model="gridLayout"
							name="status-card-grid"
							variant="boolean"
							:options="gridLayoutOptions"
						/>
					</FormField>

					<FormField label="Content align" component-has-label>
						<RadioGroup
							v-model="cardAlign"
							name="status-card-align"
							variant="boolean"
							:options="alignOptions"
						/>
					</FormField>

					<FormField label="Bar labels" component-has-label>
						<RadioGroup
							v-model="showBarLabels"
							name="status-card-bar-labels"
							variant="boolean"
							:options="showHideOptions"
						/>
					</FormField>

					<FormField label="Compact" component-has-label>
						<RadioGroup
							v-model="cardCompact"
							name="status-card-compact"
							variant="boolean"
							:options="onOffOptions"
						/>
					</FormField>
				</FormLayout>
				
				<div :class="gridClass">
					<StatusCard
						v-for="card in overviewCards"
						:key="card.title"
						:karma="card.karma"
						:bar-label="showBarLabels ? card.barLabel : ''"
						:align="cardAlign"
						:compact="cardCompact"
						:to="card.to"
					>
						<h4>{{ card.title }}</h4>
						<span class="stat">{{ card.stat }}</span>
						<span class="subtle">{{ card.subtle }}</span>
					</StatusCard>
				</div>
			</div>
			
			<div class="admin-section">
				<h3>Recent Activity</h3>
				<ul>
					<li>
						<span class="subtle">2 minutes ago</span>
						— User "john.doe" logged in
					</li>
					<li>
						<span class="subtle">5 minutes ago</span>
						— New user account created
					</li>
					<li>
						<span class="subtle">12 minutes ago</span>
						— System backup completed
					</li>
					<li>
						<span class="subtle">1 hour ago</span>
						— Database maintenance performed
					</li>
					<li>
						<span class="subtle">2 hours ago</span>
						— User "admin" updated settings
					</li>
				</ul>
			</div>
			
			<div class="admin-section">
				<h3>Quick Actions</h3>
				<div role="toolbar">
					<button type="button">Create User</button>
					<button type="button">System Backup</button>
					<button type="button">View Logs</button>
					<button type="button">Settings</button>
				</div>
			</div>
		</div>
	</Section>
</template>

<script setup>
import { computed, ref } from 'vue'

const showBarLabels = ref(true)
const cardCompact = ref(false)
const cardAlign = ref('start')
const gridLayout = ref('3')

const showHideOptions = [
	{ label: 'Shown', value: true },
	{ label: 'Hidden', value: false },
]

const onOffOptions = [
	{ label: 'On', value: true },
	{ label: 'Off', value: false },
]

const alignOptions = [
	{ value: 'start', label: 'Start' },
	{ value: 'center', label: 'Center' },
]

const gridLayoutOptions = [
	{ value: '3', label: '3 columns' },
	{ value: '2', label: '2 columns' },
]

const gridClass = computed(() => (
	gridLayout.value === '2' ? 'grid-boxed-2' : 'grid-boxed'
))

const overviewCards = [
	{
		karma: 'good',
		barLabel: 'Users',
		title: 'Total Users',
		stat: '1,247',
		subtle: '+12% from last month',
		to: { name: 'UserDetails' },
	},
	{
		karma: 'bad',
		barLabel: 'Live',
		title: 'Active Sessions',
		stat: '89',
		subtle: '-3% from last hour',
		to: { name: 'TableExample' },
	},
	{
		karma: 'warning',
		barLabel: 'Load',
		title: 'System Load',
		stat: '67%',
		subtle: 'Moderate',
		to: { name: 'StatusExample' },
	},
	{
		karma: 'good',
		barLabel: 'Disk',
		title: 'Storage Used',
		stat: '2.4 GB',
		subtle: '45% of total',
		to: { name: 'ViewItem', params: { id: '1' } },
	},
]
</script>
