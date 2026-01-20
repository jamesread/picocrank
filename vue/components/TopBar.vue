<template>
	<nav class="topbar">
		<div class="topbar-links flex-row">
			<template v-for="link in navigationLinks" :key="link.name">
				<!-- Render separator as a divider -->
				<div v-if="link.type === 'separator'" class="separator"></div>
				<!-- Render callback link -->
				<a v-else-if="link.type === 'callback'" href="#" @click.prevent="handleLinkClick(() => link.callback())" class="button topbar-link">
					<HugeiconsIcon :icon="link.icon" width="1em" height="1em" />
					<span>{{ link.title }}</span>
				</a>
				<!-- Render HTML content -->
				<div v-else-if="link.type === 'html'" v-html="link.html" class="topbar-html"></div>
				<!-- Render router link -->
				<router-link v-else v-bind="link.props || {}" :to="link.to || link.path" :class="['button', 'topbar-link', { active: isActive(link) }]">
					<HugeiconsIcon :icon="link.icon" width="1em" height="1em" />
					<span>{{ link.title }}</span>
				</router-link>
			</template>
		</div>
	</nav>
</template>

<script setup>
import { computed, inject } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'

const props = defineProps({
	navigation: {
		type: Object,
		default: null
	}
})

// Try to get navigation from inject first, fall back to prop
const injectedNavigation = inject('navigation', null)

// Get navigation object - handle both component ref and direct object
const navigation = computed(() => {
	const nav = props.navigation || injectedNavigation
	if (!nav) return null
	
	// If it's a component ref, access its exposed API
	if (nav.value) {
		return nav.value
	}
	
	// Otherwise, assume it's the navigation object directly
	return nav
})

// Get navigation links and isActive function from navigation
// navigationLinks is a ref, so we return it directly (Vue will unwrap it in template)
const navigationLinks = computed(() => {
	const nav = navigation.value
	if (!nav || !nav.navigationLinks) {
		return []
	}
	// Return the ref itself - Vue will unwrap it in the template
	return nav.navigationLinks
})

// Get isActive function - create a function that accesses the navigation computed
function isActive(link) {
	const nav = navigation.value
	if (!nav || !nav.isActive) {
		return false
	}
	return nav.isActive(link)
}

function handleLinkClick(callback = null) {
	if (callback) {
		callback()
	}
}
</script>

<style scoped>
.topbar {
	width: 100%;
}

.topbar-links {
	display: flex;
	align-items: center;
	gap: 0.125rem;
	flex-wrap: wrap;
}

.topbar-link {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5em 0.75em;
	border-radius: 0.25em;
	text-decoration: none;
	color: inherit;
	transition: background-color 0.15s ease;
	white-space: nowrap;
	border: 0;
	font-weight: normal;
}

.topbar-link.active {
	text-decoration: underline;
	font-weight: 500;
}

.topbar-html {
	display: flex;
	align-items: center;
}

.separator {
	width: 1px;
	height: 1.5em;
	background-color: currentColor;
	opacity: 0.3;
	margin: 0 0.125rem;
}

@media (prefers-color-scheme: dark) {
	.topbar-link {
		color: #f8f9fa;
	}
	
	.separator {
		opacity: 0.5;
	}
}
</style>
