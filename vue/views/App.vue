<template>
	<Navigation ref="navigation">
		<Header username = "Guest" @toggleSidebar="toggleSidebar" @logoClick="goToIndex" @userClick="goToUserDetails" title = "PicoCrank" :logoUrl="logoUrl" :sidebarEnabled="sidebarEnabled" :navigation="navigation" :topBarEnabled="topBarEnabled" :showBranding="brandingEnabled" :breadcrumbs="breadcrumbsEnabled" :themeToggleEnabled="themeToggleEnabled">
			<template #toolbar>
				<QuickSearch
					v-if="quickSearchEnabled"
					ref="quickSearchRef"
					placeholder="Search items..."
					:search-fields="['title', 'name', 'description', 'category']"
					:max-results="15"
					:fetch-results="dummySearchFetchEnabled ? dummyFetchResults : null"
				/>
			</template>
		</Header>

		<div id = "layout">
			<Sidebar v-if="sidebarEnabled" ref = "sidebar" />

			<div id = "content">
				<main>
					<router-view />
				</main>

				<footer>
					<span><a href = "https://github.com/jamesread/picocrank">PicoCrank</a></span>
				</footer>
			</div>
		</div>
	</Navigation>

	<NotificationPopups />
</template>

<script setup>
	import { ref, onMounted, provide, watch } from 'vue';
	import { useRouter } from 'vue-router';
	import { Pin02Icon, UserIcon } from '@hugeicons/core-free-icons'

	import QuickSearch from './../components/QuickSearch.vue'
	import Navigation from './../components/Navigation.vue'
	import NotificationPopups from './../components/NotificationPopups.vue'
	import '../../styles.css'
	import '../composables/useTheme.js'
	import { initCustomTheme } from '../composables/useCustomTheme.js'
	import { examplePeople } from '../data/examplePeople.js'
	import logoUrl from '/logo.png';

	const router = useRouter();
	const quickSearchRef = ref(null)
	const sidebar = ref(null);
	const navigation = ref(null);
	const sidebarEnabled = ref(true);
	const brandingEnabled = ref(true);
	const quickSearchEnabled = ref(true);
	const dummySearchFetchEnabled = ref(false);
	const themeToggleEnabled = ref(true);
	const topBarEnabled = ref(false);
	const breadcrumbsEnabled = ref(false);

	const { discoverThemes } = initCustomTheme();

	function toggleSidebar() {
		if (sidebar.value) {
			sidebar.value.toggle();
		}
	}

	function goToIndex() {
		router.push({ name: 'Welcome' });
	}

	function goToUserDetails() {
		router.push({ name: 'UserDetails' });
	}

	function toggleSidebarEnabled() {
		sidebarEnabled.value = !sidebarEnabled.value;
	}

	function toggleBrandingEnabled() {
		brandingEnabled.value = !brandingEnabled.value;
	}

	function toggleQuickSearchEnabled() {
		quickSearchEnabled.value = !quickSearchEnabled.value;
	}

	function toggleDummySearchFetchEnabled() {
		dummySearchFetchEnabled.value = !dummySearchFetchEnabled.value;
	}

	function toggleThemeToggleEnabled() {
		themeToggleEnabled.value = !themeToggleEnabled.value;
	}

	function toggleTopBarEnabled() {
		topBarEnabled.value = !topBarEnabled.value;
	}

	function toggleBreadcrumbsEnabled() {
		breadcrumbsEnabled.value = !breadcrumbsEnabled.value;
	}

	async function dummyFetchResults(_query, { signal } = {}) {
		await new Promise((resolve, reject) => {
			const timer = setTimeout(resolve, 1500)
			if (!signal) {
				return
			}
			const onAbort = () => {
				clearTimeout(timer)
				reject(new DOMException('Aborted', 'AbortError'))
			}
			if (signal.aborted) {
				onAbort()
				return
			}
			signal.addEventListener('abort', onAbort, { once: true })
		})
		return []
	}

	function registerQuickSearchItems() {
		if (!quickSearchRef.value) {
			return
		}

		quickSearchRef.value.addItem({
			id: 'hello-world',
			title: 'Hello World',
			name: 'hello-world',
			description: 'This is a test item',
			category: 'Actions',
			type: 'callback',
			callback: helloWorld
		})

		for (const person of examplePeople) {
			quickSearchRef.value.addItem({
				id: `person-${person.name}`,
				title: person.name,
				name: person.name,
				description: `${person.city} · age ${person.age}`,
				category: 'People',
				type: 'route',
				path: `/view-item/${encodeURIComponent(person.name)}`,
				icon: UserIcon,
			})
		}
	}

	// Provide sidebar, QuickSearch, TopBar, and breadcrumbs state and toggle functions for child components
	provide('sidebarEnabled', sidebarEnabled);
	provide('toggleSidebarEnabled', toggleSidebarEnabled);
	provide('brandingEnabled', brandingEnabled);
	provide('toggleBrandingEnabled', toggleBrandingEnabled);

	provide('quickSearchEnabled', quickSearchEnabled);
	provide('toggleQuickSearchEnabled', toggleQuickSearchEnabled);
	provide('dummySearchFetchEnabled', dummySearchFetchEnabled);
	provide('toggleDummySearchFetchEnabled', toggleDummySearchFetchEnabled);
	provide('themeToggleEnabled', themeToggleEnabled);
	provide('toggleThemeToggleEnabled', toggleThemeToggleEnabled);
	provide('topBarEnabled', topBarEnabled);
	provide('toggleTopBarEnabled', toggleTopBarEnabled);
	provide('breadcrumbsEnabled', breadcrumbsEnabled);
	provide('toggleBreadcrumbsEnabled', toggleBreadcrumbsEnabled);

	watch(quickSearchRef, (quickSearch) => {
		if (quickSearch) {
			registerQuickSearchItems()
		}
	})

	onMounted(() => {
		discoverThemes()

		if (navigation.value) {
			navigation.value.addRouterLink('Welcome')

			navigation.value.addSection('Layouts', { name: 'nav-layouts' })
			navigation.value.addRouterLink('PageStructure', 'Page structure')
			navigation.value.addRouterLink('ThemePreview', 'Theme Switcher')
			navigation.value.addRouterLink('ViewItem', 'View item', { params: { id: 1 } })
			navigation.value.addRouterLink('NavigationGridExample', 'Navigation Grid')
			navigation.value.addRouterLink('Admin')
			navigation.value.addRouterLink('TabsExample', 'Tabs')

			navigation.value.addSection('Data display', { name: 'nav-data' })
			navigation.value.addRouterLink('TableExample', 'Table')
			navigation.value.addRouterLink('CalendarExample', 'Calendar')
			navigation.value.addRouterLink('ReadOnlyTextAreaExample', 'Read-only output')

			navigation.value.addSection('Forms & input', { name: 'nav-forms' })
			navigation.value.addRouterLink('ButtonsExample', 'Buttons')
			navigation.value.addRouterLink('FormExample', 'Forms')
			navigation.value.addRouterLink('LoginExample', 'Login')

			navigation.value.addSection('Feedback & status', { name: 'nav-feedback' })
			navigation.value.addRouterLink('StatusExample', 'Status & notifications')
			navigation.value.addRouterLink('DialogExample', 'Dialog')

			navigation.value.addSection('Patterns', { name: 'nav-patterns' })
			navigation.value.addCallback('Callback example', helloWorld, { icon: Pin02Icon })
		}

		if (sidebar.value) {
			sidebar.value.open();
			sidebar.value.stick();
		}

		registerQuickSearchItems()
	});

	function helloWorld() {
		alert('Hello World')
	}

</script>
