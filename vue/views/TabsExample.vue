<template>
	<Section title="Tabs Example" subtitle="A flexible tabbed control component with support for multiple tab panes">
		<template #toolbar>
			<button @click="addRandomTab" class="good">Add Tab</button>
			<button @click="removeLastTab" class="bad" :disabled="tabs.length <= 1">Remove Tab</button>
		</template>

		<div class="tabs-example-container">
			<h3>Basic Tabs</h3>
			<Tabs :tabs="basicTabs" @tab-change="onTabChange">
				<template #tab-0>
					<div class="tab-content">
						<h4>Overview</h4>
						<p>
							This is the Overview tab. It contains general information about the current topic.
							You can place any content here, including forms, tables, images, or other components.
						</p>
						<ul>
							<li>First item in the overview</li>
							<li>Second item with more details</li>
							<li>Third item explaining features</li>
						</ul>
					</div>
				</template>
				<template #tab-1>
					<div class="tab-content">
						<h4>Details</h4>
						<p>
							The Details tab provides in-depth information. This section can be used to display
								comprehensive data, specifications, or detailed descriptions.
						</p>
						<div class="details-grid">
							<div class="detail-item">
								<strong>Property 1:</strong> Value 1
							</div>
							<div class="detail-item">
								<strong>Property 2:</strong> Value 2
							</div>
							<div class="detail-item">
								<strong>Property 3:</strong> Value 3
							</div>
							<div class="detail-item">
								<strong>Property 4:</strong> Value 4
							</div>
						</div>
					</div>
				</template>
				<template #tab-2>
					<div class="tab-content">
						<h4>Settings</h4>
						<p>Configure your preferences and settings in this tab.</p>
						<form class="settings-form">
							<div class="form-group">
								<label for="setting1">Setting 1:</label>
								<input id="setting1" type="text" v-model="settings.setting1" placeholder="Enter value" />
							</div>
							<div class="form-group">
								<label for="setting2">Setting 2:</label>
								<select id="setting2" v-model="settings.setting2">
									<option value="option1">Option 1</option>
									<option value="option2">Option 2</option>
									<option value="option3">Option 3</option>
								</select>
							</div>
							<div class="form-group">
								<label>
									<input type="checkbox" v-model="settings.enabled" />
									Enable feature
								</label>
							</div>
							<button type="button" class="good" @click="saveSettings">Save Settings</button>
						</form>
					</div>
				</template>
			</Tabs>

			<h3>Dynamic Tabs</h3>
			<Tabs :tabs="tabs" :default-tab="0" @tab-change="onDynamicTabChange">
				<template v-for="(tab, index) in tabs" :key="tab.id" #[`tab-${index}`]>
					<div class="tab-content">
						<h4>{{ tab.label }}</h4>
						<p>{{ tab.content }}</p>
						<div class="tab-info">
							<p><strong>Tab ID:</strong> {{ tab.id }}</p>
							<p><strong>Created:</strong> {{ tab.created }}</p>
						</div>
					</div>
				</template>
			</Tabs>

			<h3>Tabs with Icons</h3>
			<Tabs :tabs="iconTabs" @tab-change="onTabChange">
				<template #tab-home>
					<div class="tab-content">
						<h4>Home</h4>
						<p>Welcome to the home section. This tab demonstrates the use of icons in tab labels.</p>
					</div>
				</template>
				<template #tab-profile>
					<div class="tab-content">
						<h4>Profile</h4>
						<p>View and edit your profile information here.</p>
						<div class="profile-card">
							<div class="profile-avatar">JD</div>
							<div class="profile-info">
								<h5>John Doe</h5>
								<p>john.doe@example.com</p>
							</div>
						</div>
					</div>
				</template>
				<template #tab-settings>
					<div class="tab-content">
						<h4>Settings</h4>
						<p>Manage your application settings and preferences.</p>
					</div>
				</template>
			</Tabs>
		</div>
	</Section>
</template>

<script setup>
import { ref, reactive } from 'vue';
import Section from '../components/Section.vue';
import Tabs from '../components/Tabs.vue';
// Icons are optional - set to null if not available
// You can import specific icons from @hugeicons/core-free-icons if available
// Example: import { HomeIcon, UserIcon, SettingsIcon } from '@hugeicons/core-free-icons';

