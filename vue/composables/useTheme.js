import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'picocrank-theme'

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

function getNextTheme(preference) {
	const system = getSystemTheme()
	if (preference === 'auto') {
		return system === 'light' ? 'dark' : 'light'
	}
	if (preference === 'light') {
		return system === 'light' ? 'auto' : 'dark'
	}
	return system === 'dark' ? 'auto' : 'light'
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
	const nextTheme = computed(() => getNextTheme(theme.value))
	const isDark = computed(() => resolvedTheme.value === 'dark')

	function toggleTheme() {
		theme.value = getNextTheme(theme.value)
	}

	function setTheme(value) {
		if (value === 'light' || value === 'dark' || value === 'auto') {
			theme.value = value
		}
	}

	return {
		theme,
		resolvedTheme,
		nextTheme,
		isDark,
		toggleTheme,
		setTheme,
	}
}
