import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import Table from './Table.vue'

const globalStubs = {
	HugeiconsIcon: true,
	Pagination: true,
	TableColumnFilterPopover: true,
	TableColumnOptionsPopover: true,
}

const headers = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'city', label: 'City' },
]

const rows = [
	{ name: 'Ada', city: 'London' },
	{ name: 'Grace', city: 'New York' },
	{ name: 'Katherine', city: 'Newport News' },
]

function mountTable(overrides = {}) {
	return mount(Table, {
		attachTo: document.body,
		props: {
			headers,
			data: rows,
			rowKey: 'name',
			showPagination: false,
			filterable: false,
			columnOptions: false,
			selectable: true,
			...overrides.props,
		},
		global: {
			stubs: globalStubs,
		},
		slots: overrides.slots,
	})
}

describe('Table multi-select', () => {
	it('renders a select column with header and row checkboxes when selectable', () => {
		const wrapper = mountTable()

		expect(wrapper.findAll('th.table-select-col')).toHaveLength(1)
		expect(wrapper.findAll('td.table-select-col input[type="checkbox"]')).toHaveLength(rows.length)
	})

	it('does not render select checkboxes when selectable is false', () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
			},
		})

		expect(wrapper.find('th.table-select-col').exists()).toBe(false)
		expect(wrapper.find('td.table-select-col').exists()).toBe(false)
	})

	it('toggles a row via its checkbox and emits selection updates', async () => {
		const wrapper = mountTable()

		const firstCheckbox = wrapper.findAll('td.table-select-col input[type="checkbox"]')[0]
		await firstCheckbox.setValue(true)
		await nextTick()

		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Ada'])
		expect(wrapper.emitted('selection-change')?.at(-1)?.[0]).toEqual(['Ada'])
		expect(wrapper.find('tbody tr.row-selected').exists()).toBe(true)
	})

	it('toggles selection when a row is clicked', async () => {
		const wrapper = mountTable()

		await wrapper.findAll('tbody tr')[1].trigger('click')
		await nextTick()

		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Grace'])
	})

	it('selects and clears the current page via the header checkbox', async () => {
		const wrapper = mountTable()
		const headerCheckbox = wrapper.find('th.table-select-col input[type="checkbox"]')

		await headerCheckbox.setValue(true)
		await nextTick()

		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([
			'Ada',
			'Grace',
			'Katherine',
		])

		await headerCheckbox.setValue(false)
		await nextTick()

		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([])
	})

	it('supports controlled selectedKeys via v-model', async () => {
		const wrapper = mountTable({
			props: {
				selectedKeys: ['Grace'],
			},
		})

		await nextTick()

		const checkboxes = wrapper.findAll('td.table-select-col input[type="checkbox"]')
		expect(checkboxes[1].element.checked).toBe(true)
		expect(wrapper.findAll('tbody tr.row-selected')).toHaveLength(1)

		await wrapper.setProps({ selectedKeys: ['Ada', 'Katherine'] })
		await nextTick()

		expect(wrapper.findAll('tbody tr.row-selected')).toHaveLength(2)
	})

	it('does not emit row-click while selectable; row clicks select instead', async () => {
		const wrapper = mountTable({
			props: {
				onRowClick: () => {},
			},
		})

		await wrapper.findAll('tbody tr')[0].trigger('click')
		await nextTick()

		expect(wrapper.emitted('row-click')).toBeUndefined()
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Ada'])
	})

	it('clears selection when selectable is turned off', async () => {
		const wrapper = mountTable()

		await wrapper.findAll('tbody tr')[0].trigger('click')
		await nextTick()
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Ada'])

		await wrapper.setProps({ selectable: false })
		await nextTick()

		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([])
	})

	it('supports checkbox-only selection while preserving row clicks', async () => {
		const onRowClick = vi.fn()
		const wrapper = mountTable({
			props: {
				selectionClickMode: 'checkbox',
				onRowClick,
			},
		})

		await wrapper.findAll('tbody tr')[0].trigger('click', { ctrlKey: true })

		expect(wrapper.emitted('update:selectedKeys')).toBeUndefined()
		expect(wrapper.emitted('row-click')?.[0]?.[0].row.name).toBe('Ada')
		expect(wrapper.emitted('row-click')?.[0]?.[0].index).toBe(0)
		expect(wrapper.emitted('row-click')?.[0]?.[0].event).toBeInstanceOf(MouseEvent)
		expect(wrapper.emitted('row-click')?.[0]?.[0].event.ctrlKey).toBe(true)
		expect(onRowClick).toHaveBeenCalledTimes(1)

		await wrapper.findAll('td.table-select-col input[type="checkbox"]')[0].setValue(true)

		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Ada'])
	})

	it('supports modifier toggles and shift ranges on displayed rows', async () => {
		const wrapper = mountTable({
			props: {
				selectionClickMode: 'modifier',
				onRowClick: () => {},
			},
		})
		const tableRows = wrapper.findAll('tbody tr')

		await tableRows[1].trigger('click')
		expect(wrapper.emitted('row-click')).toHaveLength(1)
		expect(wrapper.emitted('update:selectedKeys')).toBeUndefined()

		await tableRows[0].trigger('click', { ctrlKey: true })
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Ada'])

		await tableRows[2].trigger('click', { shiftKey: true })
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([
			'Ada',
			'Grace',
			'Katherine',
		])

		await tableRows[1].trigger('click', { metaKey: true })
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([
			'Ada',
			'Katherine',
		])
		expect(wrapper.emitted('row-click')).toHaveLength(1)
	})

	it('supports extended replace, modifier-toggle, and range semantics', async () => {
		const extendedRows = [
			...rows,
			{ name: 'Margaret', city: 'Arlington' },
		]
		const wrapper = mountTable({
			props: {
				data: extendedRows,
				showPagination: true,
				pageSize: 3,
				selectionClickMode: 'extended',
			},
		})
		const tableRows = wrapper.findAll('tbody tr')

		await tableRows[0].trigger('click')
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Ada'])

		await tableRows[1].trigger('click')
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Grace'])

		await tableRows[0].trigger('click', { ctrlKey: true })
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Grace', 'Ada'])

		await tableRows[1].trigger('click', { metaKey: true })
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Ada'])

		await tableRows[2].trigger('click', { shiftKey: true })
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual([
			'Ada',
			'Grace',
			'Katherine',
		])
		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).not.toContain('Margaret')
	})
})

