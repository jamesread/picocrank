<template>
	<Section title="Navigation Grid" subtitle="Icon grid navigation for routes and actions">
		<p>
			<code>NavigationGrid</code> renders links from a nested
			<code>Navigation</code> provider as a grid of icon buttons. Use it for
			settings hubs, dashboards, or anywhere you need compact visual navigation.
		</p>

		<Navigation ref="localNavigation">
			<NavigationGrid />
		</Navigation>
	</Section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Section from '../components/Section.vue'
import NavigationGrid from '../components/NavigationGrid.vue'
import Navigation from '../components/Navigation.vue'
import {
	ViewIcon,
	EditIcon,
	SecurityValidationIcon,
	HomeIcon,
} from '@hugeicons/core-free-icons'

const localNavigation = ref(null)

onMounted(() => {
	if (!localNavigation.value) {
		return
	}

	localNavigation.value.addRouterLink('PageStructure', 'Page structure', {
		description: 'Configure the example app shell',
	})

	localNavigation.value.addCallback('Profile', () => {
		alert('Profile action')
	}, {
		icon: ViewIcon,
		name: 'profile',
		description: 'Example callback with icon and description',
	})

	localNavigation.value.addCallback('Editor', () => {
		alert('Editor action')
	}, {
		icon: EditIcon,
		name: 'editor',
		description: 'Opens an example editor workflow',
	})

	localNavigation.value.addCallback('Security', () => {
		alert('Security action')
	}, {
		icon: SecurityValidationIcon,
		name: 'security',
		description: 'Demonstrates a standard grid item',
	})

	localNavigation.value.addCallback('Preferences', () => {
		alert('Preferences action')
	}, {
		icon: HomeIcon,
		name: 'preferences',
		description: 'Another callback entry in the grid',
	})

	localNavigation.value.addCallback('Alerts', () => {
		alert('Alerts action')
	}, {
		icon: ViewIcon,
		name: 'alerts',
		description: 'Shows an indicator badge on the tile',
		iconColor: '#e67e22',
		indicator: true,
	})

	localNavigation.value.addCallback('Billing', () => {
		alert('This item is disabled')
	}, {
		icon: EditIcon,
		name: 'billing',
		description: 'Demonstrates a disabled grid item',
		disabled: true,
	})
})
</script>
