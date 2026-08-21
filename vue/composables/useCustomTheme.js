import { ref, watch } from 'vue'

const STYLE_ELEMENT_ID = 'theme-style'
const DEFAULT_STORAGE_KEY = 'picocrank-custom-theme'

export const SUPPLEMENTAL_THEME_NAMES = [
	'catppuccin-latte-frappe',
	'dracula-alucard',
	'gruvbox-dark-light',
	'waffles',
]

const LEGACY_THEME_ALIASES = {
	catppuccin: 'catppuccin-latte-frappe',
	dracula: 'dracula-alucard',
}

function resolveDefaultBasePath(segment) {
	try {
		const base = import.meta.env?.BASE_URL || '/'
		const joined = base.endsWith('/') ? `${base}${segment}` : `${base}/${segment}`
		return joined.replace(/\/$/, '') || `/${segment}`
	} catch {
		return `/${segment}`
	}
}

const DEFAULT_THEMES_BASE_PATH = resolveDefaultBasePath('themes')
const DEFAULT_SUPPLEMENTAL_THEMES_BASE_PATH = resolveDefaultBasePath('supplemental-themes')

const availableThemes = ref([])
const themeLabels = ref({})
const themePreference = ref('')
const themesBasePath = ref(DEFAULT_THEMES_BASE_PATH)
const supplementalThemesBasePath = ref(DEFAULT_SUPPLEMENTAL_THEMES_BASE_PATH)
const storageKey = ref(DEFAULT_STORAGE_KEY)
const includeSupplementalThemes = ref(false)
const supplementalThemeNames = ref([...SUPPLEMENTAL_THEME_NAMES])
let initialized = false

function normalizeBasePath(basePath, fallback) {
	if (!basePath || typeof basePath !== 'string') {
		return fallback
	}
	const trimmed = basePath.replace(/\/$/, '')
	return trimmed || fallback
}

function normalizeStoredThemeName(name) {
	if (!name) {
		return ''
	}
	return LEGACY_THEME_ALIASES[name] || name
}

function normalizeThemeEntry(entry) {
	if (typeof entry === 'string' && entry.length > 0) {
		return { id: entry, label: entry }
	}
	if (entry && typeof entry.id === 'string' && entry.id.length > 0) {
		return {
			id: entry.id,
			label: typeof entry.label === 'string' && entry.label.length > 0 ? entry.label : entry.id,
		}
	}
	return null
}

function mergeThemeEntries(entries) {
	const ids = []
	const labels = {}

	for (const entry of entries) {
		const normalized = normalizeThemeEntry(entry)
		if (!normalized) {
			continue
		}
		ids.push(normalized.id)
		if (normalized.label !== normalized.id) {
			labels[normalized.id] = normalized.label
		}
	}

	return {
		ids: [...new Set(ids)].sort((a, b) => a.localeCompare(b)),
		labels,
	}
}

function isSupplementalThemeName(name) {
	return supplementalThemeNames.value.includes(name)
}

function readStoredTheme(key) {
	if (typeof localStorage === 'undefined') {
		return ''
	}
	return localStorage.getItem(key) || ''
}

function readStoredThemePreference(key) {
	return normalizeStoredThemeName(readStoredTheme(key))
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

function isSupplementalTheme(name) {
	return includeSupplementalThemes.value
		&& isSupplementalThemeName(name)
}

function themeStylesheetHref(name) {
	const basePath = isSupplementalThemeName(name)
		? supplementalThemesBasePath.value
		: themesBasePath.value
	return `${basePath}/${encodeURIComponent(name)}/theme.css`
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

	if (isSupplementalThemeName(name) && !includeSupplementalThemes.value) {
		themeStyle.textContent = ''
		return
	}

	const href = themeStylesheetHref(name)
	themeStyle.textContent = `@import url('${href}') layer(theme);`
}

function setTheme(name) {
	const nextName = normalizeStoredThemeName(name || '')
	if (nextName && isSupplementalThemeName(nextName) && !includeSupplementalThemes.value) {
		themePreference.value = ''
		return
	}
	themePreference.value = nextName
}

function clearTheme() {
	setTheme('')
}

function clearStoredSupplementalThemeIfDisabled() {
	if (
		themePreference.value
		&& isSupplementalThemeName(themePreference.value)
		&& !includeSupplementalThemes.value
	) {
		themePreference.value = ''
	}
}

async function fetchThemeIndex(basePath) {
	if (typeof fetch === 'undefined') {
		return []
	}

	const indexUrl = `${basePath}/index.json`
	try {
		const response = await fetch(indexUrl, { cache: 'no-store' })
		if (!response.ok) {
			return []
		}
		const data = await response.json()
		return Array.isArray(data?.themes) ? data.themes : []
	} catch {
		return []
	}
}

async function discoverThemes() {
	const userThemes = mergeThemeEntries(await fetchThemeIndex(themesBasePath.value))
	let ids = [...userThemes.ids]
	let labels = { ...userThemes.labels }

	if (includeSupplementalThemes.value) {
		const supplementalThemes = mergeThemeEntries(await fetchThemeIndex(supplementalThemesBasePath.value))
		ids = [...ids, ...supplementalThemes.ids]
		labels = { ...labels, ...supplementalThemes.labels }
	}

	availableThemes.value = [...new Set(ids)].sort((a, b) => a.localeCompare(b))
	themeLabels.value = labels

	clearStoredSupplementalThemeIfDisabled()

	if (themePreference.value && !availableThemes.value.includes(themePreference.value)) {
		themePreference.value = ''
	}

	return availableThemes.value
}

function configure(options = {}) {
	if (options.themesBasePath !== undefined) {
		themesBasePath.value = normalizeBasePath(options.themesBasePath, DEFAULT_THEMES_BASE_PATH)
	}
	if (options.supplementalThemesBasePath !== undefined) {
		supplementalThemesBasePath.value = normalizeBasePath(
			options.supplementalThemesBasePath,
			DEFAULT_SUPPLEMENTAL_THEMES_BASE_PATH,
		)
	}
	if (options.storageKey !== undefined && typeof options.storageKey === 'string' && options.storageKey) {
		storageKey.value = options.storageKey
	}
	if (options.includeSupplementalThemes !== undefined) {
		includeSupplementalThemes.value = Boolean(options.includeSupplementalThemes)
	}
	if (Array.isArray(options.supplementalThemeNames)) {
		supplementalThemeNames.value = options.supplementalThemeNames
			.filter((theme) => typeof theme === 'string' && theme.length > 0)
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
		const storedTheme = readStoredThemePreference(storageKey.value)
		if (storedTheme !== readStoredTheme(storageKey.value)) {
			persistTheme(storageKey.value, storedTheme)
		}
		themePreference.value = storedTheme
		clearStoredSupplementalThemeIfDisabled()
		watch(themePreference, (value) => {
			persistTheme(storageKey.value, value)
			applyTheme()
		})
		watch(includeSupplementalThemes, () => {
			void discoverThemes()
			clearStoredSupplementalThemeIfDisabled()
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
		themeLabels,
		themePreference,
		themesBasePath,
		supplementalThemesBasePath,
		storageKey,
		includeSupplementalThemes,
		supplementalThemeNames,
		applyTheme,
		setTheme,
		clearTheme,
		discoverThemes,
		configure,
		initCustomTheme,
		isSupplementalTheme,
		isSupplementalThemeName,
	}
}

export { initCustomTheme }
