import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'picocrank-theme'
const THEME_CYCLE = ['auto', 'light', 'dark']

function getSystemTheme() {
	if (typeof window === 'undefined') {
		return 'light'
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredPreference() {
	if (typeof window === 'undefined') {
		return 'auto'
	}
	const stored = localStorage.getItem(STORAGE_KEY)
	if (stored === 'light' || stored === 'dark' || stored === 'auto') {
		return stored
	}
	return 'auto'
}

function resolveTheme(preference) {
	return preference === 'auto' ? getSystemTheme() : preference
}

function applyTheme(value) {
	if (typeof document === 'undefined') {
		return
	}
	document.documentElement.setAttribute('data-theme', value)
}

export const theme = ref(readStoredPreference())

applyTheme(resolveTheme(theme.value))

watch(theme, (value) => {
	applyTheme(resolveTheme(value))
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, value)
	}
})

if (typeof window !== 'undefined') {
	const media = window.matchMedia('(prefers-color-scheme: dark)')
	const onSystemThemeChange = () => {
		if (theme.value === 'auto') {
			applyTheme(getSystemTheme())
		}
	}
	if (typeof media.addEventListener === 'function') {
		media.addEventListener('change', onSystemThemeChange)
	} else if (typeof media.addListener === 'function') {
		media.addListener(onSystemThemeChange)
	}
}

export function useTheme() {
	const resolvedTheme = computed(() => resolveTheme(theme.value))
	const isDark = computed(() => resolvedTheme.value === 'dark')

	function toggleTheme() {
		const index = THEME_CYCLE.indexOf(theme.value)
		theme.value = THEME_CYCLE[(index + 1) % THEME_CYCLE.length]
	}

	function setTheme(value) {
		if (value === 'light' || value === 'dark' || value === 'auto') {
			theme.value = value
		}
	}

	return {
		theme,
		resolvedTheme,
		isDark,
		toggleTheme,
		setTheme,
	}
}
