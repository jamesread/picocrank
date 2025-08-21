<template>
	<header>
		<div class = "image-and-title flex-row" id = "sidebar-button" @click = "emit('toggleSidebar')">
			<img src = "/logo.png" alt = "Logo" class = "logo" />
			<h1>PicoCrank</h1>

			<div class = "fg1" />

			<button id = "sidebar-toggler-button" aria-label = "Open sidebar navigation" aria-pressed = "false" aria-haspopup = "menu" class = "neutral">
				<HugeiconsIcon :icon = "Menu01Icon" width = "1em" height = "1em" />
			</button>
		</div>

		<Breadcrumbs v-if="breadcrumbs" />
		
		<div class = "fg1"></div>

		<div class = "user-info">
			<span v-if="username">{{ username }}</span>
		</div>
	</header>
</template>

<script setup>
	import { HugeiconsIcon } from "@hugeicons/vue";
	import { Menu01Icon } from "@hugeicons/core-free-icons";

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
	});
</script>

<style scoped>
button {
	color: #bbb;
}
</style>
