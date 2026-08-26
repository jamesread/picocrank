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
				<div class="nav-button-heading">
					<div class="nav-button-icon" :style="getIconStyle(link)">
						<HugeiconsIcon
							:icon="link.icon"
							:width="iconSize"
							:height="iconSize"
						/>
					</div>
					<div class="nav-button-label">{{ link.title }}</div>
				</div>
				<div v-if="link.description" class="nav-button-description">
					{{ link.description }}
				</div>
			</button>
		</div>
		<div v-if="filteredLinks.length === 0" class="navigation-grid-empty">
			<p>No navigation links available</p>
		</div>
	</div>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useRouter } from 'vue-router';
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
		default: '1.5em'
	},
	// Exclude separator and html items
	excludeNonButtons: {
		type: Boolean,
		default: true
	}
});

const router = useRouter();

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
.nav-button-heading {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	min-width: 0;
}

.navigation-grid.compact .nav-button-heading {
	gap: 0.4rem;
}

.nav-button-heading .nav-button-icon {
	align-items: center;
}

.nav-button-heading .nav-button-label {
	flex: 1;
	min-width: 0;
}
</style>
