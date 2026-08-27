<template>
	<Section
		title="Horizontal Tabs"
		subtitle="A flexible tabbed control component with support for multiple tab panes and disabled tabs"
		:padding="horizontalTabsSectionPadding"
	>
		<template #toolbar>
			<label class="tabs-padding-toggle">
				<input v-model="horizontalTabsSectionPadding" type="checkbox" />
				Section padding
			</label>
			<label class="tabs-padding-toggle">
				<input v-model="horizontalTabsPadding" type="checkbox" />
				Tab padding
			</label>
			<label class="tabs-padding-toggle">
				<input v-model="detailsTabEnabled" type="checkbox" />
				Enable Details tab
			</label>
		</template>

		<Tabs
			:tabs="basicTabs"
			:padding="horizontalTabsPadding"
			@tab-change="onTabChange"
		>
			<template #tab-0>
				<div class="tab-content">
					<h4>Overview</h4>
					<p>
						This is the Overview tab. It contains general information about the current topic.
						You can place any content here, including forms, tables, images, or other components.
						The <strong>Details</strong> tab starts disabled — use the toolbar checkbox to
						enable it when elevated permissions are granted.
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
					<dl>
						<dt>Property 1</dt>
						<dd>Value 1</dd>

						<dt>Property 2</dt>
						<dd>Value 2</dd>

						<dt>Property 3</dt>
						<dd>Value 3</dd>

						<dt>Property 4</dt>
						<dd>Value 4</dd>
					</dl>
				</div>
			</template>
			<template #tab-2>
				<div class="tab-content">
					<h4>Settings</h4>
					<p>Configure your preferences and settings in this tab.</p>
					<FormLayout @submit.prevent="saveSettings">
						<FormField label="Setting 1" for="tabs-setting1">
							<input
								id="tabs-setting1"
								v-model="settings.setting1"
								type="text"
								placeholder="Enter value"
							/>
						</FormField>

						<FormField label="Setting 2" for="tabs-setting2">
							<select id="tabs-setting2" v-model="settings.setting2">
								<option value="option1">Option 1</option>
								<option value="option2">Option 2</option>
								<option value="option3">Option 3</option>
							</select>
						</FormField>

						<FormField label="Enable feature" for="tabs-setting-enabled">
							<input
								id="tabs-setting-enabled"
								v-model="settings.enabled"
								type="checkbox"
							/>
						</FormField>

						<template #actions>
							<button type="submit" class="good">Save Settings</button>
						</template>
					</FormLayout>
				</div>
			</template>
		</Tabs>
	</Section>

	<Section
		title="Vertical Tabs"
		subtitle="Side tab strip with arrow-key navigation up and down; disabled tabs are skipped"
		:padding="verticalTabsSectionPadding"
	>
		<template #toolbar>
			<label class="tabs-padding-toggle">
				<input v-model="verticalTabsSectionPadding" type="checkbox" />
				Section padding
			</label>
			<label class="tabs-padding-toggle">
				<input v-model="verticalTabsPadding" type="checkbox" />
				Tab padding
			</label>
			<label class="tabs-padding-toggle">
				<input v-model="advancedTabEnabled" type="checkbox" />
				Enable Advanced tab
			</label>
		</template>

		<Tabs
			:tabs="verticalTabs"
			orientation="vertical"
			:padding="verticalTabsPadding"
			@tab-change="onTabChange"
		>
			<template #tab-general>
				<div class="tab-content">
					<h4>General</h4>
					<p>
						Vertical tabs place the tab list beside the panel. Use them when labels are
						longer or when the layout mirrors a settings sidebar.
						<strong>Advanced</strong> starts disabled — use the toolbar checkbox to enable it.
					</p>
				</div>
			</template>
			<template #tab-appearance>
				<div class="tab-content">
					<h4>Appearance</h4>
					<p>Theme and display options would live in this pane.</p>
					<FormLayout>
						<FormField label="Theme" for="vertical-tab-theme">
							<select id="vertical-tab-theme">
								<option>System</option>
								<option>Light</option>
								<option>Dark</option>
							</select>
						</FormField>
					</FormLayout>
				</div>
			</template>
			<template #tab-notifications>
				<div class="tab-content">
					<h4>Notifications</h4>
					<p>Configure alerts and delivery preferences here.</p>
					<ul>
						<li>Email digests</li>
						<li>Push notifications</li>
						<li>In-app badges</li>
					</ul>
				</div>
			</template>
			<template #tab-advanced>
				<div class="tab-content">
					<h4>Advanced</h4>
					<p>Less common options grouped at the bottom of the strip.</p>
				</div>
			</template>
		</Tabs>
	</Section>

	<Section
		title="Dynamic Tabs"
		subtitle="Add and remove tab panes programmatically"
	>
		<template #toolbar>
			<button @click="addRandomTab" class="good">Add Tab</button>
			<button @click="removeLastTab" class="bad" :disabled="tabs.length <= 1">Remove Tab</button>
		</template>

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
	</Section>
</template>

<script setup>
import { computed, ref, reactive } from 'vue';
import { HomeIcon, Settings01Icon, UserIcon, ViewIcon } from '@hugeicons/core-free-icons';
import Section from '../components/Section.vue';
import Tabs from '../components/Tabs.vue';
import FormLayout from '../components/FormLayout.vue';
import FormField from '../components/FormField.vue';

const detailsTabEnabled = ref(false);
const advancedTabEnabled = ref(false);

const basicTabs = computed(() => [
	{ id: 0, label: 'Overview', icon: HomeIcon },
	{
		id: 1,
		label: 'Details',
		icon: ViewIcon,
		...(detailsTabEnabled.value
			? {}
			: {
				disabled: true,
				disabledTitle: 'Details requires elevated permissions',
			}),
	},
	{ id: 2, label: 'Settings', icon: Settings01Icon },
]);

const verticalTabs = computed(() => [
	{ id: 'general', label: 'General', icon: HomeIcon },
	{ id: 'appearance', label: 'Appearance', icon: Settings01Icon },
	{ id: 'notifications', label: 'Notifications', icon: UserIcon },
	{
		id: 'advanced',
		label: 'Advanced',
		icon: Settings01Icon,
		...(advancedTabEnabled.value
			? {}
			: {
				disabled: true,
				disabledTitle: 'Advanced settings are not available for this account',
			}),
	},
]);

const horizontalTabsSectionPadding = ref(true);
const horizontalTabsPadding = ref(false);
const verticalTabsSectionPadding = ref(true);
const verticalTabsPadding = ref(false);

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
.tabs-padding-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.4em;
	margin-right: 0.75em;
}

.tab-info {
	padding: 1rem;
	background-color: var(--standout-bg-color);
	border-radius: 0.4em;
}
</style>
