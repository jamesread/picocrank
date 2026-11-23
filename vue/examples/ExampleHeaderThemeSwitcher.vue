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
