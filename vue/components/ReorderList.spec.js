import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'
import ReorderList from './ReorderList.vue'
import ReorderListExample from '../examples/ReorderListExample.vue'

const globalStubs = {
	HugeiconsIcon: true,
}

const rows = [
	{ id: 'a', title: 'Alpha' },
	{ id: 'b', title: 'Beta' },
	{ id: 'c', title: 'Gamma' },
]

function mountList(props = {}, slots = {}) {
	const wrapper = mount(ReorderList, {
		props: {
			modelValue: rows.map((row) => ({ ...row })),
			ariaLabel: 'Queue',
			...props,
		},
		slots: {
			item: ({ item }) => h('span', { class: 'row-label' }, item.title),
			...slots,
		},
		global: { stubs: globalStubs },
	})
	return wrapper
}

function dataTransfer() {
	return {
		effectAllowed: '',
		dropEffect: '',
		setData: () => {},
	}
}

describe('ReorderList', () => {
	it('renders row slot content in model order', () => {
		const wrapper = mountList()
		const labels = wrapper.findAll('.row-label').map((node) => node.text())

		expect(labels).toEqual(['Alpha', 'Beta', 'Gamma'])
		expect(wrapper.attributes('aria-label')).toBe('Queue')
	})

	it('moves a row down and up with the buttons', async () => {
		const wrapper = mountList({ showMoveButtons: true })

		await wrapper.find('[aria-label="Move Alpha down"]').trigger('click')
		expect(wrapper.emitted('update:modelValue')[0][0].map((item) => item.id)).toEqual(['b', 'a', 'c'])
		expect(wrapper.emitted('reorder')[0][0]).toMatchObject({ fromIndex: 0, toIndex: 1 })

		await wrapper.setProps({ modelValue: wrapper.emitted('update:modelValue')[0][0] })
		await wrapper.find('[aria-label="Move Alpha up"]').trigger('click')
		const emitted = wrapper.emitted('update:modelValue')
		expect(emitted[emitted.length - 1][0].map((item) => item.id)).toEqual(['a', 'b', 'c'])
	})

	it('disables moves past the ends of the list', () => {
		const wrapper = mountList({ showMoveButtons: true })

		expect(wrapper.find('[aria-label="Move Alpha up"]').attributes('disabled')).toBeDefined()
		expect(wrapper.find('[aria-label="Move Gamma down"]').attributes('disabled')).toBeDefined()
		expect(wrapper.find('[aria-label="Move Beta up"]').attributes('disabled')).toBeUndefined()
	})

	function layoutRows(wrapper) {
		const list = wrapper.element?.classList?.contains('reorder-list')
			? wrapper
			: wrapper.get('.reorder-list')
		const rowEls = [...list.element.querySelectorAll(':scope > li.reorder-list-row')]
		rowEls.forEach((rowEl, index) => {
			const top = index * 50
			rowEl.getBoundingClientRect = () => ({
				top,
				bottom: top + 40,
				height: 40,
				left: 0,
				right: 200,
				width: 200,
				x: 0,
				y: top,
				toJSON() { return {} },
			})
		})
		list.element.getBoundingClientRect = () => ({
			top: 0,
			bottom: rowEls.length * 50,
			height: rowEls.length * 50,
			left: 0,
			right: 200,
			width: 200,
			x: 0,
			y: 0,
			toJSON() { return {} },
		})
		return list
	}

	it('shows a separator in the gap between rows and inserts there', async () => {
		const wrapper = mountList()
		const list = layoutRows(wrapper)
		const handles = wrapper.findAll('.reorder-list-handle')

		await handles[0].trigger('dragstart', { dataTransfer: dataTransfer() })
		expect(wrapper.find('.reorder-list-row').classes()).toContain('is-dragging')

		// Lower half of Beta: the gap between Beta and Gamma.
		await list.trigger('dragover', { clientY: 80, dataTransfer: dataTransfer() })
		const separator = wrapper.get('.reorder-list-separator')
		expect(separator.attributes('data-drop-gap')).toBe('2')
		expect(wrapper.find('.is-drag-over').exists()).toBe(false)

		await list.trigger('drop', { clientY: 80 })
		expect(wrapper.emitted('update:modelValue')[0][0].map((item) => item.id)).toEqual(['b', 'a', 'c'])
		expect(wrapper.emitted('reorder')[0][0]).toMatchObject({ fromIndex: 0, toIndex: 1 })
		expect(wrapper.find('.reorder-list-separator').exists()).toBe(false)
		expect(wrapper.find('.reorder-list-row.is-dragging').exists()).toBe(false)
	})

	it('places the separator after the last row when the pointer is below it', async () => {
		const wrapper = mountList()
		const list = layoutRows(wrapper)

		await wrapper.findAll('.reorder-list-handle')[0].trigger('dragstart', { dataTransfer: dataTransfer() })
		await list.trigger('dragover', { clientY: 140, dataTransfer: dataTransfer() })

		expect(wrapper.get('.reorder-list-separator').attributes('data-drop-gap')).toBe('3')
		await list.trigger('drop', { clientY: 140 })
		expect(wrapper.emitted('update:modelValue')[0][0].map((item) => item.id)).toEqual(['b', 'c', 'a'])
	})

	it('places the separator before the first row when dragging upward', async () => {
		const wrapper = mountList()
		const list = layoutRows(wrapper)

		await wrapper.findAll('.reorder-list-handle')[2].trigger('dragstart', { dataTransfer: dataTransfer() })
		await list.trigger('dragover', { clientY: 10, dataTransfer: dataTransfer() })

		expect(wrapper.get('.reorder-list-separator').attributes('data-drop-gap')).toBe('0')
		await list.trigger('drop', { clientY: 10 })
		expect(wrapper.emitted('update:modelValue')[0][0].map((item) => item.id)).toEqual(['c', 'a', 'b'])
	})

	it('hides the separator when the gap would not move the row', async () => {
		const wrapper = mountList()
		const list = layoutRows(wrapper)

		await wrapper.findAll('.reorder-list-handle')[0].trigger('dragstart', { dataTransfer: dataTransfer() })
		await list.trigger('dragover', { clientY: 30, dataTransfer: dataTransfer() })

		expect(wrapper.find('.reorder-list-separator').exists()).toBe(false)
		await list.trigger('drop', { clientY: 30 })
		expect(wrapper.emitted('update:modelValue')).toBeUndefined()
	})

	it('does not reorder when disabled', async () => {
		const wrapper = mountList({ disabled: true })

		await wrapper.findAll('.reorder-list-handle')[0].trigger('dragstart', { dataTransfer: dataTransfer() })
		await wrapper.findAll('.reorder-list-row')[2].trigger('drop')

		expect(wrapper.emitted('update:modelValue')).toBeUndefined()
		expect(wrapper.classes()).toContain('is-disabled')
	})

	it('moves with the arrow keys when move buttons are hidden', async () => {
		const wrapper = mountList()
		const handle = wrapper.findAll('.reorder-list-handle')[0]

		expect(handle.attributes('tabindex')).toBe('0')
		await handle.trigger('keydown', { key: 'ArrowDown' })
		await nextTick()

		expect(wrapper.emitted('update:modelValue')[0][0].map((item) => item.id)).toEqual(['b', 'a', 'c'])
	})

	it('renders the empty slot', () => {
		const wrapper = mountList(
			{ modelValue: [] },
			{ empty: () => h('span', { class: 'empty' }, 'No rows') },
		)

		expect(wrapper.find('.empty').text()).toBe('No rows')
		expect(wrapper.find('.reorder-list-row').exists()).toBe(false)
	})

	it('hides move buttons and drag handles independently', () => {
		const buttonsOnly = mountList({ showMoveButtons: true, showDragHandles: false })
		expect(buttonsOnly.find('.reorder-list-handle').exists()).toBe(false)
		expect(buttonsOnly.find('.reorder-list-move').exists()).toBe(true)

		const handlesOnly = mountList()
		expect(handlesOnly.find('.reorder-list-move').exists()).toBe(false)
		expect(handlesOnly.find('.reorder-list-handle').exists()).toBe(true)

		const neither = mountList({ showDragHandles: false })
		expect(neither.find('.reorder-list-controls').exists()).toBe(false)
	})

	it('drags from the whole row when dragWholeRow is enabled', async () => {
		const wrapper = mountList({ dragWholeRow: true, showDragHandles: true })
		const list = layoutRows(wrapper)

		expect(wrapper.find('.reorder-list-handle').exists()).toBe(false)
		expect(wrapper.find('.reorder-list-row.is-drag-whole-row').exists()).toBe(true)

		await wrapper.findAll('.reorder-list-row')[0].trigger('dragstart', { dataTransfer: dataTransfer() })
		await list.trigger('dragover', { clientY: 80, dataTransfer: dataTransfer() })
		await list.trigger('drop', { clientY: 80 })

		expect(wrapper.emitted('update:modelValue')[0][0].map((item) => item.id)).toEqual(['b', 'a', 'c'])
	})

	it('does not start a whole-row drag from move buttons', async () => {
		const wrapper = mountList({ dragWholeRow: true, showMoveButtons: true })
		await wrapper.find('[aria-label="Move Alpha down"]').trigger('dragstart', { dataTransfer: dataTransfer() })
		expect(wrapper.find('.reorder-list-row.is-dragging').exists()).toBe(false)
	})

	it('does not show drop indicators on nested lists while dragging the parent', async () => {
		const groups = ref([
			{
				id: 'g1',
				title: 'Group 1',
				children: [{ id: 'c1', label: 'Step 1' }, { id: 'c2', label: 'Step 2' }],
			},
			{
				id: 'g2',
				title: 'Group 2',
				children: [{ id: 'c3', label: 'Step 3' }],
			},
		])
		const wrapper = mount({
			components: { ReorderList },
			setup() {
				return { groups }
			},
			template: `
				<ReorderList v-model="groups" item-key="id" aria-label="Outer">
					<template #item="{ item }">
						<div class="nested-slot">
							<strong>{{ item.title }}</strong>
							<ReorderList
								v-model="item.children"
								item-key="id"
								aria-label="Inner steps"
							/>
						</div>
					</template>
				</ReorderList>
			`,
			global: { stubs: globalStubs },
		})

		const lists = wrapper.findAll('.reorder-list')
		const outer = lists[0]
		const innerLists = lists.slice(1)

		layoutRows(outer)
		await outer.find('.reorder-list-handle').trigger('dragstart', { dataTransfer: dataTransfer() })
		await innerLists[0].trigger('dragover', { clientY: 120, dataTransfer: dataTransfer() })

		expect(innerLists[0].find('.reorder-list-separator').exists()).toBe(false)
		expect(innerLists[1].find('.reorder-list-separator').exists()).toBe(false)
	})

	it('uses a custom item key function', async () => {
		const wrapper = mountList({
			modelValue: [{ slug: 'one' }, { slug: 'two' }],
			itemKey: (item) => item.slug,
			itemLabel: (item) => item.slug,
			showMoveButtons: true,
		}, {
			item: ({ item }) => h('span', { class: 'row-label' }, item.slug),
		})

		await wrapper.find('[aria-label="Move one down"]').trigger('click')
		expect(wrapper.emitted('update:modelValue')[0][0].map((item) => item.slug)).toEqual(['two', 'one'])
	})
})

