<template>
	<label class="theme-switcher">
		<span v-if="label" class="theme-switcher-label">{{ label }}</span>
		<select :value="themePreference" @change="onThemeChange">
			<option value="">{{ defaultOptionLabel }}</option>
			<option
				v-for="name in availableThemes"
				:key="name"
				:value="name"
			>
				{{ themeLabels[name] || name }}
			</option>
		</select>
	</label>
	<p v-if="showEmptyHint && availableThemes.length === 0" class="subtle theme-switcher-hint">
		<slot name="empty">
			No drop-in themes found. Add <code>public/themes/&lt;name&gt;/theme.css</code>
			or set <code>include-supplemental-themes</code> to list bundled supplemental themes.
		</slot>
	</p>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useCustomTheme } from '../composables/useCustomTheme.js'

const props = defineProps({
	label: {
		type: String,
		default: 'Active theme',
	},
	defaultOptionLabel: {
		type: String,
		default: 'Default (Femtocrank)',
	},
	includeSupplementalThemes: {
		type: Boolean,
		default: false,
	},
	themesBasePath: {
		type: String,
		default: undefined,
	},
	supplementalThemesBasePath: {
		type: String,
		default: undefined,
	},
	storageKey: {
		type: String,
		default: undefined,
	},
	showEmptyHint: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits(['change'])

const {
	availableThemes,
	themeLabels,
	themePreference,
	setTheme,
	discoverThemes,
	configure,
} = useCustomTheme()

function syncOptions() {
	configure({
		includeSupplementalThemes: props.includeSupplementalThemes,
		themesBasePath: props.themesBasePath,
		supplementalThemesBasePath: props.supplementalThemesBasePath,
		storageKey: props.storageKey,
	})
}

function onThemeChange(event) {
	const value = event.target.value
	setTheme(value)
	emit('change', value)
}

watch(
	() => [
		props.includeSupplementalThemes,
		props.themesBasePath,
		props.supplementalThemesBasePath,
		props.storageKey,
	],
	() => {
		syncOptions()
		void discoverThemes()
	},
)

onMounted(() => {
	syncOptions()
	void discoverThemes()
})
</script>

<style scoped>
.theme-switcher {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
	margin: 0;
}

.theme-switcher select {
	min-width: 14rem;
}

.theme-switcher-hint {
	margin: 0.75rem 0 0;
}
</style>
