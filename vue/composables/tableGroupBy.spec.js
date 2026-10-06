import { describe, expect, it } from 'vitest'
import {
	buildDisplayBodyItems,
	buildGroupId,
	compareGroupValues,
	formatGroupValue,
	groupRowsByColumn,
	paginateGroupedRows,
} from './tableGroupBy.js'

const rows = [
	{ name: 'Ada', city: 'London' },
	{ name: 'Grace', city: 'New York' },
	{ name: 'Katherine', city: 'London' },
	{ name: 'Alan', city: '' },
]

describe('tableGroupBy', () => {
	it('formats empty group values', () => {
		expect(formatGroupValue(null)).toBe('(empty)')
		expect(formatGroupValue('Paris')).toBe('Paris')
	})

	it('groups rows by column while preserving row order within groups', () => {
		const groups = groupRowsByColumn(rows, 'city')

		expect(groups.map((group) => group.value)).toEqual(['London', 'New York', null])
		expect(groups[0].rows.map((row) => row.name)).toEqual(['Ada', 'Katherine'])
		expect(buildGroupId('city', 'London')).toBe('city::London')
		expect(buildGroupId('city', null)).toBe('city::')
	})

	it('compares group values with empty values last', () => {
		expect(compareGroupValues('London', 'New York')).toBeLessThan(0)
		expect(compareGroupValues(null, 'London')).toBeGreaterThan(0)
	})

	it('paginates grouped rows by leaf row count', () => {
		const pageOne = paginateGroupedRows(rows, 'city', 1, 2)
		const pageTwo = paginateGroupedRows(rows, 'city', 2, 2)

		expect(pageOne).toHaveLength(1)
		expect(pageOne[0].value).toBe('London')
		expect(pageOne[0].rows.map((row) => row.name)).toEqual(['Ada', 'Katherine'])
		expect(pageTwo.map((group) => group.value)).toEqual(['New York', null])
	})

	it('builds display items with group headers and source indexes', () => {
		const items = buildDisplayBodyItems(rows, {
			groupBy: 'city',
			paginate: false,
		})

		expect(items.filter((item) => item.kind === 'group').map((item) => item.count)).toEqual([2, 1, 1])
		expect(items.find((item) => item.kind === 'row' && item.row.name === 'Ada')?.sourceIndex).toBe(0)
	})

	it('omits collapsed group rows from display items', () => {
		const londonGroupId = buildGroupId('city', 'London')
		const items = buildDisplayBodyItems(rows, {
			groupBy: 'city',
			paginate: false,
			collapsedGroupIds: new Set([londonGroupId]),
		})

		expect(items.some((item) => item.kind === 'row' && item.row.name === 'Ada')).toBe(false)
		expect(items.some((item) => item.kind === 'group' && item.groupId === londonGroupId && item.collapsed)).toBe(true)
	})
})
