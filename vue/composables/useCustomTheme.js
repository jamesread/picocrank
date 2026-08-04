import { ref, watch } from 'vue'

const STYLE_ELEMENT_ID = 'theme-style'
const DEFAULT_STORAGE_KEY = 'picocrank-custom-theme'

function resolveDefaultBasePath() {
	try {
		const base = import.meta.env?.BASE_URL || '/'
		const joined = base.endsWith('/') ? `${base}themes` : `${base}/themes`
		return joined.replace(/\/$/, '') || '/themes'
	} catch {
		return '/themes'
	}
}

const DEFAULT_BASE_PATH = resolveDefaultBasePath()

const availableThemes = ref([])
const themePreference = ref('')
const themesBasePath = ref(DEFAULT_BASE_PATH)
const storageKey = ref(DEFAULT_STORAGE_KEY)
let initialized = false

function normalizeBasePath(basePath) {
	if (!basePath || typeof basePath !== 'string') {
		return DEFAULT_BASE_PATH
	}
	const trimmed = basePath.replace(/\/$/, '')
	return trimmed || DEFAULT_BASE_PATH
}

function readStoredTheme(key) {
	if (typeof localStorage === 'undefined') {
		return ''
	}
	return localStorage.getItem(key) || ''
}

function persistTheme(key, value) {
	if (typeof localStorage === 'undefined') {
		return
	}
	if (!value) {
		localStorage.removeItem(key)
		return
	}
	localStorage.setItem(key, value)
}

function ensureStyleElement() {
	if (typeof document === 'undefined') {
		return null
	}
	let themeStyle = document.getElementById(STYLE_ELEMENT_ID)
	if (!themeStyle) {
		themeStyle = document.createElement('style')
		themeStyle.id = STYLE_ELEMENT_ID
		themeStyle.type = 'text/css'
		document.head.appendChild(themeStyle)
	}
	return themeStyle
}

function applyTheme() {
	const themeStyle = ensureStyleElement()
	if (!themeStyle) {
		return
	}

	const name = themePreference.value
	if (!name) {
		themeStyle.textContent = ''
		return
	}

	const href = `${themesBasePath.value}/${encodeURIComponent(name)}/theme.css`
	themeStyle.textContent = `@import url('${href}') layer(theme);`
}

function setTheme(name) {
	themePreference.value = name || ''
}

function clearTheme() {
	setTheme('')
}

async function discoverThemes() {
	if (typeof fetch === 'undefined') {
		availableThemes.value = []
		return availableThemes.value
	}

	const indexUrl = `${themesBasePath.value}/index.json`
	try {
		const response = await fetch(indexUrl, { cache: 'no-store' })
		if (!response.ok) {
			availableThemes.value = []
			return availableThemes.value
		}
		const data = await response.json()
		const themes = Array.isArray(data?.themes)
			? data.themes.filter((theme) => typeof theme === 'string' && theme.length > 0)
			: []
		availableThemes.value = themes.sort((a, b) => a.localeCompare(b))
	} catch {
		availableThemes.value = []
	}

	return availableThemes.value
}

function configure(options = {}) {
	if (options.themesBasePath !== undefined) {
		themesBasePath.value = normalizeBasePath(options.themesBasePath)
	}
	if (options.storageKey !== undefined && typeof options.storageKey === 'string' && options.storageKey) {
		storageKey.value = options.storageKey
	}
	if (Array.isArray(options.availableThemes)) {
		availableThemes.value = options.availableThemes
			.filter((theme) => typeof theme === 'string' && theme.length > 0)
			.sort((a, b) => a.localeCompare(b))
	}
}

function initCustomTheme(options = {}) {
	configure(options)

	if (!initialized) {
		themePreference.value = readStoredTheme(storageKey.value)
		watch(themePreference, (value) => {
			persistTheme(storageKey.value, value)
			applyTheme()
		})
		initialized = true
	}

	applyTheme()
	return useCustomTheme()
}

export function useCustomTheme(options) {
	if (options) {
		configure(options)
	}

	return {
		availableThemes,
		themePreference,
		themesBasePath,
		storageKey,
		applyTheme,
		setTheme,
		clearTheme,
		discoverThemes,
		configure,
		initCustomTheme,
	}
}

export { initCustomTheme }
