<template>
	<header>
		<div class = "image-and-title flex-row" :id = "sidebarEnabled ? 'sidebar-button' : null" @click = "sidebarEnabled && emit('toggleSidebar')">
			<img :src = "logoUrl" alt = "Logo" class = "logo" />
			<h1>{{ title }}</h1>

			<div class = "fg1" />

			<button v-if="sidebarEnabled" id = "sidebar-toggler-button" aria-label = "Open sidebar navigation" aria-pressed = "false" aria-haspopup = "menu" class = "neutral">
				<HugeiconsIcon :icon = "Menu01Icon" width = "1em" height = "1em" :strokeWidth = 3 />
			</button>
		</div>

		<TopBar v-if="topBarEnabled" :navigation="navigation" />

		<Breadcrumbs v-if="breadcrumbs" />

		<slot name="toolbar" />
		
		<div class = "fg1"></div>

		<slot name = "user-info">
			<div class = "user-info">
				<span v-if="username">{{ username }}</span>
			</div>
		</slot>
	</header>
</template>

<script setup>
	import { HugeiconsIcon } from "@hugeicons/vue";
	import { Menu01Icon } from "@hugeicons/core-free-icons";

	import Breadcrumbs from "./Breadcrumbs.vue";
	import TopBar from "./TopBar.vue";

	const emit = defineEmits(["toggleSidebar"]);

	const props = defineProps({
		breadcrumbs: {
			type: Boolean,
			default: false,
		},
		username: {
			type: String,
			default: "",
		},
		title: {
			type: String,
			default: "Untitled",
		},
		logoUrl: {
			type: String,
			default: "/logo.png",
		},
		sidebarEnabled: {
			type: Boolean,
			default: true,
		},
		topBarEnabled: {
			type: Boolean,
			default: false,
		},
		navigation: {
			type: Object,
			default: null,
		},
	});
</script>

<style scoped>
button {
	border: 0;
	color: #fff;
}

button:hover {
	background-color: transparent;
}

.user-info span {
	padding-right: 0.5rem;
}
</style>