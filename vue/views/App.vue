<template>
	<Header username = "Guest" breadcrumbs />
		<div id = "layout">
			<Sidebar ref = "sidebar" />

			<div id = "content">
				<main>
					<router-view />
				</main>

				<footer>
					<span>PicoCrank</span>
				</footer>
			</div>
		</div>
</template>

<script setup>
	import { ref } from 'vue';
	import { onMounted } from 'vue';

	const sidebar = ref(null);

	onMounted(() => {
		sidebar.value.addNavigationLink({
		    id: 'welcome',
			title: "Welcome",
			path: "/",
		})
		sidebar.value.addNavigationLink({
		    id: 'table-example',
			title: "Table Example",
			path: "/table-example",
		})	

		sidebar.value.open();
		sidebar.value.stick();
	});

</script>