describe('Table controlled query state', () => {
	it('keeps sort internal by default and emits sort updates', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
			},
		})
		const names = () => wrapper.findAll('tbody tr').map((row) => row.find('td').text())

		await wrapper.find('thead th').trigger('click')
		expect(names()).toEqual(['Ada', 'Grace', 'Katherine'])
		expect(wrapper.emitted('update:sortBy')?.at(-1)?.[0]).toBe('name')

		await wrapper.find('thead th').trigger('click')
		expect(names()).toEqual(['Katherine', 'Grace', 'Ada'])
		expect(wrapper.emitted('update:sortDir')?.at(-1)?.[0]).toBe('desc')
	})

	it('accepts controlled sort changes after mount', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
			},
		})
		const names = () => wrapper.findAll('tbody tr').map((row) => row.find('td').text())

		await wrapper.setProps({ sortBy: 'name', sortDir: 'desc' })
		expect(names()).toEqual(['Katherine', 'Grace', 'Ada'])

		await wrapper.find('thead th').trigger('click')
		expect(wrapper.emitted('update:sortDir')?.at(-1)?.[0]).toBe('asc')
		expect(names()).toEqual(['Katherine', 'Grace', 'Ada'])

		await wrapper.setProps({ sortDir: 'asc' })
		expect(names()).toEqual(['Ada', 'Grace', 'Katherine'])
	})

	it('supports controlled page and pageSize updates', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
				showPagination: true,
				page: 2,
				pageSize: 1,
			},
		})
		const visibleNames = () => wrapper.findAll('tbody tr').map((row) => row.find('td').text())
		const pagination = wrapper.findComponent({ name: 'Pagination' })

		expect(visibleNames()).toEqual(['Grace'])

		pagination.vm.$emit('update:page', 3)
		await nextTick()
		expect(wrapper.emitted('update:page')?.at(-1)?.[0]).toBe(3)
		expect(visibleNames()).toEqual(['Grace'])

		await wrapper.setProps({ page: 3 })
		expect(visibleNames()).toEqual(['Katherine'])

		await wrapper.setProps({ page: 1 })
		pagination.vm.$emit('update:pageSize', 2)
		await nextTick()
		expect(wrapper.emitted('update:pageSize')?.at(-1)?.[0]).toBe(2)
		expect(visibleNames()).toEqual(['Ada'])

		await wrapper.setProps({ pageSize: 2 })
		expect(visibleNames()).toEqual(['Ada', 'Grace'])
	})

	it('preserves the page on sort when resetPageOnSort is false', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
				showPagination: true,
				pageSize: 1,
				resetPageOnSort: false,
			},
		})
		const pagination = wrapper.findComponent({ name: 'Pagination' })

		pagination.vm.$emit('update:page', 2)
		await nextTick()
		expect(wrapper.find('tbody td').text()).toBe('Grace')
		const pageUpdateCount = wrapper.emitted('update:page')?.length

		await wrapper.find('thead th').trigger('click')

		expect(wrapper.find('tbody td').text()).toBe('Grace')
		expect(wrapper.emitted('update:page')).toHaveLength(pageUpdateCount)
	})

	it('keeps the default sort reset and still resets for size, data, and filters', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
				showPagination: true,
				pageSize: 1,
				resetPageOnSort: false,
			},
		})
		const pagination = wrapper.findComponent({ name: 'Pagination' })
		const goToSecondPage = async () => {
			pagination.vm.$emit('update:page', 2)
			await nextTick()
			expect(wrapper.find('tbody td').text()).toBe('Grace')
		}

		await goToSecondPage()
		pagination.vm.$emit('update:pageSize', 2)
		await wrapper.setProps({ pageSize: 2 })
		expect(wrapper.emitted('update:page')?.at(-1)?.[0]).toBe(1)

		pagination.vm.$emit('update:pageSize', 1)
		await wrapper.setProps({ pageSize: 1 })
		await goToSecondPage()
		await wrapper.setProps({ data: [...rows] })
		expect(wrapper.emitted('update:page')?.at(-1)?.[0]).toBe(1)

		await goToSecondPage()
		await wrapper.setProps({
			filterable: true,
			filters: {
				city: [{ type: 'text', operator: 'contains', value: 'London' }],
			},
		})
		expect(wrapper.emitted('update:page')?.at(-1)?.[0]).toBe(1)

		const defaultWrapper = mountTable({
			props: {
				selectable: false,
				showPagination: true,
				pageSize: 1,
			},
		})
		const defaultPagination = defaultWrapper.findComponent({ name: 'Pagination' })
		defaultPagination.vm.$emit('update:page', 2)
		await nextTick()

		await defaultWrapper.find('thead th').trigger('click')

		expect(defaultWrapper.emitted('update:page')?.at(-1)?.[0]).toBe(1)
		expect(defaultWrapper.find('tbody td').text()).toBe('Ada')
	})
})

