<template>
	<Header />

	<div id = "layout">
		<Sidebar ref = "sidebar" />

		<main>
			<div id = "content">
				<router-view />

				<footer>
					<span>PicoCrank</span>
				</footer>
			</div>
		</main>
	</div>
</template>

<script setup>
	import { ref } from 'vue';
	import { onMounted } from 'vue';

	const sidebar = ref(null);

	onMounted(() => {
		sidebar.value.addNavigationLink({
			title: "Welcome",
			path: "/",
		})
		sidebar.value.open();
		sidebar.value.stick();
	});

</script>
