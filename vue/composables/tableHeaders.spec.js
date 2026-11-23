import { describe, expect, it } from 'vitest'
import { headerAccessibleName, headerDisplayLabel } from './tableHeaders.js'

describe('headerDisplayLabel', () => {
	it('shows the label, or the key when there is no label', () => {
		expect(headerDisplayLabel({ key: 'city', label: 'City' })).toBe('City')
		expect(headerDisplayLabel({ key: 'city' })).toBe('city')
		expect(headerDisplayLabel({ key: 'city', label: null })).toBe('city')
		expect(headerDisplayLabel('city')).toBe('city')
		expect(headerDisplayLabel(null)).toBe('')
	})

	it('shows nothing for an explicitly empty label', () => {
		expect(headerDisplayLabel({ key: 'actions', label: '' })).toBe('')
	})
})

describe('headerAccessibleName', () => {
	it('prefers ariaLabel, then the label, then the key', () => {
		expect(headerAccessibleName({ key: 'actions', label: '', ariaLabel: 'Row actions' })).toBe('Row actions')
		expect(headerAccessibleName({ key: 'city', label: 'City' })).toBe('City')
		expect(headerAccessibleName({ key: 'actions', label: '' })).toBe('actions')
		expect(headerAccessibleName('city')).toBe('city')
		expect(headerAccessibleName(undefined)).toBe('')
	})
})
