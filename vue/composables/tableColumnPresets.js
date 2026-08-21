import {
	normalizeColumnFilterEntries,
	normalizeStoredFilterEntry,
} from './tableFilters.js'

export const PRESET_STORE_VERSION = 1
export const MAX_PRESETS_PER_TABLE = 20
export const ALLOWED_PAGE_SIZES = [10, 25, 50, 100]

let presetIdCounter = 0

export function createPresetId() {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return `preset-${crypto.randomUUID()}`
	}

	presetIdCounter += 1
	return `preset-${presetIdCounter}-${Date.now()}`
}

export function getPresetStorageKey(tableId) {
	const origin = typeof window !== 'undefined' ? window.location.origin : 'ssr'
	return `picocrank-table-layouts:v${PRESET_STORE_VERSION}:${origin}:${tableId}`
}

function createEmptyStore() {
	return {
		version: PRESET_STORE_VERSION,
		defaultPresetId: null,
		presets: [],
	}
}

function normalizeStore(raw) {
	if (!raw || typeof raw !== 'object') {
		return createEmptyStore()
	}

	const presets = Array.isArray(raw.presets)
		? raw.presets.filter((preset) => preset?.id && preset?.name && preset?.state)
		: []

	const defaultPresetId = typeof raw.defaultPresetId === 'string'
		&& presets.some((preset) => preset.id === raw.defaultPresetId)
		? raw.defaultPresetId
		: null

	return {
		version: PRESET_STORE_VERSION,
		defaultPresetId,
		presets,
	}
}

export function readPresetStore(tableId) {
	if (!tableId || typeof localStorage === 'undefined') {
		return createEmptyStore()
	}

	try {
		const raw = localStorage.getItem(getPresetStorageKey(tableId))
		if (!raw) {
			return createEmptyStore()
		}
		return normalizeStore(JSON.parse(raw))
	} catch {
		return createEmptyStore()
	}
}

export function writePresetStore(tableId, store) {
	if (!tableId || typeof localStorage === 'undefined') {
		return false
	}

	localStorage.setItem(getPresetStorageKey(tableId), JSON.stringify(normalizeStore(store)))
	return true
}

export function listPresets(tableId) {
	const store = readPresetStore(tableId)
	return {
		presets: store.presets.map((preset) => ({ ...preset })),
		defaultPresetId: store.defaultPresetId,
	}
}

export function getDefaultPreset(tableId) {
	const store = readPresetStore(tableId)
	if (!store.defaultPresetId) {
		return null
	}
	return store.presets.find((preset) => preset.id === store.defaultPresetId) ?? null
}

function isValidColPriority(priority) {
	return Number.isInteger(priority) && priority >= 1 && priority <= 5
}

function headerMaps(headers = []) {
	const headerByKey = new Map()
	const manageableKeys = []
	const configurableKeys = []

	for (const header of headers) {
		if (!header?.key || header.hidden) {
			continue
		}
		manageableKeys.push(header.key)
		headerByKey.set(header.key, header)
		if (header.hideable !== false) {
			configurableKeys.push(header.key)
		}
	}

	return { headerByKey, manageableKeys, configurableKeys }
}

export function sanitizePresetState(state, headers = [], rows = []) {
	if (!state || typeof state !== 'object') {
		return null
	}

	const { headerByKey, manageableKeys, configurableKeys } = headerMaps(headers)
	const sanitized = {}

	if (Array.isArray(state.columnOrder)) {
		const fromOrder = state.columnOrder.filter((key) => manageableKeys.includes(key))
		const missing = manageableKeys.filter((key) => !fromOrder.includes(key))
		sanitized.columnOrder = [...fromOrder, ...missing]
	}

	if (state.columnVisibility && typeof state.columnVisibility === 'object') {
		sanitized.columnVisibility = Object.fromEntries(
			configurableKeys.map((key) => [
				key,
				state.columnVisibility[key] !== false,
			]),
		)
	}

	if (state.columnPriorities && typeof state.columnPriorities === 'object') {
		const priorities = {}
		for (const [key, value] of Object.entries(state.columnPriorities)) {
			if (!manageableKeys.includes(key)) {
				continue
			}
			if (value === null || value === '') {
				priorities[key] = null
				continue
			}
			if (isValidColPriority(value)) {
				priorities[key] = value
			}
		}
		sanitized.columnPriorities = priorities
	}

	if (state.filters && typeof state.filters === 'object') {
		const filters = {}
		for (const [key, columnFilters] of Object.entries(state.filters)) {
			const header = headerByKey.get(key)
			if (!header || header.filterable === false) {
				continue
			}
			const entries = normalizeColumnFilterEntries(columnFilters, header, rows)
				.map((entry) => normalizeStoredFilterEntry(header, entry, rows))
				.filter(Boolean)
			if (entries.length > 0) {
				filters[key] = entries
			}
		}
		sanitized.filters = filters
	}

	if (state.sortBy) {
		const header = headerByKey.get(state.sortBy)
		if (header?.sortable) {
			sanitized.sortBy = state.sortBy
			sanitized.sortDir = state.sortDir === 'desc' ? 'desc' : 'asc'
		}
	}

	const rawPageSize = Number(state.pageSize)
	if (Number.isFinite(rawPageSize)) {
		const normalizedPageSize = Math.floor(rawPageSize)
		if (ALLOWED_PAGE_SIZES.includes(normalizedPageSize)) {
			sanitized.pageSize = normalizedPageSize
		}
	}

	return sanitized
}

