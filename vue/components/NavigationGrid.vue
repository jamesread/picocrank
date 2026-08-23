<template>
	<div class="navigation-grid-container">
		<div class="navigation-grid" :class="{ 'compact': compact }">
			<button
				v-for="link in filteredLinks"
				:key="link.name"
				:class="['nav-button', { active: isLinkActive(link), disabled: link.disabled }]"
				:disabled="link.disabled"
				:title="link.title"
				@click="handleLinkClick(link)"
			>
				<span
					v-if="showCount(link)"
					class="nav-button-count"
					:aria-label="`${link.count} notifications`"
				>{{ formatCount(link.count) }}</span>
				<span
					v-else-if="showIndicator(link)"
					class="nav-button-indicator"
					aria-label="Requires attention"
				/>
				<div class="nav-button-icon" :style="getIconStyle(link)">
					<HugeiconsIcon
						:icon="link.icon"
						:width="iconSize"
						:height="iconSize"
					/>
				</div>
					<div class="nav-button-label">{{ link.title }}</div>
					<div v-if="link.description" class="nav-button-description">
						{{ link.description }}
					</div>
			</button>
		</div>
		<div v-if="filteredLinks.length === 0" class="no-links">
			<p>No navigation links available</p>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { HugeiconsIcon } from '@hugeicons/vue';

const props = defineProps({
	// Filter links by type: 'route', 'callback', or null for all
	filterType: {
		type: String,
		default: null,
		validator: (value) => value === null || ['route', 'callback'].includes(value)
	},
	// Custom filter function
	filter: {
		type: Function,
		default: null
	},
	// Compact mode (smaller buttons)
	compact: {
		type: Boolean,
		default: false
	},
	// Icon size
	iconSize: {
		type: String,
		default: '2em'
	},
	// Exclude separator and html items
	excludeNonButtons: {
		type: Boolean,
		default: true
	}
});

const router = useRouter();
const route = useRoute();

// Inject navigation from Navigation component
const navigation = inject('navigation', null);

// Get navigation links (it's a ref from the Navigation component)
const navigationLinks = navigation ? navigation.navigationLinks : ref([]);

// Get isActive function from navigation
const isActive = navigation ? navigation.isActive : (() => false);

// Filter links based on props
const filteredLinks = computed(() => {
	if (!navigationLinks.value || navigationLinks.value.length === 0) {
		return [];
	}

	let links = [...navigationLinks.value];

	// Exclude separators and HTML items by default
	if (props.excludeNonButtons) {
		links = links.filter(link => 
			link.type !== 'separator' && link.type !== 'html' && link.type !== 'section'
		);
	}

	// Filter by type if specified
	if (props.filterType) {
		links = links.filter(link => link.type === props.filterType);
	}

	// Apply custom filter if provided
	if (props.filter && typeof props.filter === 'function') {
		links = links.filter(props.filter);
	}

	return links;
});

function isLinkActive(link) {
	if (link.disabled) {
		return false;
	}
	return isActive(link);
}

function getIconStyle(link) {
	if (link.disabled || isLinkActive(link)) {
		return undefined;
	}
	if (link.iconColor) {
		return { color: link.iconColor };
	}
	return undefined;
}

function showCount(link) {
	return !link.disabled && link.count != null && link.count > 0;
}

function showIndicator(link) {
	return link.indicator && !link.disabled && !showCount(link);
}

function formatCount(count) {
	return count > 99 ? '99+' : String(count);
}

function handleLinkClick(link) {
	if (link.disabled) {
		return;
	}
	if (link.type === 'route') {
		const to = link.to || link.path;
		if (to) {
			router.push(to);
		}
	} else if (link.type === 'callback' && link.callback) {
		link.callback();
	}
}
</script>

<style scoped>
.navigation-grid-container {
	width: 100%;
}

.navigation-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1rem;
	padding: 1rem 0;
}

.navigation-grid.compact {
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 0.75rem;
}

.nav-button {
	display: flex;
	flex-direction: column;
	align-items: top;
	justify-content: flex-start;
	gap: 0.75rem;
	padding: 1.25rem 0.75rem;
	background: transparent;
	border: 1px solid var(--nav-grid-border);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;
	position: relative;
}

.navigation-grid.compact .nav-button {
	padding: 0.75rem 0.5rem;
	gap: 0.5rem;
}

.nav-button:hover {
	border-color: var(--nav-grid-accent-fg);
	background: var(--nav-grid-hover-bg);
	transform: translateY(-2px);
	box-shadow: 0 4px 8px var(--nav-grid-hover-shadow);
}

.nav-button:active {
	transform: translateY(0);
	box-shadow: 0 2px 4px var(--nav-grid-shadow);
}

.nav-button.active {
	background: var(--nav-grid-accent-bg);
	border-color: var(--nav-grid-accent-bg);
	color: var(--nav-grid-active-fg);
}

.nav-button.active .nav-button-icon {
	color: var(--nav-grid-active-fg);
}

.nav-button-icon {
	display: flex;
	align-items: start;
	justify-content: start;
	color: var(--nav-grid-accent-fg);
	transition: color 0.2s ease;
	flex-shrink: 0;
}

.nav-button.active .nav-button-icon {
	color: var(--nav-grid-active-fg);
}

.nav-button:disabled,
.nav-button.disabled {
	cursor: not-allowed;
	opacity: 0.6;
}

.nav-button:disabled:hover,
.nav-button.disabled:hover {
	border-color: var(--nav-grid-border);
	transform: none;
	box-shadow: none;
	background: transparent;
}

.nav-button:disabled .nav-button-icon,
.nav-button.disabled .nav-button-icon {
	color: var(--nav-grid-disabled-fg);
}

.nav-button-indicator {
	position: absolute;
	top: 0.75rem;
	right: 0.75rem;
	width: 0.625rem;
	height: 0.625rem;
	border-radius: 50%;
	background: var(--nav-grid-indicator-bg);
	box-shadow: 0 0 0 2px var(--nav-grid-ring-bg);
	flex-shrink: 0;
}

.nav-button-count {
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	min-width: 1.25rem;
	padding: 0.1rem 0.4rem;
	border-radius: 999px;
	background: var(--nav-grid-indicator-bg);
	color: var(--nav-grid-indicator-fg);
	font-size: 0.75em;
	font-weight: 600;
	line-height: 1.2;
	text-align: center;
	box-shadow: 0 0 0 2px var(--nav-grid-ring-bg);
	flex-shrink: 0;
}

.navigation-grid.compact .nav-button-indicator {
	top: 0.5rem;
	right: 0.5rem;
}

.navigation-grid.compact .nav-button-count {
	top: 0.35rem;
	right: 0.35rem;
}

.nav-button.active .nav-button-indicator,
.nav-button.active .nav-button-count {
	box-shadow: 0 0 0 2px var(--nav-grid-accent-bg);
}

.nav-button-label {
	font-weight: bold;
	font-size: 1.125rem;
	word-break: break-word;
	text-align: left;
	line-height: 1.2;
}

.nav-button.active .nav-button-label {
	color: var(--nav-grid-active-fg);
}

.nav-button-description {
	font-weight: normal;
	color: var(--nav-grid-muted-fg);
	word-break: break-word;
	text-align: left;
	line-height: 1.5;
}

.nav-button.active .nav-button-description {
	color: var(--nav-grid-active-fg);
}

.no-links {
	padding: 2rem;
	text-align: center;
	color: var(--nav-grid-muted-fg);
}

@media (max-width: 768px) {
	.navigation-grid {
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.nav-button {
		padding: 1rem 0.5rem;
	}
}
</style>
