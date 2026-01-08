<template>
	<div class="navigation-grid-container">
		<div class="navigation-grid" :class="{ 'compact': compact }">
			<button
				v-for="link in filteredLinks"
				:key="link.name"
				:class="['nav-button', { active: isLinkActive(link) }]"
				:title="link.title"
				@click="handleLinkClick(link)"
			>
				<div class="nav-button-icon">
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
			link.type !== 'separator' && link.type !== 'html'
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
	return isActive(link);
}

function handleLinkClick(link) {
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
	border: 1px solid var(--border-color, #e1e5e9);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;
}

.navigation-grid.compact .nav-button {
	padding: 0.75rem 0.5rem;
	gap: 0.5rem;
}

.nav-button:hover {
	border-color: var(--primary-color, #007bff);
	transform: translateY(-2px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.nav-button:active {
	transform: translateY(0);
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-button.active {
	background: var(--primary-color, #007bff);
	border-color: var(--primary-color, #007bff);
	color: #fff;
}

.nav-button.active .nav-button-icon {
	color: #fff;
}

.nav-button-icon {
	display: flex;
	align-items: start;
	justify-content: start;
	color: var(--primary-color, #007bff);
	transition: color 0.2s ease;
	flex-shrink: 0;
}

.nav-button.active .nav-button-icon {
	color: #fff;
}

.nav-button-label {
	font-weight: bold;
	font-size: 1.125rem;
	word-break: break-word;
	text-align: left;
	line-height: 1.2;
}

.nav-button.active .nav-button-label {
	color: #fff;
}

.nav-button-description {
	font-weight: normal;
	color: var(--text-muted, #666);
	word-break: break-word;
	text-align: left;
	line-height: 1.5;
}

.nav-button.active .nav-button-description {
	color: rgba(255, 255, 255, 0.9);
}

.no-links {
	padding: 2rem;
	text-align: center;
	color: var(--text-muted, #666);
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
	.nav-button {
		background: transparent;
	}

	.nav-button:hover {
		background: var(--hover-background-color, rgba(96, 165, 250, 0.1));
		border-color: var(--primary-color, #60a5fa);
	}

	.nav-button.active {
		background: var(--primary-color, #60a5fa);
		border-color: var(--primary-color, #60a5fa);
	}

	.nav-button-description {
		color: var(--text-muted, #999);
	}

	.nav-button-icon {
		color: var(--primary-color, #60a5fa);
	}
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