describe('Table sorting and cell extension hooks', () => {
	it('uses a header comparator for natural sorting', async () => {
		const comparator = vi.fn((left, right) =>
			left.localeCompare(right, undefined, { numeric: true }))
		const versionRows = [
			{ version: 'item10' },
			{ version: 'item2' },
			{ version: 'item1' },
		]
		const wrapper = mountTable({
			props: {
				headers: [
					{ key: 'version', label: 'Version', sortable: true, comparator },
				],
				data: versionRows,
				rowKey: 'version',
				selectable: false,
			},
		})

		await wrapper.find('thead th').trigger('click')

		expect(wrapper.findAll('tbody td').map((cell) => cell.text())).toEqual([
			'item1',
			'item2',
			'item10',
		])
		expect(comparator).toHaveBeenCalled()
		expect(comparator.mock.calls[0][2]).toEqual(versionRows[1])
	})

	it('enriches cell slots and applies row and cell hooks', () => {
		const rowClass = vi.fn(({ row }) => row.name === 'Katherine' && 'custom-row')
		const rowStyle = vi.fn(({ rowIndex }) => ({ opacity: rowIndex === 0 ? '0.5' : '1' }))
		const cellClass = vi.fn(({ header }) => header.key === 'city' && 'custom-cell')
		const cellStyle = vi.fn(({ sourceIndex }) => ({ fontWeight: sourceIndex === 2 ? '700' : '400' }))
		const cellAttrs = vi.fn(({ header, sourceIndex }) => (
			header.key === 'city'
				? { title: 'City value', 'data-source-index': sourceIndex }
				: null
		))
		const wrapper = mountTable({
			props: {
				headers: [
					{ key: 'name', label: 'Name', class: 'legacy-header-class' },
					{ key: 'city', label: 'City' },
				],
				selectable: false,
				sortBy: 'name',
				sortDir: 'desc',
				rowClass,
				rowStyle,
				cellClass,
				cellStyle,
				cellAttrs,
			},
			slots: {
				'cell-name': ({ row, value, header, rowIndex, sourceIndex }) =>
					h(
						'span',
						{ class: 'slot-payload' },
						`${row.name}:${value}:${header.key}:${rowIndex}:${sourceIndex}`,
					),
			},
		})

		const firstRow = wrapper.findAll('tbody tr')[0]
		const cells = firstRow.findAll('td')

		expect(firstRow.classes()).toContain('custom-row')
		expect(firstRow.attributes('style')).toContain('opacity: 0.5')
		expect(cells[0].classes()).toContain('legacy-header-class')
		expect(cells[0].find('.slot-payload').text()).toBe('Katherine:Katherine:name:0:2')
		expect(cells[1].classes()).toContain('custom-cell')
		expect(cells[1].attributes('style')).toContain('font-weight: 700')
		expect(cells[1].attributes('title')).toBe('City value')
		expect(cells[1].attributes('data-source-index')).toBe('2')
		expect(rowClass).toHaveBeenCalledWith({
			row: rows[2],
			rowIndex: 0,
			sourceIndex: 2,
		})
		expect(cellClass.mock.calls[1][0].header.key).toBe('city')
	})
})

