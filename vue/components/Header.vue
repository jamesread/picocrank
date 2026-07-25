<template>
	<header>
		<div
			:id = "sidebarEnabled ? 'sidebar-button' : null"
			:class="['image-and-title', 'flex-row', { 'disabled-branding': !showBranding, 'logo-home-link': !sidebarEnabled && showBranding }]"
			@click = "onImageAndTitleClick"
		>
			<img v-if="showBranding" :src = "logoUrl" alt = "Logo" class = "logo" />
			<h1 v-if="showBranding">{{ title }}</h1>

			<div class = "fg1" />

			<button v-if="sidebarEnabled" id = "sidebar-toggler-button" aria-label = "Open sidebar navigation" aria-pressed = "false" aria-haspopup = "menu" class = "neutral">
				<HugeiconsIcon :icon = "Menu01Icon" width = "1em" height = "1em" :strokeWidth = 3 />
			</button>
		</div>

		<TopBar v-if="topBarEnabled" :navigation="navigation" />

		<Breadcrumbs v-if="breadcrumbs" />

		<slot name="toolbar" />
		
		<div class = "fg1"></div>

		<button
			v-if="themeToggleEnabled"
			type="button"
			class="theme-toggle neutral"
			:aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
			:title="isDark ? 'Light mode' : 'Dark mode'"
			@click="toggleTheme"
		>
			<HugeiconsIcon :icon="isDark ? Sun01Icon : Moon02Icon" width="1em" height="1em" />
		</button>

		<slot name = "user-info">
			<div class = "user-info">
				<span v-if="username">{{ username }}</span>
			</div>
		</slot>
	</header>
</template>

<script setup>
	import { HugeiconsIcon } from "@hugeicons/vue";
	import { Menu01Icon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";

	import Breadcrumbs from "./Breadcrumbs.vue";
	import TopBar from "./TopBar.vue";
	import { useTheme } from '../composables/useTheme.js';

	const { isDark, toggleTheme } = useTheme();

	const emit = defineEmits(["toggleSidebar", "logoClick"]);

	function onImageAndTitleClick() {
		if (props.sidebarEnabled) {
			emit("toggleSidebar");
		} else {
			emit("logoClick");
		}
	}

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
		topBarEnabled: {
			type: Boolean,
			default: false,
		},
		themeToggleEnabled: {
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

#sidebar-button.disabled-branding {
	width: auto;
}

.logo-home-link {
	cursor: pointer;
}

.logo-home-link:hover {
	background-color: var(--header-hover-background-color);
	color: var(--header-hover-text-color);
}

.user-info span {
	padding-right: 0.5rem;
}

.theme-toggle {
	margin-right: 0.25rem;
}
</style>