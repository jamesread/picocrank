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

			<button
				v-if="showSidebarChrome"
				id="sidebar-toggler-button"
				type="button"
				class="neutral"
				aria-expanded="false"
				aria-controls="picocrank-sidebar"
				aria-label="Open sidebar navigation"
				@click.stop="toggleNavSidebar"
			>
				<HugeiconsIcon :icon="Menu01Icon" width="1em" height="1em" :strokeWidth="3" aria-hidden="true" />
			</button>
		</div>

		<TopBar v-if="showTopBar" :navigation="navigation" />

		<Breadcrumbs v-if="breadcrumbs" />

		<div class = "fg1"></div>

		<div class="header-actions flex-row">
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

			<slot name="toolbar" />

			<slot name = "user-info">
				<button
					v-if="username"
					type="button"
					class="user-info flex-row neutral"
					:aria-label="`View profile for ${username}`"
					@click="emit('userClick')"
				>
					<HugeiconsIcon :icon="UserIcon" width="1em" height="1em" aria-hidden="true" />
					<span>{{ username }}</span>
				</button>
			</slot>
		</div>
	</header>

	<!-- Top-bar-only mobile: Header owns the fallback sidebar so consumers need no extra wiring. -->
	<Sidebar v-if="needsFallbackSidebar" ref="fallbackSidebar" :navigation="navigation" />
</template>

<script setup>
	import { computed, ref } from "vue";
	import { HugeiconsIcon } from "@hugeicons/vue";
	import { BulbIcon, Menu01Icon, Moon02Icon, Sun01Icon, UserIcon } from "@hugeicons/core-free-icons";

	import Breadcrumbs from "./Breadcrumbs.vue";
	import TopBar from "./TopBar.vue";
	import Sidebar from "./Sidebar.vue";
	import { useTheme } from '../composables/useTheme.js';
	import { useResponsiveNav } from '../composables/useResponsiveNav.js';

	const { theme, nextTheme, toggleTheme } = useTheme();

	const themeToggleMeta = {
		auto: {
			icon: BulbIcon,
			title: 'Auto',
		},
		light: {
			icon: Sun01Icon,
			title: 'Light',
		},
		dark: {
			icon: Moon02Icon,
			title: 'Dark',
		},
	};

	const themeToggleIcon = computed(() => themeToggleMeta[theme.value]?.icon ?? BulbIcon);
	const themeToggleTitle = computed(() => themeToggleMeta[theme.value]?.title ?? 'Auto');
	const themeToggleLabel = computed(() => {
		const current = themeToggleMeta[theme.value]?.title ?? 'Auto';
		const next = themeToggleMeta[nextTheme.value]?.title ?? 'Auto';
		return `Theme ${current.toLowerCase()}. Switch to ${next.toLowerCase()} mode`;
	});

	const emit = defineEmits(["toggleSidebar", "logoClick", "userClick"]);

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

.user-info {
	gap: 0.4rem;
	align-self: stretch;
	padding: 0 0.6em;
	border-radius: 0;
	font-weight: normal;
}

.user-info span {
	padding-right: 0;
	font-weight: normal;
}

.header-actions {
	align-self: stretch;
	gap: 0.25rem;
}

.theme-toggle {
	margin-right: 0;
}

/* Match Femtocrank header chrome (same idea as #sidebar-button:hover) */
.header-actions > button,
.header-actions :deep(button) {
	border: 0;
	border-radius: 0;
	color: var(--header-fg-color, var(--header-text-color, #fff));
	background-color: transparent;
	align-self: stretch;
	display: inline-flex;
	align-items: center;
	padding-top: 0;
	padding-bottom: 0;
	padding-left: 0.6em;
	padding-right: 0.6em;
}

.header-actions > button:hover,
.header-actions :deep(button:hover),
.user-info:hover {
	background-color: var(--header-hover-background-color);
	color: var(--header-hover-text-color);
}

/* Sidebar toggler keeps existing full-height chrome */
#sidebar-toggler-button {
	border: 0;
	border-radius: 0;
	color: var(--header-fg-color, var(--header-text-color, #fff));
	background-color: transparent;
	align-self: stretch;
	display: inline-flex;
	align-items: center;
	padding-top: 0;
	padding-bottom: 0;
}

#sidebar-toggler-button:hover {
	background-color: var(--header-hover-background-color);
	color: var(--header-hover-text-color);
}
</style>

<!--
  Unscoped descendant selector: the search trigger lives inside QuickSearch in the
  toolbar slot, so scoped / :slotted / :deep cannot fully restyle it alone.
-->
<style>
header .header-actions {
	gap: 0.25rem;
}

header .quick-search {
	align-self: stretch;
	display: inline-flex;
}

header .search-trigger,
header .search-trigger.neutral {
	border: 0;
	border-radius: 0;
	color: var(--header-fg-color, var(--header-text-color, #fff));
	background-color: transparent;
	align-self: stretch;
	height: 100%;
	display: inline-flex;
	align-items: center;
	padding-top: 0;
	padding-bottom: 0;
	padding-left: 0.6em;
	padding-right: 0.6em;
	margin-right: 0;
	font-weight: normal;
}

header .search-trigger:hover {
	background-color: var(--header-hover-background-color);
	color: var(--header-hover-text-color);
}

header .user-info {
	font-weight: normal;
}
</style>