describe('Table active cell and exposed APIs', () => {
	it('tracks clicked cells, emits cell details, focuses, and clears', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
			},
		})
		const firstCell = wrapper.find('tbody td')

		await firstCell.trigger('click')

		expect(firstCell.classes()).toContain('table-active-cell')
		expect(wrapper.emitted('update:activeCell')?.at(-1)?.[0]).toEqual({
			rowKey: 'Ada',
			columnKey: 'name',
		})
		expect(wrapper.emitted('cell-click')?.at(-1)?.[0]).toMatchObject({
			row: rows[0],
			value: 'Ada',
			header: headers[0],
			rowIndex: 0,
			sourceIndex: 0,
			rowKey: 'Ada',
			columnKey: 'name',
		})

		expect(wrapper.vm.focusActiveCell()).toBe(true)
		expect(document.activeElement).toBe(firstCell.element)

		wrapper.vm.clearActiveCell()
		await nextTick()
		expect(wrapper.emitted('update:activeCell')?.at(-1)?.[0]).toBeNull()
		expect(wrapper.find('.table-active-cell').exists()).toBe(false)
	})

	it('activates and moves cells with clamping and column wrapping', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
			},
		})

		let context = wrapper.vm.activateCellAt(-10, 10)
		await nextTick()
		expect(context).toMatchObject({
			rowKey: 'Ada',
			columnKey: 'city',
			rowIndex: 0,
			columnIndex: 1,
		})

		context = wrapper.vm.moveActiveCell(0, 1, { wrapColumns: true })
		await nextTick()
		expect(context).toMatchObject({
			rowKey: 'Grace',
			columnKey: 'name',
			rowIndex: 1,
			columnIndex: 0,
		})

		context = wrapper.vm.moveActiveCell(0, -1, { wrapColumns: true })
		await nextTick()
		expect(context).toMatchObject({
			rowKey: 'Ada',
			columnKey: 'city',
			rowIndex: 0,
			columnIndex: 1,
		})

		context = wrapper.vm.moveActiveCell(-10, -10)
		await nextTick()
		expect(context).toMatchObject({
			rowKey: 'Ada',
			columnKey: 'name',
			rowIndex: 0,
			columnIndex: 0,
		})

		wrapper.vm.activateCellAt(99, 99)
		context = wrapper.vm.moveActiveCell(10, 1, { wrapColumns: true })
		await nextTick()
		expect(context).toMatchObject({
			rowKey: 'Katherine',
			columnKey: 'city',
			rowIndex: 2,
			columnIndex: 1,
		})

		context = wrapper.vm.activateCellAt(1, 1, { focus: true })
		await nextTick()
		expect(wrapper.vm.getActiveCellContext()).toMatchObject(context)
		expect(document.activeElement).toBe(wrapper.find('.table-active-cell').element)
	})

	it('supports a controlled active cell set after mount', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
				activeCell: null,
			},
		})

		await wrapper.setProps({
			activeCell: { rowKey: 'Grace', columnKey: 'city' },
		})

		const active = wrapper.find('.table-active-cell')
		expect(active.text()).toBe('New York')
		expect(wrapper.vm.focusActiveCell()).toBe(true)
		expect(document.activeElement).toBe(active.element)

		wrapper.vm.activateCellAt(0, 0)
		await nextTick()
		expect(wrapper.emitted('update:activeCell')?.at(-1)?.[0]).toEqual({
			rowKey: 'Ada',
			columnKey: 'name',
		})
		expect(wrapper.find('.table-active-cell').text()).toBe('New York')

		wrapper.vm.clearActiveCell()
		expect(wrapper.emitted('update:activeCell')?.at(-1)?.[0]).toBeNull()
		expect(wrapper.find('.table-active-cell').text()).toBe('New York')
	})

	it('exposes clearFilters', () => {
		const wrapper = mountTable({
			props: {
				filterable: true,
				filters: {
					name: [{ type: 'text', operator: 'contains', value: 'Ada' }],
				},
			},
		})

		wrapper.vm.clearFilters()

		expect(wrapper.emitted('update:filters')?.at(-1)?.[0]).toEqual({})
	})
})

