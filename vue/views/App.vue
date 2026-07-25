<template>
	<Header username = "Guest" @toggleSidebar="toggleSidebar" @logoClick="goToIndex" title = "PicoCrank" :logoUrl="logoUrl" :sidebarEnabled="sidebarEnabled" :navigation="navigation" :topBarEnabled="topBarEnabled" :showBranding="brandingEnabled" :breadcrumbs="breadcrumbsEnabled" :themeToggleEnabled="true">
		<template #toolbar>
			<QuickSearch
				v-if="quickSearchEnabled"
				ref="quickSearchRef"
				placeholder="Search items..."
				:search-fields="['title', 'name']"
				:max-results="15"
			/>
		</template>
	</Header>

	<Navigation ref="navigation">
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
	import { ref, onMounted, provide } from 'vue';
	import { useRouter } from 'vue-router';
	import { Pin02Icon } from '@hugeicons/core-free-icons'

	import QuickSearch from './../components/QuickSearch.vue'
	import Navigation from './../components/Navigation.vue'
	import NotificationPopups from './../components/NotificationPopups.vue'
	import '../../styles.css'
	import '../composables/useTheme.js'
	import logoUrl from '/logo.png';

	const router = useRouter();
	const quickSearchRef = ref(null)
	const sidebar = ref(null);
	const navigation = ref(null);
	const sidebarEnabled = ref(true);
	const brandingEnabled = ref(true);
	const quickSearchEnabled = ref(true);
	const topBarEnabled = ref(false);
	const breadcrumbsEnabled = ref(false);

	function toggleSidebar() {
		if (sidebar.value) {
			sidebar.value.toggle();
		}
	}

	function goToIndex() {
		router.push({ name: 'Welcome' });
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

	function toggleTopBarEnabled() {
		topBarEnabled.value = !topBarEnabled.value;
	}

	function toggleBreadcrumbsEnabled() {
		breadcrumbsEnabled.value = !breadcrumbsEnabled.value;
	}

	// Provide sidebar, QuickSearch, TopBar, and breadcrumbs state and toggle functions for child components
	provide('sidebarEnabled', sidebarEnabled);
	provide('toggleSidebarEnabled', toggleSidebarEnabled);
	provide('brandingEnabled', brandingEnabled);
	provide('toggleBrandingEnabled', toggleBrandingEnabled);

	provide('quickSearchEnabled', quickSearchEnabled);
	provide('toggleQuickSearchEnabled', toggleQuickSearchEnabled);
	provide('topBarEnabled', topBarEnabled);
	provide('toggleTopBarEnabled', toggleTopBarEnabled);
	provide('breadcrumbsEnabled', breadcrumbsEnabled);
	provide('toggleBreadcrumbsEnabled', toggleBreadcrumbsEnabled);

	onMounted(() => {
		if (navigation.value) {
			navigation.value.addRouterLink('Welcome')

			navigation.value.addSection('Layouts', { name: 'nav-layouts' })
			navigation.value.addRouterLink('PageStructure', 'Page structure')
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

			navigation.value.addSection('Patterns', { name: 'nav-patterns' })
			navigation.value.addCallback('Callback example', helloWorld, { icon: Pin02Icon })
		}

		if (sidebar.value) {
			sidebar.value.open();
			sidebar.value.stick();
		}

		if (quickSearchRef.value) {
			quickSearchRef.value.addItem({
				id: 'hello-world',
				title: 'Hello World',
				name: 'hello-world',
				description: 'This is a test item',
				category: 'Actions',
				type: 'callback',
				callback: helloWorld
			})
		}
	});

	function helloWorld() {
		alert('Hello World')
	}

</script>