const basicTabs = ref([
	{ id: 0, label: 'Overview' },
	{ id: 1, label: 'Details' },
	{ id: 2, label: 'Settings' }
]);

const iconTabs = ref([
	{ id: 'home', label: 'Home', icon: null }, // Add icon from @hugeicons/core-free-icons if available
	{ id: 'profile', label: 'Profile', icon: null }, // Add icon from @hugeicons/core-free-icons if available
	{ id: 'settings', label: 'Settings', icon: null } // Add icon from @hugeicons/core-free-icons if available
]);

const tabs = ref([
	{
		id: 0,
		label: 'Tab 1',
		content: 'This is the first dynamically created tab. You can add or remove tabs programmatically.',
		created: new Date().toLocaleTimeString()
	},
	{
		id: 1,
		label: 'Tab 2',
		content: 'This is the second tab. Notice how the tabs can be added and removed dynamically.',
		created: new Date().toLocaleTimeString()
	}
]);

const settings = reactive({
	setting1: '',
	setting2: 'option1',
	enabled: false
});

let tabCounter = 2;

function onTabChange(tab, tabId) {
	console.log('Tab changed:', tab, tabId);
}

function onDynamicTabChange(tab, tabId) {
	console.log('Dynamic tab changed:', tab, tabId);
}

function addRandomTab() {
	const tabNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
	const randomName = tabNames[Math.floor(Math.random() * tabNames.length)];
	
	tabs.value.push({
		id: tabCounter++,
		label: randomName,
		content: `This is the ${randomName} tab, dynamically added at ${new Date().toLocaleTimeString()}.`,
		created: new Date().toLocaleTimeString()
	});
}

function removeLastTab() {
	if (tabs.value.length > 1) {
		tabs.value.pop();
	}
}

function saveSettings() {
	alert('Settings saved! (This is just a demo)');
	console.log('Settings:', settings);
}
</script>

<style scoped>
.tabs-example-container {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.tabs-example-container h3 {
	margin: 0 0 1rem 0;
	font-size: 1.3em;
	font-weight: 600;
	border-bottom: 1px solid var(--border-color, #e1e5e9);
	padding-bottom: 0.5rem;
}

.tab-content {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.tab-content h4 {
	margin: 0 0 0.5rem 0;
	font-size: 1.2em;
	font-weight: 600;
}

.tab-content p {
	margin: 0;
	line-height: 1.6;
}

.tab-content ul {
	margin: 0.5rem 0;
	padding-left: 1.5rem;
}

.tab-content li {
	margin: 0.5rem 0;
}

.details-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
}

.detail-item {
	padding: 0.75rem;
	background-color: var(--hover-background-color, #f5f5f5);
	border-radius: 4px;
}

.settings-form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.form-group label {
	font-weight: 500;
}

.form-group input[type="text"],
.form-group select {
	padding: 0.5rem;
	border: 1px solid var(--border-color, #ccc);
	border-radius: 4px;
	font-size: 1em;
}

.form-group input[type="checkbox"] {
	margin-right: 0.5rem;
}

.tab-info {
	margin-top: 1rem;
	padding: 1rem;
	background-color: var(--hover-background-color, #f5f5f5);
	border-radius: 4px;
}

.tab-info p {
	margin: 0.5rem 0;
}

.profile-card {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	background-color: var(--hover-background-color, #f5f5f5);
	border-radius: 8px;
	margin-top: 1rem;
}

.profile-avatar {
	width: 60px;
	height: 60px;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-size: 1.5em;
	font-weight: bold;
}

.profile-info h5 {
	margin: 0 0 0.25rem 0;
	font-size: 1.1em;
}

.profile-info p {
	margin: 0;
	color: var(--text-muted, #666);
}

@media (prefers-color-scheme: dark) {
	.detail-item,
	.tab-info,
	.profile-card {
		background-color: var(--hover-background-color, #333);
	}

	.detail-item strong,
	.tab-info strong {
		color: var(--text-color, #fff);
	}
}
</style>
