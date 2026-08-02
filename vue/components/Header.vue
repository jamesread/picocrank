<template>
	<header>
		<div
			:id = "showSidebarChrome ? 'sidebar-button' : null"
			:class="['image-and-title', 'flex-row', { 'disabled-branding': !showBranding, 'logo-home-link': !showSidebarChrome && showBranding }]"
			@click = "onImageAndTitleClick"
		>
			<img v-if="showBranding" :src = "logoUrl" alt = "Logo" class = "logo" />
			<h1 v-if="showBranding">{{ title }}</h1>

			<div class = "fg1" />

			<button v-if="showSidebarChrome" id = "sidebar-toggler-button" aria-label = "Open sidebar navigation" aria-pressed = "false" aria-haspopup = "menu" class = "neutral">
				<HugeiconsIcon :icon = "Menu01Icon" width = "1em" height = "1em" :strokeWidth = 3 />
			</button>
		</div>

		<TopBar v-if="showTopBar" :navigation="navigation" />

		<Breadcrumbs v-if="breadcrumbs" />

		<slot name="toolbar" />
		
		<div class = "fg1"></div>

		<button
			v-if="themeToggleEnabled"
			type="button"
			class="theme-toggle neutral"
			:aria-label="themeToggleLabel"
			:title="themeToggleTitle"
			@click="toggleTheme"
		>
			<HugeiconsIcon :icon="themeToggleIcon" width="1em" height="1em" />
		</button>

		<slot name = "user-info">
			<div class = "user-info">
				<span v-if="username">{{ username }}</span>
			</div>
		</slot>
	</header>

	<!-- Top-bar-only mobile: Header owns the fallback sidebar so consumers need no extra wiring. -->
	<Sidebar v-if="needsFallbackSidebar" ref="fallbackSidebar" :navigation="navigation" />
</template>

<script setup>
	import { computed, ref } from "vue";
	import { HugeiconsIcon } from "@hugeicons/vue";
	import { ComputerIcon, Menu01Icon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";

	import Breadcrumbs from "./Breadcrumbs.vue";
	import TopBar from "./TopBar.vue";
	import Sidebar from "./Sidebar.vue";
	import { useTheme } from '../composables/useTheme.js';
	import { useResponsiveNav } from '../composables/useResponsiveNav.js';

	const { theme, toggleTheme } = useTheme();

	const themeToggleMeta = {
		auto: {
			icon: ComputerIcon,
			title: 'Auto',
			label: 'Theme auto. Switch to light mode',
		},
		light: {
			icon: Sun01Icon,
			title: 'Light',
			label: 'Theme light. Switch to dark mode',
		},
		dark: {
			icon: Moon02Icon,
			title: 'Dark',
			label: 'Theme dark. Switch to auto mode',
		},
	};

	const themeToggleIcon = computed(() => themeToggleMeta[theme.value]?.icon ?? ComputerIcon);
	const themeToggleTitle = computed(() => themeToggleMeta[theme.value]?.title ?? 'Auto');
	const themeToggleLabel = computed(() => themeToggleMeta[theme.value]?.label ?? 'Theme auto. Switch to light mode');

	const emit = defineEmits(["toggleSidebar", "logoClick"]);

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

	const fallbackSidebar = ref(null);

	const { showTopBar, showSidebarChrome, needsFallbackSidebar } = useResponsiveNav(
		() => props.sidebarEnabled,
		() => props.topBarEnabled,
	);

	function toggleNavSidebar() {
		if (needsFallbackSidebar.value) {
			fallbackSidebar.value?.toggle();
			return;
		}
		emit("toggleSidebar");
	}

	function onImageAndTitleClick() {
		if (showSidebarChrome.value) {
			toggleNavSidebar();
		} else {
			emit("logoClick");
		}
	}
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
