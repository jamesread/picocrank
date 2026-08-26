<template>
	<div
		class="tabs-container"
		:class="{
			'tabs-vertical': orientation === 'vertical',
			'tabs-flush': !padding,
		}"
	>
		<div class="tabs-header">
			<div
				class="tabs-header-scroll"
				role="tablist"
				:aria-orientation="orientation"
				:aria-labelledby="tablistLabelledBy || undefined"
				@keydown="onTabListKeydown"
			>
				<button
					v-for="(tab, index) in tabs"
					:key="getTabKey(tab, index)"
					:ref="(el) => setTabRef(getTabKey(tab, index), el)"
					:class="['tab-button', { active: isTabSelected(tab, index) }]"
					:aria-selected="isTabSelected(tab, index) ? 'true' : 'false'"
					:aria-controls="`tab-panel-${getTabKey(tab, index)}`"
					:id="`tab-${getTabKey(tab, index)}`"
					:tabindex="isTabFocused(tab, index) ? 0 : -1"
					role="tab"
					type="button"
					@click="onTabClick(getTabKey(tab, index))"
				>
					<HugeiconsIcon
						v-if="tab.icon"
						:icon="tab.icon"
						width="1em"
						height="1em"
						aria-hidden="true"
					/>
					<span>{{ tab.label }}</span>
					<slot :name="`tab-${getTabKey(tab, index)}-badge`" />
				</button>
			</div>
		</div>
		<div class="tabs-content">
			<div
				v-for="(tab, index) in tabs"
				:key="`panel-${getTabKey(tab, index)}`"
				:id="`tab-panel-${getTabKey(tab, index)}`"
				:class="['tab-panel', { active: isTabSelected(tab, index) }]"
				role="tabpanel"
				:aria-labelledby="`tab-${getTabKey(tab, index)}`"
				:hidden="!isTabSelected(tab, index)"
				:tabindex="isTabSelected(tab, index) ? 0 : -1"
			>
				<slot :name="`tab-${getTabKey(tab, index)}`" :tab="tab" />
			</div>
		</div>
	</div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'