describe('Table row context menu', () => {
	it('opens a menu and runs the item action for the clicked row', async () => {
		const action = vi.fn()
		const wrapper = mountTable({
			props: {
				selectable: false,
				rowContextMenu: [
					{ id: 'export', label: 'Export', action },
				],
			},
		})

		await wrapper.findAll('tbody tr')[0].trigger('contextmenu', {
			clientX: 40,
			clientY: 60,
		})
		await nextTick()

		const menu = document.body.querySelector('.table-row-context-menu')
		expect(menu).toBeTruthy()

		menu.querySelector('[role="menuitem"]').click()
		await nextTick()

		expect(action).toHaveBeenCalledTimes(1)
		expect(action.mock.calls[0][0].keys).toEqual(['Ada'])
		expect(action.mock.calls[0][0].rows.map((row) => row.name)).toEqual(['Ada'])
		expect(wrapper.emitted('row-context-menu-action')?.at(-1)?.[0].keys).toEqual(['Ada'])
	})

	it('runs the action against all selected rows when right-clicking inside the selection', async () => {
		const action = vi.fn()
		const wrapper = mountTable({
			props: {
				selectable: true,
				selectedKeys: ['Ada', 'Grace'],
				rowContextMenu: [
					{ id: 'export', label: 'Export', action },
				],
			},
		})

		await wrapper.findAll('tbody tr')[1].trigger('contextmenu', {
			clientX: 40,
			clientY: 60,
		})
		await nextTick()

		document.body.querySelector('.table-row-context-menu [role="menuitem"]').click()
		await nextTick()

		expect(action.mock.calls[0][0].keys).toEqual(['Ada', 'Grace'])
		expect(action.mock.calls[0][0].rows.map((row) => row.name)).toEqual(['Ada', 'Grace'])
	})

	it('replaces selection with the clicked row when right-clicking outside the selection', async () => {
		const action = vi.fn()
		const wrapper = mountTable({
			props: {
				selectable: true,
				selectedKeys: ['Ada', 'Grace'],
				rowContextMenu: [
					{ id: 'export', label: 'Export', action },
				],
			},
		})

		await wrapper.findAll('tbody tr')[2].trigger('contextmenu', {
			clientX: 40,
			clientY: 60,
		})
		await nextTick()

		expect(wrapper.emitted('update:selectedKeys')?.at(-1)?.[0]).toEqual(['Katherine'])

		document.body.querySelector('.table-row-context-menu [role="menuitem"]').click()
		await nextTick()

		expect(action.mock.calls[0][0].keys).toEqual(['Katherine'])
	})

	it('renders group header rows when groupBy is set', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
				groupBy: 'city',
			},
		})

		expect(wrapper.findAll('tbody tr.table-group-row')).toHaveLength(3)
		expect(wrapper.find('.table-group-label').text()).toBe('London')
		expect(wrapper.text()).toContain('(1)')
	})

	it('includes groupBy in query-change payloads', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
				groupBy: 'city',
			},
		})

		await nextTick()

		const latestQuery = wrapper.emitted('query-change')?.at(-1)?.[0]
		expect(latestQuery?.groupBy).toBe('city')
	})

	it('keeps a hover class on target rows while the menu is open', async () => {
		const wrapper = mountTable({
			props: {
				selectable: false,
				rowContextMenu: [
					{ id: 'export', label: 'Export', action: () => {} },
				],
			},
		})

		await wrapper.findAll('tbody tr')[0].trigger('contextmenu', {
			clientX: 40,
			clientY: 60,
		})
		await nextTick()

		expect(wrapper.findAll('tbody tr')[0].classes()).toContain('row-context-menu-active')

		document.body.querySelector('.table-row-context-menu [role="menuitem"]').click()
		await nextTick()

		expect(wrapper.findAll('tbody tr')[0].classes()).not.toContain('row-context-menu-active')
	})
})
