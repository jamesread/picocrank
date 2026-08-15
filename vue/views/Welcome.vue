<template>
	<Section
		id="welcome"
		subtitle="Vue components on the Femtocrank theme"
		classes="welcome-hero-section"
	>
		<template #title>
			<div class="welcome-hero-title">
				<img :src="logoUrl" alt="" class="welcome-logo" />
				<span>Welcome to PicoCrank</span>
			</div>
		</template>

		<p class="welcome-lead">
			Build admin-style UIs quickly with ready-made Vue components and a minimal,
			accessible CSS theme. Browse examples by how you would use them in a real app.
		</p>

		<div role="toolbar" class="welcome-actions">
			<router-link :to="{ name: 'PageStructure' }" class="button good">
				Configure layout
			</router-link>
			<a href="#start-here" class="button neutral">Browse components</a>
			<a
				href="https://github.com/jamesread/picocrank"
				class="button neutral"
				target="_blank"
				rel="noopener noreferrer"
			>
				View on GitHub
			</a>
		</div>

		<p class="subtle">
			New here? Open <router-link :to="{ name: 'PageStructure' }">Page structure</router-link>
			to toggle the sidebar, header branding, QuickSearch, and more.
		</p>
	</Section>

	<Section
		id="start-here"
		title="Start here"
		subtitle="Jump into the example areas"
	>
		<Navigation ref="welcomeNavigation">
			<NavigationGrid />
		</Navigation>
	</Section>

	<Section
		title="Popular examples"
		subtitle="A few good places to begin"
	>
		<div class="grid-boxed welcome-popular-grid">
			<router-link
				v-for="example in popularExamples"
				:key="example.name"
				:to="{ name: example.name }"
				class="stat-display welcome-popular-card"
			>
				<span class="subtle">{{ example.category }}</span>
				<span class="stat">{{ example.label }}</span>
				<span class="welcome-popular-description">{{ example.description }}</span>
			</router-link>
		</div>
	</Section>

	<Section
		title="Try it"
		subtitle="Small interactions you can trigger right now"
	>
		<dl>
			<dt>Notification popup</dt>
			<dd>
				<button type="button" class="good" @click="showWelcomeToast">
					Show a toast
				</button>
				<p class="subtle">Corner notifications stack, auto-dismiss, and can link elsewhere.</p>
			</dd>

			<dt>Light and dark mode</dt>
			<dd>
				<p>
					Use the sun/moon button in the header to switch themes. Your preference is
					remembered across visits.
				</p>
			</dd>

			<dt>Femtocrank theme</dt>
			<dd>
				<p>
					PicoCrank is built on
					<a href="https://github.com/jamesread/femtocrank" target="_blank" rel="noopener noreferrer">Femtocrank</a>
					&mdash; zero-dependency CSS with high accessibility defaults.
				</p>
			</dd>
		</dl>
	</Section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Section from '../components/Section.vue'
import Navigation from '../components/Navigation.vue'
import NavigationGrid from '../components/NavigationGrid.vue'
import { useNotificationPopups } from '../composables/useNotificationPopups.js'
import logoUrl from '/logo.png'

const { show: showPopup } = useNotificationPopups()
const welcomeNavigation = ref(null)

const popularExamples = [
	{
		name: 'ThemePreview',
		category: 'Layouts',
		label: 'Theme Switcher',
		description: 'Switch drop-in themes live',
	},
	{
		name: 'TableExample',
		category: 'Data display',
		label: 'Table',
		description: 'Sorting, pagination, and column filters',
	},
	{
		name: 'CalendarExample',
		category: 'Data display',
		label: 'Calendar',
		description: 'Events, drag-and-drop, and date ranges',
	},
	{
		name: 'ButtonsExample',
		category: 'Forms & input',
		label: 'Buttons',
		description: 'Variants, toolbars, and form actions',
	},
]

function showWelcomeToast() {
	showPopup({
		label: 'WELCOME',
		class: 'success',
		message: 'Thanks for exploring PicoCrank!',
		linkTo: { name: 'TableExample' },
		linkLabel: 'Try the table example',
	})
}

onMounted(() => {
	if (!welcomeNavigation.value) {
		return
	}

	const nav = welcomeNavigation.value

	nav.addRouterLink('PageStructure', 'Page structure', {
		description: 'Sidebar, header, QuickSearch, and breadcrumbs',
	})
	nav.addRouterLink('ThemePreview', 'Theme Switcher', {
		description: 'Drop-in themes on Femtocrank',
	})
	nav.addRouterLink('TableExample', 'Table', {
		description: 'Lists with sorting, pagination, and filters',
	})
	nav.addRouterLink('TableRemoteExample', 'Remote table', {
		description: 'Server-style fetchRows pagination and filters',
	})
	nav.addRouterLink('CalendarExample', 'Calendar', {
		description: 'Month view with events',
	})
	nav.addRouterLink('ButtonsExample', 'Buttons', {
		description: 'Button variants and toolbars',
	})
	nav.addRouterLink('FormExample', 'Forms', {
		description: 'Labels, inputs, and fieldsets',
	})
	nav.addRouterLink('LoginExample', 'Login', {
		description: 'Auth form with OAuth tabs',
	})
	nav.addRouterLink('StatusExample', 'Status', {
		description: 'Notifications and inline status',
	})
	nav.addRouterLink('NavigationGridExample', 'Navigation grid', {
		description: 'Icon grid for settings hubs',
	})
	nav.addRouterLink('TabsExample', 'Tabs', {
		description: 'Tabbed content regions',
	})
})
</script>

<style scoped>
.welcome-hero-title {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.welcome-logo {
	width: 2.5rem;
	height: 2.5rem;
}

.welcome-lead {
	font-size: 1.05rem;
	max-width: 42rem;
}

.welcome-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-bottom: 0.75rem;
}

.welcome-popular-grid {
	grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.welcome-popular-card {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
	text-decoration: none;
	color: inherit;
	transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.welcome-popular-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.welcome-popular-description {
	font-size: 0.85rem;
	color: #666;
}

html[data-theme="dark"] .welcome-popular-description {
	color: #bbb;
}
</style>
