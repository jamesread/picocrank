<template>
	<Section
		title="Page structure"
		subtitle="Configure the example application shell and layout"
	>
		<p>
			Use these controls to turn PicoCrank layout features on or off while you
			explore the other examples. Changes apply immediately across the app.
		</p>
	</Section>

	<Section title="Header" subtitle="Branding, search, and top navigation">
		<dl>
			<dt>Logo and title</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="brandingEnabled"
						@change="toggleBrandingEnabled"
					/>
					<span>Show logo and title in the header</span>
				</label>
			</dd>

			<dt>QuickSearch</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="quickSearchEnabled"
						@change="toggleQuickSearchEnabled"
					/>
					<span>Show QuickSearch in the header toolbar</span>
				</label>
				<p class="subtle">
					On narrow screens it collapses to a search button that opens search in an overlay.
				</p>
			</dd>

			<dt>Top bar</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="topBarEnabled"
						@change="toggleTopBarEnabled"
					/>
					<span>Show horizontal navigation links below the header</span>
				</label>
				<p class="subtle">
					On narrow screens: if both are on, the sidebar takes precedence and the top bar is hidden.
					If only the top bar is on, Header collapses it into a mobile sidebar automatically.
				</p>
			</dd>

			<dt>Breadcrumbs</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="breadcrumbsEnabled"
						@change="toggleBreadcrumbsEnabled"
					/>
					<span>Show route breadcrumbs in the header</span>
				</label>
			</dd>
		</dl>
	</Section>

	<Section title="Sidebar" subtitle="Primary navigation panel">
		<dl>
			<dt>Sidebar navigation</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="sidebarEnabled"
						@change="toggleSidebarEnabled"
					/>
					<span>Show the sidebar navigation panel</span>
				</label>
				<p class="subtle">
					When enabled, use the menu button in the header to open and pin the sidebar.
				</p>
			</dd>

			<dt>Example link states</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="exampleLinksEnabled"
						@change="toggleExampleLinks"
					/>
					<span>Add example links that demonstrate indicator, count, and disabled states</span>
				</label>
				<p class="subtle">
					Adds a “Link states” section to the sidebar with an attention indicator,
					a notification count badge, and a disabled item.
				</p>
			</dd>
		</dl>
	</Section>
</template>

<script setup>
import { inject, ref, onBeforeUnmount } from 'vue'
import Section from '../components/Section.vue'
import {
	Notification01Icon,
	Alert02Icon,
	UnavailableIcon,
} from '@hugeicons/core-free-icons'

const EXAMPLE_SECTION_ID = 'nav-link-states'
const EXAMPLE_LINK_NAMES = [
	EXAMPLE_SECTION_ID,
	'example-indicator',
	'example-count',
	'example-disabled',
]

const sidebarEnabled = inject('sidebarEnabled')
const toggleSidebarEnabled = inject('toggleSidebarEnabled')
const brandingEnabled = inject('brandingEnabled')
const toggleBrandingEnabled = inject('toggleBrandingEnabled')
const quickSearchEnabled = inject('quickSearchEnabled')
const toggleQuickSearchEnabled = inject('toggleQuickSearchEnabled')
const topBarEnabled = inject('topBarEnabled')
const toggleTopBarEnabled = inject('toggleTopBarEnabled')
const breadcrumbsEnabled = inject('breadcrumbsEnabled')
const toggleBreadcrumbsEnabled = inject('toggleBreadcrumbsEnabled')
const navigation = inject('navigation', null)

const exampleLinksEnabled = ref(false)

function removeExampleLinks() {
	if (!navigation) {
		return
	}
	for (const name of EXAMPLE_LINK_NAMES) {
		navigation.removeNavigationLink(name)
	}
}

function addExampleLinks() {
	if (!navigation) {
		return
	}

	removeExampleLinks()

	navigation.addSection('Link states', { name: EXAMPLE_SECTION_ID })

	navigation.addCallback('Needs attention', () => {
		alert('Example link with a notification indicator')
	}, {
		name: 'example-indicator',
		icon: Alert02Icon,
		indicator: true,
	})

	navigation.addCallback('Inbox', () => {
		alert('Example link with a notification count')
	}, {
		name: 'example-count',
		icon: Notification01Icon,
		count: 3,
	})

	navigation.addCallback('Unavailable', () => {
		alert('This should not run while disabled')
	}, {
		name: 'example-disabled',
		icon: UnavailableIcon,
		disabled: true,
	})
}

function toggleExampleLinks() {
	exampleLinksEnabled.value = !exampleLinksEnabled.value
	if (exampleLinksEnabled.value) {
		if (!sidebarEnabled.value) {
			toggleSidebarEnabled()
		}
		addExampleLinks()
	} else {
		removeExampleLinks()
	}
}

onBeforeUnmount(() => {
	if (exampleLinksEnabled.value) {
		removeExampleLinks()
	}
})
</script>

<style scoped>
.page-structure-control {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
}

.page-structure-control + .subtle {
	margin-top: 0.5rem;
}
</style>
