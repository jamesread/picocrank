<template>
	<Header username = "Guest" @toggleSidebar="toggleSidebar" title = "PicoCrank" :logoUrl="logoUrl" :sidebarEnabled="sidebarEnabled" :showBranding="brandingEnabled">
		<template #toolbar>
			<QuickSearch
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
</template>

<script setup>
	import { ref, onMounted, provide } from 'vue';
	import { useRouter } from 'vue-router';
	import { Pin02Icon, SecurityValidationIcon, EditIcon, ViewIcon, HomeIcon } from '@hugeicons/core-free-icons'

	import QuickSearch from './../components/QuickSearch.vue'
	import Navigation from './../components/Navigation.vue'
	import '../../styles.css'
	import logoUrl from '/logo.png';

	const quickSearchRef = ref(null)
	const router = useRouter();
	const sidebar = ref(null);
	const navigation = ref(null);
	const sidebarEnabled = ref(true);
	const brandingEnabled = ref(true);

	function toggleSidebar() {
		if (sidebar.value) {
			sidebar.value.toggle();
		}
	}

	function toggleSidebarEnabled() {
		sidebarEnabled.value = !sidebarEnabled.value;
	}

	function toggleBrandingEnabled() {
		brandingEnabled.value = !brandingEnabled.value;
	}

	// Provide sidebar state and toggle function for child components
	provide('sidebarEnabled', sidebarEnabled);
	provide('toggleSidebarEnabled', toggleSidebarEnabled);
	provide('brandingEnabled', brandingEnabled);
	provide('toggleBrandingEnabled', toggleBrandingEnabled);

	onMounted(() => {
		if (navigation.value) {
			navigation.value.addRouterLink('Welcome')
			navigation.value.addRouterLink('TableExample')
			navigation.value.addRouterLink('CalendarExample')
			navigation.value.addRouterLink('FormExample')
			navigation.value.addRouterLink('TabsExample')
			navigation.value.addSeparator('separator-1');
			navigation.value.addRouterLink('ViewItem', 'View Awesome Item', { params: { id: 1 } })
			navigation.value.addSeparator('separator-2');
			navigation.value.addCallback('Callback Example', helloWorld, { icon: Pin02Icon })
			navigation.value.addSeparator('separator-3');
			navigation.value.addHtml('<h2 style = "padding: 0.75em;">Authentication</h2>', { name: 'auth-heading' })
			navigation.value.addRouterLink('LoginExample')
			navigation.value.addSeparator('separator-4');
			navigation.value.addHtml('<h2 style = "padding: 0.75em;">User Control Panel</h2>', { name: 'user-panel-heading' })
			navigation.value.addRouterLink('UserControlPanel')
			navigation.value.addSeparator('separator-5');
			navigation.value.addHtml('<h2 style = "padding: 0.75em;">Administration</h2>', { name: 'admin-heading' })
			navigation.value.addRouterLink('Admin')
		}

		if (sidebar.value) {
			sidebar.value.open();
			sidebar.value.stick();
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
	});

	function helloWorld() {
		alert('Hello World')
	}

</script>
