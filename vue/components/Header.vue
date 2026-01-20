<template>
	<header>
		<div
			:id = "sidebarEnabled ? 'sidebar-button' : null"
			:class="['image-and-title', 'flex-row', { 'disabled-branding': !showBranding }]"
			@click = "sidebarEnabled && emit('toggleSidebar')"
		>
			<img v-if="showBranding" :src = "logoUrl" alt = "Logo" class = "logo" />
			<h1 v-if="showBranding">{{ title }}</h1>

			<div class = "fg1" />

			<button v-if="sidebarEnabled" id = "sidebar-toggler-button" aria-label = "Open sidebar navigation" aria-pressed = "false" aria-haspopup = "menu" class = "neutral">
				<HugeiconsIcon :icon = "Menu01Icon" width = "1em" height = "1em" :strokeWidth = 3 />
			</button>
		</div>

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
		showBranding: {
			type: Boolean,
			default: true,
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

#sidebar-button.disabled-branding {
	width: auto;
}

.user-info span {
	padding-right: 0.5rem;
}
</style>