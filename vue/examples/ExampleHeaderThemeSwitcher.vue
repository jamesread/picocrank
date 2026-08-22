<template>
	<ThemeSwitcher
		v-if="enabled"
		compact
		label=""
		:select-id="HEADER_THEME_SWITCHER_SELECT_ID"
		default-option-label="Default (Femtocrank only)"
		:include-supplemental-themes="includeSupplementalThemes"
	/>
</template>

<script setup>
import ThemeSwitcher, { HEADER_THEME_SWITCHER_SELECT_ID } from '../components/ThemeSwitcher.vue'

defineProps({
	enabled: {
		type: Boolean,
		default: true,
	},
	includeSupplementalThemes: {
		type: Boolean,
		default: true,
	},
})
</script>

<!-- Examples app only: match Header toolbar chrome (see Header search-trigger styles). -->
<style>
/*
 * Header renders theme toggle before the toolbar slot; use flex order to swap
 * the drop-in theme selector ahead of the light/dark button without changing Header.
 */
header .header-actions .theme-switcher--compact {
	order: 1;
	align-self: stretch;
	display: inline-flex;
	align-items: center;
	margin: 0;
}

header .header-actions .theme-toggle {
	order: 2;
}

header .header-actions .quick-search {
	order: 3;
}

header .header-actions .user-info {
	order: 4;
}

header .header-actions .theme-switcher--compact select {
	align-self: stretch;
	height: 100%;
	border: 0;
	border-radius: 0;
	background-color: transparent;
	color: var(--header-fg-color, var(--header-text-color, #fff));
	padding-top: 0;
	padding-bottom: 0;
	padding-left: 0.6em;
	padding-right: 0.6em;
	font-size: small;
	font-family: inherit;
	cursor: pointer;
}

header .header-actions .theme-switcher--compact select:hover {
	background-color: var(--header-hover-background-color);
	color: var(--header-hover-text-color);
}

header .header-actions .theme-switcher--compact select:focus-visible {
	outline: 2px solid var(--header-hover-text-color, #fff);
	outline-offset: -2px;
}
</style>
