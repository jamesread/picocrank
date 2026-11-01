<template>
	<header ref="headerRoot" :class="{ fixed }">
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

		<Breadcrumbs v-if="showBreadcrumbsBar" />

		<TopBar v-if="showTopBar" :navigation="topBarNavigation" />

		<div class = "fg1"></div>

		<div ref="actionsRef" class="header-actions flex-row toolbar-overflow-host">
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

			<button
				v-if="toolbarCollapsed"
				ref="toolbarToggleRef"
				type="button"
				class="header-toolbar-toggle neutral"
				:aria-label="toolbarMenuLabel"
				:title="toolbarMenuLabel"
				:aria-expanded="toolbarMenuOpen ? 'true' : 'false'"
				:aria-controls="toolbarId"
				@click="toggleToolbarMenu"
				@keydown="onToolbarKeydown"
			>
				<HugeiconsIcon :icon="MoreVerticalIcon" width="1em" height="1em" aria-hidden="true" />
			</button>

			<div
				v-if="$slots.toolbar"
				:id="toolbarId"
				ref="toolbarRef"
				role="toolbar"
				class="header-toolbar"
				:class="{
					'toolbar-overflow-menu': toolbarCollapsed,
					'toolbar-overflow-menu-open': toolbarCollapsed && toolbarMenuOpen,
				}"
				:aria-label="toolbarCollapsed ? toolbarMenuLabel : undefined"
				:aria-orientation="toolbarCollapsed ? 'vertical' : undefined"
				@click="onToolbarClick"
				@keydown="onToolbarKeydown"
			>
				<slot name="toolbar" />
			</div>

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
				<RouterLink
					v-else-if="showLoginLink"
					:to="loginRoute"
					class="user-info flex-row neutral login-link"
				>
					<span>Login</span>
				</RouterLink>
			</slot>
		</div>
	</header>

	<!-- Top-bar-only mobile: Header owns the fallback sidebar so consumers need no extra wiring. -->
	<Sidebar v-if="needsFallbackSidebar" ref="fallbackSidebar" :navigation="navigation" />
</template>

<script setup>
	import { computed, nextTick, ref, useId, watch } from "vue";
	import { RouterLink } from "vue-router";
	import { HugeiconsIcon } from "@hugeicons/vue";
	import { BulbIcon, Menu01Icon, Moon02Icon, MoreVerticalIcon, Sun01Icon, UserIcon } from "@hugeicons/core-free-icons";

	import Breadcrumbs from "./Breadcrumbs.vue";
	import TopBar from "./TopBar.vue";
	import Sidebar from "./Sidebar.vue";
	import { useTheme } from '../composables/useTheme.js';
	import { useHeaderTopBarFit } from '../composables/useHeaderTopBarFit.js';
	import { useResponsiveNav } from '../composables/useResponsiveNav.js';
	import { measureNaturalWidth, useToolbarOverflow } from '../composables/useToolbarOverflow.js';

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
		loginRoute: {
			type: [String, Object],
			default: null,
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
		fixed: {
			type: Boolean,
			default: true,
		},
		navigation: {
			type: Object,
			default: null,
		},
		topBarNavigation: {
			type: Object,
			default: null,
		},
		/** Move the toolbar slot into a menu when the header has no room for it. */
		collapseToolbar: {
			type: Boolean,
			default: true,
		},
		/** Accessible name of the toolbar menu button (and of the menu). */
		toolbarMenuLabel: {
			type: String,
			default: "More actions",
		},
	});

	const fallbackSidebar = ref(null);
	const headerRoot = ref(null);
	const topBarSpaceLimited = ref(false);

	const { showTopBar, showSidebarChrome, needsFallbackSidebar, isMobile } = useResponsiveNav(
		() => props.sidebarEnabled,
		() => props.topBarEnabled,
		topBarSpaceLimited,
	);

	const topBarMeasureActive = computed(
		() => props.topBarEnabled && !isMobile.value,
	);

	const { remeasure: remeasureTopBar } = useHeaderTopBarFit(
		headerRoot,
		topBarMeasureActive,
		topBarSpaceLimited,
	);

	watch(showTopBar, () => nextTick(() => remeasureTopBar()));

	watch(
		() => props.topBarNavigation,
		() => remeasureTopBar(),
		{ deep: true },
	);

	const actionsRef = ref(null);
	const toolbarRef = ref(null);
	const toolbarToggleRef = ref(null);
	const toolbarId = `header-toolbar-${useId()}`;

	function px(value) {
		const number = Number.parseFloat(value);
		return Number.isFinite(number) ? number : 0;
	}

	/*
	 * Whether the header's fixed-size parts (branding, actions with the toolbar
	 * at its natural width) fit in one row. Breadcrumbs and the top bar are
	 * left out: they shrink or hide themselves when crowded.
	 */
	function toolbarFits() {
		const header = headerRoot.value;
		const actions = actionsRef.value;
		if (!header || !actions) return true;

		const headerStyle = getComputedStyle(header);
		let required = px(headerStyle.columnGap || headerStyle.gap) * Math.max(0, header.children.length - 1);
		for (const child of header.children) {
			if (child === actions || child.classList.contains("fg1")) continue;
			if (child.matches("nav.topbar, nav.breadcrumbs")) continue;
			required += child.getBoundingClientRect().width;
		}

		const actionsStyle = getComputedStyle(actions);
		let actionItems = 0;
		for (const child of actions.children) {
			if (child === toolbarToggleRef.value) continue;
			required += child === toolbarRef.value
				? measureNaturalWidth(child)
				: child.getBoundingClientRect().width;
			actionItems += 1;
		}
		required += px(actionsStyle.columnGap || actionsStyle.gap) * Math.max(0, actionItems - 1);

		const available = header.clientWidth - px(headerStyle.paddingLeft) - px(headerStyle.paddingRight);
		return required <= available;
	}

	const {
		collapsed: toolbarCollapsed,
		menuOpen: toolbarMenuOpen,
		scheduleUpdate: scheduleToolbarUpdate,
		toggleMenu: toggleToolbarMenu,
		onToolbarClick,
		onKeydown: onToolbarKeydown,
	} = useToolbarOverflow({
		rootRef: actionsRef,
		toolbarRef,
		toggleRef: toolbarToggleRef,
		fits: toolbarFits,
		enabled: () => props.collapseToolbar,
	});

	watch(
		() => [props.username, props.title, props.showBranding, props.themeToggleEnabled],
		() => nextTick(scheduleToolbarUpdate),
	);

	const showBreadcrumbsBar = computed(
		() => props.breadcrumbs && !isMobile.value,
	);

	const showLoginLink = computed(
		() => !props.username.trim() && props.loginRoute != null && props.loginRoute !== '',
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
#sidebar-button {
	flex-shrink: 0;
	width: 14em;
	min-width: 14em;
}

