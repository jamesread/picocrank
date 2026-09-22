import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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
