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
		<FormLayout @submit.prevent>
			<FormField label="Logo and title" component-has-label>
				<RadioGroup
					name="ps-branding"
					variant="boolean"
					aria-label="Logo and title"
					:model-value="brandingEnabled"
					:options="showHideOptions"
					@update:model-value="setBrandingEnabled"
				/>
			</FormField>

			<FormField label="QuickSearch" component-has-label>
				<RadioGroup
					name="ps-quicksearch"
					variant="boolean"
					aria-label="QuickSearch"
					:model-value="quickSearchEnabled"
					:options="showHideOptions"
					@update:model-value="setQuickSearchEnabled"
				/>
			</FormField>

			<FormField label="Dummy background search" component-has-label :disabled="!quickSearchEnabled">
				<div>
					<RadioGroup
						name="ps-dummy-search"
						variant="boolean"
						aria-label="Dummy background search"
						:model-value="dummySearchFetchEnabled"
						:options="onOffOptions"
						:disabled="!quickSearchEnabled"
						@update:model-value="setDummySearchFetchEnabled"
					/>
					<p class="subtle">
						Turns on QuickSearch’s background-fetch loading UI. Local matches still
						appear immediately while the dummy request runs.
					</p>
				</div>
			</FormField>

			<FormField label="Dark/Light mode button" component-has-label>
				<RadioGroup
					name="ps-theme-toggle"
					variant="boolean"
					aria-label="Dark/Light mode button"
					:model-value="themeToggleEnabled"
					:options="showHideOptions"
					@update:model-value="setThemeToggleEnabled"
				/>
			</FormField>

			<FormField label="Theme switcher" component-has-label>
				<RadioGroup
					name="ps-theme-switcher"
					variant="boolean"
					aria-label="Theme switcher"
					:model-value="themeSwitcherEnabled"
					:options="showHideOptions"
					@update:model-value="setThemeSwitcherEnabled"
				/>
			</FormField>

			<FormField label="Top bar" component-has-label>
				<div>
					<RadioGroup
						name="ps-topbar"
						variant="boolean"
						aria-label="Top bar"
						:model-value="topBarEnabled"
						:options="showHideOptions"
						@update:model-value="setTopBarEnabled"
					/>
					<p class="subtle">
						When enabled, example categories appear in the header; each opens a hub page with a
						navigation grid of related examples. On narrow screens: if both sidebar and top bar are
						on, the sidebar takes precedence and the top bar is hidden. If only the top bar is on,
						Header collapses it into a mobile sidebar automatically.
					</p>
				</div>
			</FormField>

			<FormField label="Breadcrumbs" component-has-label>
				<RadioGroup
					name="ps-breadcrumbs"
					variant="boolean"
					aria-label="Breadcrumbs"
					:model-value="breadcrumbsEnabled"
					:options="showHideOptions"
					@update:model-value="setBreadcrumbsEnabled"
				/>
			</FormField>

			<FormField label="Header username" component-has-label>
				<div>
					<RadioGroup
						name="ps-header-username"
						variant="list"
						aria-label="Header username"
						:model-value="headerUsername"
						:options="headerUsernameOptions"
						@update:model-value="setHeaderUsernameValue"
					/>
					<p class="subtle">
						When no username is set, the header shows a Login link if
						<code>loginRoute</code> is configured.
					</p>
				</div>
			</FormField>
		</FormLayout>
	</Section>

	<Section title="Sidebar" subtitle="Primary navigation panel">
		<FormLayout @submit.prevent>
			<FormField label="Sidebar navigation" component-has-label>
				<div>
					<RadioGroup
						name="ps-sidebar"
						variant="boolean"
						aria-label="Sidebar navigation"
						:model-value="sidebarEnabled"
						:options="showHideOptions"
						@update:model-value="setSidebarEnabled"
					/>
					<p class="subtle">
						When enabled, use the menu button in the header to open and pin the sidebar. The sidebar
						lists every example directly — hub routes are for top-bar navigation only.
					</p>
				</div>
			</FormField>

			<FormField label="Example link states" component-has-label>
				<div>
					<RadioGroup
						name="ps-example-links"
						variant="boolean"
						aria-label="Example link states"
						:model-value="exampleLinksEnabled"
						:options="onOffOptions"
						@update:model-value="setExampleLinks"
					/>
					<p class="subtle">
						Adds a “Link states” section to the sidebar with an attention indicator,
						a notification count badge, and a disabled item.
					</p>
				</div>
			</FormField>
		</FormLayout>
	</Section>