describe('ReorderList example', () => {
	it('toggles move buttons and drag handles from the section toolbar', async () => {
		const wrapper = mount(ReorderListExample, {
			global: { stubs: globalStubs },
		})

		const checklist = wrapper.findAll('section').find((section) => (
			section.find('.reorder-example-toggle').exists()
		))
		const moveButtons = checklist.get('input[type="checkbox"]')
		const dragHandles = checklist.findAll('input[type="checkbox"]')[1]

		expect(checklist.find('.reorder-list-move').exists()).toBe(false)
		expect(checklist.find('.reorder-list-handle').exists()).toBe(true)

		await moveButtons.setValue(true)
		expect(checklist.find('.reorder-list-move').exists()).toBe(true)
		expect(checklist.find('.reorder-list-handle').exists()).toBe(true)

		await dragHandles.setValue(false)
		expect(checklist.find('.reorder-list-handle').exists()).toBe(false)
		expect(checklist.find('.reorder-list-move').exists()).toBe(true)

		await moveButtons.setValue(false)
		expect(checklist.find('.reorder-list-controls').exists()).toBe(false)

		await dragHandles.setValue(true)
		await moveButtons.setValue(false)
		expect(checklist.find('.reorder-list-move').exists()).toBe(false)
		expect(checklist.find('.reorder-list-handle').exists()).toBe(true)
	})
})
