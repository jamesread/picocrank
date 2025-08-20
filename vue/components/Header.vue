<template>
	<header>
		<div class = "image-and-title flex-row" id = "sidebar-button">
			<img src = "/logo.png" alt = "Logo" class = "logo" />
			<h1>PicoCrank</h1>
		</div>

		<Breadcrumbs v-if="breadcrumbs" />
		
		<div class = "fg1"></div>

		<div class = "user-info">
			<span v-if="username">{{ username }}</span>
		</div>
	</header>
</template>

<script setup>
	const props = defineProps({
		breadcrumbs: {
			type: Boolean,
			default: false,
		},
		username: {
			type: String,
			default: "",
		},
	});
</script>
