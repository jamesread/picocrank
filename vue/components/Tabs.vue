<template>
	<div class="tabs-container">
		<div class="tabs-header" role="tablist">
			<button
				v-for="(tab, index) in tabs"
				:key="tab.id || index"
				:class="['tab-button', { active: activeTabId === (tab.id || index) }]"
				:aria-selected="activeTabId === (tab.id || index)"
				:aria-controls="`tab-panel-${tab.id || index}`"
				:id="`tab-${tab.id || index}`"
				role="tab"
				@click="selectTab(tab.id || index)"
			>
				<HugeiconsIcon
					v-if="tab.icon"
					:icon="tab.icon"
					width="1em"
					height="1em"
				/>
				<span>{{ tab.label }}</span>
				<slot :name="`tab-${tab.id || index}-badge`" />
			</button>
		</div>
		<div class="tabs-content">
			<div
				v-for="(tab, index) in tabs"
				:key="tab.id || index"
				:id="`tab-panel-${tab.id || index}`"
				:class="['tab-panel', { active: activeTabId === (tab.id || index) }]"
				role="tabpanel"
				:aria-labelledby="`tab-${tab.id || index}`"
				v-show="activeTabId === (tab.id || index)"
			>
				<slot :name="`tab-${tab.id || index}`" :tab="tab" />
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { HugeiconsIcon } from '@hugeicons/vue';

const props = defineProps({
	tabs: {
		type: Array,
		required: true,
		validator: (tabs) => {
			return tabs.every(tab => 
				typeof tab === 'object' && 
				(tab.id !== undefined || true) && 
				typeof tab.label === 'string'
			);
		}
	},
	defaultTab: {
		type: [String, Number],
		default: null
	}
});

const emit = defineEmits(['tab-change']);

// Initialize activeTabId with first tab by default
function getInitialTabId() {
	if (props.defaultTab !== null) {
		return props.defaultTab;
	}
	if (props.tabs.length > 0) {
		return props.tabs[0].id ?? 0;
	}
	return null;
}

const activeTabId = ref(getInitialTabId());

function selectTab(tabId) {
	if (activeTabId.value !== tabId) {
		activeTabId.value = tabId;
		const activeTab = props.tabs.find(tab => (tab.id ?? props.tabs.indexOf(tab)) === tabId);
		emit('tab-change', activeTab, tabId);
	}
}

function setActiveTab(tabId) {
	const tab = props.tabs.find(t => (t.id ?? props.tabs.indexOf(t)) === tabId);
	if (tab) {
		selectTab(tabId);
	}
}

// Initialize active tab on mount if not already set
onMounted(() => {
	if (activeTabId.value === null && props.tabs.length > 0) {
		activeTabId.value = props.tabs[0].id ?? 0;
	}
});

// Watch for tabs changes
watch(() => props.tabs, (newTabs) => {
	if (newTabs.length > 0 && activeTabId.value === null) {
		activeTabId.value = newTabs[0].id ?? 0;
	}
}, { immediate: true });

defineExpose({
	setActiveTab,
	activeTabId
});
</script>

<style scoped>
.tabs-container {
	width: 100%;
}

.tabs-header {
	display: flex;
	border-bottom: 2px solid var(--border-color, #e1e5e9);
	gap: 0.25rem;
	overflow-x: auto;
	scrollbar-width: thin;
}

.tabs-header::-webkit-scrollbar {
	height: 4px;
}

.tabs-header::-webkit-scrollbar-track {
	background: transparent;
}

.tabs-header::-webkit-scrollbar-thumb {
	background: var(--border-color, #ccc);
	border-radius: 2px;
}

.tab-button {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background: transparent;
	border: none;
	border-bottom: 2px solid transparent;
	cursor: pointer;
	font-size: 1em;
	color: var(--text-muted, #666);
	transition: all 0.2s ease;
	white-space: nowrap;
	position: relative;
}

.tab-button:hover {
	color: var(--text-color, #000);
	background-color: var(--hover-background-color, #f5f5f5);
}

.tab-button.active {
	color: var(--primary-color, #007bff);
	border-bottom-color: var(--primary-color, #007bff);
	font-weight: 500;
}

.tab-button:focus {
	outline: 2px solid var(--primary-color, #007bff);
	outline-offset: -2px;
	border-radius: 4px 4px 0 0;
}

.tabs-content {
	width: 100%;
	min-height: 200px;
}

.tab-panel {
	padding: 1.5rem;
	display: none;
}

.tab-panel.active {
	display: block;
	animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(4px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
	.tabs-header {
		border-bottom-color: var(--border-color, #444);
	}

	.tab-button {
		color: var(--text-muted, #999);
	}

	.tab-button:hover {
		color: var(--text-color, #fff);
		background-color: var(--hover-background-color, #333);
	}

	.tab-button.active {
		color: var(--primary-color, #60a5fa);
		border-bottom-color: var(--primary-color, #60a5fa);
	}
}

/* Responsive */
@media (max-width: 768px) {
	.tabs-header {
		gap: 0;
	}

	.tab-button {
		padding: 0.75rem 1rem;
		font-size: 0.9em;
	}

	.tab-panel {
		padding: 1rem;
	}
}
</style>
