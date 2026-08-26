<template>
	<Section v-if="hub" :title="hub.title" :subtitle="hub.subtitle">
		<Navigation ref="localNavigation">
			<NavigationGrid />
		</Navigation>
	</Section>
	<Section
		v-else
		title="Unknown section"
		subtitle="This navigation hub is not configured."
	>
		<p class="subtle">
			Return to the welcome page and pick an example category from the top bar or sidebar.
		</p>
		<router-link :to="{ name: 'Welcome' }" class="button neutral">
			Back to welcome
		</router-link>
	</Section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Section from '../components/Section.vue'
import Navigation from '../components/Navigation.vue'
import NavigationGrid from '../components/NavigationGrid.vue'
import { navSectionHubs, registerHubNavigation } from '../data/navSectionHubs.js'

const route = useRoute()
const localNavigation = ref(null)
const hub = computed(() => navSectionHubs[route.name])

onMounted(() => {
	registerHubNavigation(localNavigation.value, route.name)
})
</script>