#sidebar-button.disabled-branding {
	width: auto;
	min-width: 0;
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

.login-link {
	text-decoration: none;
	color: inherit;
}

.user-info span {
	padding-right: 0;
	font-weight: normal;
}

/* Narrow screens: icon only (the button's aria-label still names the user). */
@media (max-width: 768px) {
	.user-info span {
		display: none;
	}
}

.header-actions {
	align-self: stretch;
	gap: 0.25rem;
	flex-shrink: 0;
}

.theme-toggle {
	margin-right: 0;
}

/* Inline toolbar: a row of header controls, full header height. */
.header-toolbar:not(.toolbar-overflow-menu) {
	display: flex;
	align-items: stretch;
	align-self: stretch;
	gap: 0.25rem;
	margin: 0;
}

/*
 * Collapsed toolbar: menu items, not header chrome. [role="toolbar"] keeps
 * these ahead of app styles aimed at header controls (e.g. "header
 * .header-actions select").
 */
.header-actions :deep([role="toolbar"].toolbar-overflow-menu button),
.header-actions :deep([role="toolbar"].toolbar-overflow-menu .button),
.header-actions :deep([role="toolbar"].toolbar-overflow-menu a) {
	align-self: auto;
	justify-content: flex-start;
	width: 100%;
	height: auto;
	padding: 0.5em var(--toolbar-overflow-item-padding-x, 0.75em);
	border: 0;
	border-radius: var(--menu-dropdown-radius, .4em);
	color: var(--text-color);
	background-color: transparent;
	text-align: left;
}

.header-actions :deep([role="toolbar"].toolbar-overflow-menu button:hover),
.header-actions :deep([role="toolbar"].toolbar-overflow-menu .button:hover),
.header-actions :deep([role="toolbar"].toolbar-overflow-menu a:hover) {
	background-color: var(--menu-dropdown-link-hover-background-color, var(--hover-background-color));
	color: var(--text-color);
}

.header-actions :deep([role="toolbar"].toolbar-overflow-menu select),
.header-actions :deep([role="toolbar"].toolbar-overflow-menu input) {
	width: 100%;
	height: auto;
	padding: 0.4em 0.6em;
	border: 1px solid var(--border-color);
	border-radius: var(--menu-dropdown-radius, .4em);
	color: var(--input-fg-color, var(--text-color));
	background-color: var(--input-bg-color, var(--section-bg-color));
}

/* No display here: it would undo display: contents on an app's wrapper element. */
.header-actions :deep([role="toolbar"].toolbar-overflow-menu > *) {
	align-self: stretch;
	height: auto;
}

/* Match Femtocrank header chrome (same idea as #sidebar-button:hover) */
.header-actions > button,
.header-actions > a.login-link,
.header-actions :deep(button) {
	border: 0;
	border-radius: 0;
	color: var(--header-fg-color);
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
.header-actions > a.login-link:hover,
.header-actions :deep(button:hover),
.user-info:hover {
	background-color: var(--header-hover-background-color);
	color: var(--header-hover-text-color);
}

/* Sidebar toggler keeps existing full-height chrome */
#sidebar-toggler-button {
	border: 0;
	border-radius: 0;
	color: var(--header-fg-color);
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
	color: var(--header-fg-color);
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

header .login-link {
	font-weight: normal;
}
</style>
