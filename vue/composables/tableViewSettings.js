/** Saved layouts and column view state use browser localStorage (requires `tableId`). */
export const VIEW_CONTROL_LOCAL_STORAGE = 'localStorageControlled'

/** Saved layouts and view persistence are driven by `viewSettings` callbacks. */
export const VIEW_CONTROL_CALLBACK = 'callbackControlled'

export const VIEW_CONTROL_MODES = [
	VIEW_CONTROL_LOCAL_STORAGE,
	VIEW_CONTROL_CALLBACK,
]

/**
 * Callback API for {@link VIEW_CONTROL_CALLBACK} (same surface as legacy `layoutPresets`).
 *
 * @typedef {object} TableViewSettingsCallbacks
 * @property {() => Promise<{ presets?: object[], defaultPresetId?: string|null }>|{ presets?: object[], defaultPresetId?: string|null }} list
 * @property {() => Promise<{ ok: boolean, preset?: object|null }>|{ ok: boolean, preset?: object|null }} [getDefault]
 * @property {(args: { name: string, state: object, setAsDefault?: boolean }) => Promise<{ ok: boolean, preset?: object, error?: string }>} save
 * @property {(args: { presetId: string, state: object }) => Promise<{ ok: boolean, preset?: object, error?: string }>} [overwrite]
 * @property {(presetId: string) => Promise<{ ok: boolean, preset?: object, error?: string }>} load
 * @property {(presetId: string) => Promise<{ ok: boolean, error?: string }>} delete
 * @property {(presetId: string|null) => Promise<{ ok: boolean, error?: string }>} setDefault
 */

export function getViewSettingsHandlers(viewSettings, layoutPresets) {
	return viewSettings ?? layoutPresets ?? null
}

export function isViewSettingsControlEnabled(viewControlMode, tableId, handlers) {
	if (viewControlMode === VIEW_CONTROL_CALLBACK) {
		return handlers != null
	}
	return Boolean(tableId)
}
