<template>
	<Header username = "Guest" @toggleSidebar="toggleSidebar" title = "PicoCrank" :logoUrl="logoUrl" :sidebarEnabled="sidebarEnabled">
		<template #toolbar>
			<QuickSearch
				ref="quickSearchRef"
				placeholder="Search items..."
				:search-fields="['title', 'name']"
				:max-results="15"
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
</template>

<script setup>
	import { ref, onMounted, provide } from 'vue';
	import { useRouter } from 'vue-router';
	import { Pin02Icon } from '@hugeicons/core-free-icons'

	import QuickSearch from './../components/QuickSearch.vue'
	import '../../styles.css'
	import logoUrl from '/logo.png';

	const quickSearchRef = ref(null)
	const router = useRouter();
	const sidebar = ref(null);
	const sidebarEnabled = ref(true);

	function toggleSidebar() {
		if (sidebar.value) {
			sidebar.value.toggle();
		}
	}

	function toggleSidebarEnabled() {
		sidebarEnabled.value = !sidebarEnabled.value;
	}

	// Provide sidebar state and toggle function for child components
	provide('sidebarEnabled', sidebarEnabled);
	provide('toggleSidebarEnabled', toggleSidebarEnabled);

	onMounted(() => {
		if (sidebar.value) {
			sidebar.value.addRouterLink('Welcome')
			sidebar.value.addRouterLink('TableExample')
			sidebar.value.addRouterLink('CalendarExample')
			sidebar.value.addSeparator('separator-1');
			sidebar.value.addRouterLink('ViewItem', 'View Awesome Item', { params: { id: 1 } })
			sidebar.value.addSeparator('separator-2');
			sidebar.value.addCallback('Callback Example', helloWorld, { icon: Pin02Icon })
			sidebar.value.addSeparator('separator-3');
			sidebar.value.addHtml('<h2 style = "padding: 0.75em;">Authentication</h2>', { name: 'auth-heading' })
			sidebar.value.addRouterLink('Login')
			sidebar.value.addSeparator('separator-4');
			sidebar.value.addHtml('<h2 style = "padding: 0.75em;">Administration</h2>', { name: 'admin-heading' })
			sidebar.value.addRouterLink('Admin')
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