export function savePreset(tableId, { name, state, setAsDefault = false }) {
	const trimmedName = String(name ?? '').trim()
	if (!tableId) {
		return { ok: false, error: 'Table identity is required.' }
	}
	if (!trimmedName) {
		return { ok: false, error: 'Preset name is required.' }
	}
	if (!state || typeof state !== 'object') {
		return { ok: false, error: 'Nothing to save.' }
	}

	const store = readPresetStore(tableId)
	if (store.presets.length >= MAX_PRESETS_PER_TABLE) {
		return { ok: false, error: `Maximum of ${MAX_PRESETS_PER_TABLE} saved layouts reached.` }
	}

	const preset = {
		id: createPresetId(),
		name: trimmedName,
		savedAt: new Date().toISOString(),
		state: JSON.parse(JSON.stringify(state)),
	}

	store.presets.push(preset)
	if (setAsDefault) {
		store.defaultPresetId = preset.id
	}

	writePresetStore(tableId, store)
	return { ok: true, preset, defaultPresetId: store.defaultPresetId }
}

export function deletePreset(tableId, presetId) {
	if (!tableId || !presetId) {
		return { ok: false, error: 'Preset not found.' }
	}

	const store = readPresetStore(tableId)
	const nextPresets = store.presets.filter((preset) => preset.id !== presetId)
	if (nextPresets.length === store.presets.length) {
		return { ok: false, error: 'Preset not found.' }
	}

	store.presets = nextPresets
	if (store.defaultPresetId === presetId) {
		store.defaultPresetId = null
	}

	writePresetStore(tableId, store)
	return { ok: true, defaultPresetId: store.defaultPresetId }
}

export function setDefaultPreset(tableId, presetId) {
	if (!tableId) {
		return { ok: false, error: 'Table identity is required.' }
	}

	const store = readPresetStore(tableId)
	if (presetId === null) {
		store.defaultPresetId = null
		writePresetStore(tableId, store)
		return { ok: true, defaultPresetId: null }
	}

	const preset = store.presets.find((item) => item.id === presetId)
	if (!preset) {
		return { ok: false, error: 'Preset not found.' }
	}

	store.defaultPresetId = presetId
	writePresetStore(tableId, store)
	return { ok: true, defaultPresetId: presetId }
}

export function getPresetById(tableId, presetId) {
	const store = readPresetStore(tableId)
	return store.presets.find((preset) => preset.id === presetId) ?? null
}

export function cloneLayoutState(state) {
	return JSON.parse(JSON.stringify(state ?? {}))
}

export function normalizeLayoutStateForCompare(state, headers = [], rows = []) {
	const sanitized = sanitizePresetState(state, headers, rows) ?? {}

	return {
		columnOrder: sanitized.columnOrder ?? [],
		columnVisibility: sanitized.columnVisibility ?? {},
		columnPriorities: sanitized.columnPriorities ?? {},
		filters: sanitized.filters ?? {},
		sortBy: sanitized.sortBy ?? null,
		sortDir: sanitized.sortDir === 'desc' ? 'desc' : 'asc',
		pageSize: sanitized.pageSize ?? ALLOWED_PAGE_SIZES[0],
	}
}

export function layoutStatesEqual(left, right, headers = [], rows = []) {
	return JSON.stringify(normalizeLayoutStateForCompare(left, headers, rows))
		=== JSON.stringify(normalizeLayoutStateForCompare(right, headers, rows))
}
