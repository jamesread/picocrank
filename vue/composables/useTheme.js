import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'picocrank-theme'

function getSystemTheme() {
	if (typeof window === 'undefined') {
		return 'light'
	}
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme() {
	if (typeof window === 'undefined') {
		return 'light'
	}
	const stored = localStorage.getItem(STORAGE_KEY)
	if (stored === 'light' || stored === 'dark') {
		return stored
	}
	return getSystemTheme()
}

function applyTheme(value) {
	if (typeof document === 'undefined') {
		return
	}
	document.documentElement.setAttribute('data-theme', value)
}

export const theme = ref(readStoredTheme())

applyTheme(theme.value)

watch(theme, (value) => {
	applyTheme(value)
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, value)
	}
})

export function useTheme() {
	const isDark = computed(() => theme.value === 'dark')

	function toggleTheme() {
		theme.value = theme.value === 'dark' ? 'light' : 'dark'
	}

	function setTheme(value) {
		if (value === 'light' || value === 'dark') {
			theme.value = value
		}
	}

	return {
		theme,
		isDark,
		toggleTheme,
		setTheme,
	}
}