</template>

<script setup>
import { inject, ref, onBeforeUnmount } from 'vue'
import Section from '../components/Section.vue'
import FormLayout from '../components/FormLayout.vue'
import FormField from '../components/FormField.vue'
import RadioGroup from '../components/RadioGroup.vue'
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

const showHideOptions = [
	{ label: 'Shown', value: true },
	{ label: 'Hidden', value: false },
]

const onOffOptions = [
	{ label: 'On', value: true },
	{ label: 'Off', value: false },
]

const headerUsernameOptions = [
	{ label: 'No username', value: '' },
	{ label: 'tester', value: 'tester' },
]

const sidebarEnabled = inject('sidebarEnabled')
const toggleSidebarEnabled = inject('toggleSidebarEnabled')
const brandingEnabled = inject('brandingEnabled')
const toggleBrandingEnabled = inject('toggleBrandingEnabled')
const quickSearchEnabled = inject('quickSearchEnabled')
const toggleQuickSearchEnabled = inject('toggleQuickSearchEnabled')
const dummySearchFetchEnabled = inject('dummySearchFetchEnabled')
const toggleDummySearchFetchEnabled = inject('toggleDummySearchFetchEnabled')
const themeToggleEnabled = inject('themeToggleEnabled')
const toggleThemeToggleEnabled = inject('toggleThemeToggleEnabled')
const themeSwitcherEnabled = inject('themeSwitcherEnabled')
const toggleThemeSwitcherEnabled = inject('toggleThemeSwitcherEnabled')
const topBarEnabled = inject('topBarEnabled')
const toggleTopBarEnabled = inject('toggleTopBarEnabled')
const breadcrumbsEnabled = inject('breadcrumbsEnabled')
const toggleBreadcrumbsEnabled = inject('toggleBreadcrumbsEnabled')
const headerUsername = inject('headerUsername')
const setHeaderUsername = inject('setHeaderUsername')
const navigation = inject('navigation', null)

const exampleLinksEnabled = ref(false)

function setFlag(flag, toggle, want) {
	if (flag.value !== want) {
		toggle()
	}
}

function setBrandingEnabled(want) {
	setFlag(brandingEnabled, toggleBrandingEnabled, want)
}

function setQuickSearchEnabled(want) {
	setFlag(quickSearchEnabled, toggleQuickSearchEnabled, want)
}

function setDummySearchFetchEnabled(want) {
	setFlag(dummySearchFetchEnabled, toggleDummySearchFetchEnabled, want)
}

function setThemeToggleEnabled(want) {
	setFlag(themeToggleEnabled, toggleThemeToggleEnabled, want)
}

function setThemeSwitcherEnabled(want) {
	setFlag(themeSwitcherEnabled, toggleThemeSwitcherEnabled, want)
}

function setTopBarEnabled(want) {
	setFlag(topBarEnabled, toggleTopBarEnabled, want)
}

function setBreadcrumbsEnabled(want) {
	setFlag(breadcrumbsEnabled, toggleBreadcrumbsEnabled, want)
}

function setHeaderUsernameValue(username) {
	setHeaderUsername(username)
}

function setSidebarEnabled(want) {
	setFlag(sidebarEnabled, toggleSidebarEnabled, want)
}

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

function setExampleLinks(want) {
	if (exampleLinksEnabled.value === want) {
		return
	}
	exampleLinksEnabled.value = want
	if (want) {
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
.subtle {
	margin-top: 0.5rem;
}
</style>