const props = defineProps({
	tabs: {
		type: Array,
		required: true,
		validator: (tabs) => {
			return tabs.every(tab =>
				typeof tab === 'object'
				&& (tab.id !== undefined || true)
				&& typeof tab.label === 'string',
			)
		},
	},
	defaultTab: {
		type: [String, Number],
		default: null,
	},
	/** APG activation: `auto` selects on focus; `manual` requires Space/Enter. */
	activation: {
		type: String,
		default: 'auto',
		validator: (value) => ['auto', 'manual'].includes(value),
	},
	/** Optional id of an element that labels the tablist. */
	tablistLabelledBy: {
		type: String,
		default: '',
	},
	/** Tab strip layout: `horizontal` (default) or `vertical`. */
	orientation: {
		type: String,
		default: 'horizontal',
		validator: (value) => ['horizontal', 'vertical'].includes(value),
	},
	/** When true, panels use full inset padding; default false keeps dividers flush. */
	padding: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['tab-change'])

const tabRefs = new Map()

function getInitialTabId() {
	if (props.defaultTab !== null) {
		return props.defaultTab
	}
	if (props.tabs.length > 0) {
		return getTabKey(props.tabs[0], 0)
	}
	return null
}

const activeTabId = ref(getInitialTabId())
const focusedTabId = ref(getInitialTabId())

function getTabKey(tab, index) {
	return tab.id ?? index
}

function setTabRef(tabKey, el) {
	if (el) {
		tabRefs.set(tabKey, el)
		return
	}
	tabRefs.delete(tabKey)
}

function tabIndexForKey(tabKey) {
	return props.tabs.findIndex((tab, index) => getTabKey(tab, index) === tabKey)
}

function isTabSelected(tab, index) {
	return activeTabId.value === getTabKey(tab, index)
}

function isTabFocused(tab, index) {
	return focusedTabId.value === getTabKey(tab, index)
}

function focusTab(tabKey) {
	tabRefs.get(tabKey)?.focus()
}

function selectTab(tabKey, { emitChange = true } = {}) {
	if (activeTabId.value !== tabKey) {
		activeTabId.value = tabKey
		if (emitChange) {
			const index = tabIndexForKey(tabKey)
			const activeTab = index >= 0 ? props.tabs[index] : null
			emit('tab-change', activeTab, tabKey)
		}
	}
	focusedTabId.value = tabKey
}

function onTabClick(tabKey) {
	selectTab(tabKey)
}

function moveFocusToIndex(index, { activate = props.activation === 'auto' } = {}) {
	if (props.tabs.length === 0) {
		return
	}

	const normalized = (index + props.tabs.length) % props.tabs.length
	const tabKey = getTabKey(props.tabs[normalized], normalized)
	focusedTabId.value = tabKey

	if (activate) {
		selectTab(tabKey)
	}

	nextTick(() => focusTab(tabKey))
}

function tabKeyFromElement(tabEl) {
	const suffix = tabEl.id.slice('tab-'.length)
	const index = props.tabs.findIndex((tab, i) => String(getTabKey(tab, i)) === suffix)
	if (index >= 0) {
		return getTabKey(props.tabs[index], index)
	}
	return suffix
}

function onTabListKeydown(event) {
	const tabEl = event.target?.closest?.('[role="tab"]')
	if (!tabEl || !tabEl.id?.startsWith('tab-')) {
		return
	}

	const tabKey = tabKeyFromElement(tabEl)
	const index = tabIndexForKey(tabKey)
	if (index < 0) {
		return
	}

	const isVertical = props.orientation === 'vertical'

	switch (event.key) {
		case 'ArrowRight':
			if (!isVertical) {
				event.preventDefault()
				moveFocusToIndex(index + 1)
			}
			break
		case 'ArrowLeft':
			if (!isVertical) {
				event.preventDefault()
				moveFocusToIndex(index - 1)
			}
			break
		case 'ArrowDown':
			if (isVertical) {
				event.preventDefault()
				moveFocusToIndex(index + 1)
			}
			break
		case 'ArrowUp':
			if (isVertical) {
				event.preventDefault()
				moveFocusToIndex(index - 1)
			}
			break
		case 'Home':
			event.preventDefault()
			moveFocusToIndex(0)
			break
		case 'End':
			event.preventDefault()
			moveFocusToIndex(props.tabs.length - 1)
			break
		case ' ':
		case 'Enter':
			if (props.activation === 'manual') {
				event.preventDefault()
				selectTab(tabKey)
			}
			break
		default:
			break
	}
}

function setActiveTab(tabKey) {
	const index = tabIndexForKey(tabKey)
	if (index >= 0) {
		selectTab(tabKey)
		nextTick(() => focusTab(tabKey))
	}
}

function syncTabIdsAfterListChange() {
	if (props.tabs.length === 0) {
		activeTabId.value = null
		focusedTabId.value = null
		return
	}

	const activeStillExists = tabIndexForKey(activeTabId.value) >= 0
	if (!activeStillExists) {
		const firstKey = getTabKey(props.tabs[0], 0)
		activeTabId.value = firstKey
		focusedTabId.value = firstKey
		return
	}

	if (tabIndexForKey(focusedTabId.value) < 0) {
		focusedTabId.value = activeTabId.value
	}
}

onMounted(() => {
	syncTabIdsAfterListChange()
})

watch(() => props.tabs, () => {
	syncTabIdsAfterListChange()
}, { deep: true })

defineExpose({
	setActiveTab,
	activeTabId,
})
</script>

<style scoped>
.tabs-container {
	width: 100%;
}

.tabs-container.tabs-vertical {
	display: flex;
	align-items: stretch;
	gap: 0;
}

.tabs-header {
	border-bottom: 1px solid var(--tab-border);
}

.tabs-vertical .tabs-header {
	flex-shrink: 0;
	border-bottom: none;
	border-right: 1px solid var(--tab-border);
}

.tabs-header-scroll {
	display: flex;
	gap: 0.25rem;
	overflow-x: auto;
	scrollbar-width: thin;
}

.tabs-header-scroll::-webkit-scrollbar {
	height: 4px;
}

.tabs-header-scroll::-webkit-scrollbar-track {
	background: transparent;
}

.tabs-header-scroll::-webkit-scrollbar-thumb {
	background: var(--tab-border);
	border-radius: 2px;
}

.tabs-vertical .tabs-header-scroll {
	flex-direction: column;
	overflow-x: hidden;
	overflow-y: auto;
	min-width: 10rem;
	max-height: 24rem;
}

.tabs-vertical .tabs-header-scroll::-webkit-scrollbar {
	width: 4px;
	height: auto;
}

.tab-button {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	background: transparent;
	border: none;
	border-bottom: 1px solid transparent;
	border-radius: 0.4em 0.4em 0 0;
	cursor: pointer;
	font-size: 1em;
	color: var(--tab-fg);
	white-space: nowrap;
	position: relative;
}

.tab-button:hover:not(.active) {
	color: var(--tab-hover-fg);
	background-color: var(--tab-hover-bg);
}

.tab-button.active {
	background-color: var(--tab-active-bg);
	color: var(--tab-active-fg);
	border-bottom-color: transparent;
}

.tabs-vertical .tab-button {
	width: 100%;
	justify-content: flex-start;
	border-bottom: none;
	border-right: 1px solid transparent;
	border-radius: 0.4em 0 0 0.4em;
}

.tabs-vertical .tab-button.active {
	border-right-color: transparent;
}

.tabs-vertical .tabs-content {
	flex: 1;
	min-width: 0;
}

.tabs-flush .tab-panel {
	padding: 0;
	padding-top: 1.5rem;
}

.tabs-vertical.tabs-flush .tab-panel {
	padding-top: 0;
	padding-left: 0.75rem;
}

.tabs-vertical.tabs-flush .tabs-header {
	display: flex;
	flex-direction: column;
	align-self: stretch;
}

.tabs-vertical.tabs-flush .tabs-header-scroll {
	flex: 1;
	max-height: none;
}

.tabs-vertical.tabs-flush .tab-button {
	border-radius: 0;
}

.tab-button.active:hover,
.tab-button.active:focus-visible {
	background-color: var(--tab-active-hover-bg);
	color: var(--tab-active-fg);
}

.tab-button:focus {
	outline: none;
}

.tab-button:focus-visible {
	outline: none;
	box-shadow: inset 0 0 0 2px var(--focus-outline-color);
	z-index: 1;
}

.tab-button:hover:not(.active):focus-visible {
	color: var(--tab-hover-fg);
	background-color: var(--tab-hover-bg);
}

.tabs-content {
	width: 100%;
	min-height: 200px;
}

.tab-panel {
	padding-block: 1.5rem;
	padding-inline: 0.75rem;
}

.tab-panel:focus {
	outline: none;
}

.tab-panel:focus-visible {
	outline: 2px solid var(--focus-outline-color);
	outline-offset: 2px;
	border-radius: 0.4em;
}

.tab-panel[hidden] {
	display: none;
}

.tab-panel.active {
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

/* Responsive */
@media (max-width: 768px) {
	.tabs-header-scroll {
		gap: 0;
	}

	.tab-button {
		padding: 0.75rem 1rem;
		font-size: 0.9em;
	}

	.tab-panel {
		padding-block: 1rem;
		padding-inline: 0.5rem;
	}

	.tabs-flush .tab-panel {
		padding: 0;
		padding-top: 1rem;
	}

	.tabs-vertical.tabs-flush .tab-panel {
		padding-top: 0;
		padding-left: 0.5rem;
	}
}
</style>
