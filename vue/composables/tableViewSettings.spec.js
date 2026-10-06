import { describe, expect, it } from 'vitest'
import {
	getViewSettingsHandlers,
	isViewSettingsControlEnabled,
	VIEW_CONTROL_CALLBACK,
	VIEW_CONTROL_LOCAL_STORAGE,
} from './tableViewSettings.js'

describe('tableViewSettings', () => {
	it('prefers viewSettings over layoutPresets', () => {
		const handlers = { list: () => {} }
		expect(getViewSettingsHandlers(handlers, { list: () => 'legacy' })).toBe(handlers)
	})

	it('enables control per mode', () => {
		expect(isViewSettingsControlEnabled(VIEW_CONTROL_LOCAL_STORAGE, 'users', null)).toBe(true)
		expect(isViewSettingsControlEnabled(VIEW_CONTROL_LOCAL_STORAGE, '', null)).toBe(false)
		expect(isViewSettingsControlEnabled(VIEW_CONTROL_CALLBACK, '', { list: () => {} })).toBe(true)
		expect(isViewSettingsControlEnabled(VIEW_CONTROL_CALLBACK, 'users', null)).toBe(false)
	})
})
