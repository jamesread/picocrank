import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ContextMenu from './ContextMenu.vue'

const items = [
	{ id: 'open', label: 'Open' },
	{ divider: true },
	{ id: 'remove', label: 'Remove', danger: true },
	{ id: 'locked', label: 'Locked', disabled: true },
]

function mountMenu(props = {}, attrs = {}) {
	return mount(ContextMenu, {
		attachTo: document.body,
		props: { open: false, items, clientX: 30, clientY: 40, ...props },
		attrs,
		global: { stubs: { HugeiconsIcon: true } },
	})
}

function menu() {
	return document.body.querySelector('nav.context-menu')
}

afterEach(() => {
	document.body.innerHTML = ''
})

describe('ContextMenu', () => {
	it('renders the items at the point, named and with the given class', async () => {
		const wrapper = mountMenu({ ariaLabel: 'Entry actions' }, { class: 'entry-menu' })
		await wrapper.setProps({ open: true })
		await nextTick()
		expect(menu().getAttribute('aria-label')).toBe('Entry actions')
		expect(menu().classList.contains('entry-menu')).toBe(true)
		expect([...menu().querySelectorAll('[role="menuitem"]')].map(item => item.textContent.trim()))
			.toEqual(['Open', 'Remove', 'Locked'])
		expect(menu().querySelectorAll('[role="separator"]')).toHaveLength(1)
		expect(menu().querySelector('.bad').textContent.trim()).toBe('Remove')
	})

	it('emits the picked item and closes', async () => {
		const wrapper = mountMenu({ open: true })
		await nextTick()
		menu().querySelectorAll('[role="menuitem"]')[1].click()
		expect(wrapper.emitted('select')[0][0].id).toBe('remove')
		expect(wrapper.emitted('update:open').at(-1)).toEqual([false])
	})

	it('ignores disabled items', async () => {
		const wrapper = mountMenu({ open: true })
		await nextTick()
		menu().querySelectorAll('[role="menuitem"]')[2].click()
		expect(wrapper.emitted('select')).toBeUndefined()
	})

	it('closes on Escape and when the page scrolls', async () => {
		const wrapper = mountMenu({ open: true })
		await nextTick()
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
		expect(wrapper.emitted('cancel')).toHaveLength(1)

		await wrapper.setProps({ open: false })
		await wrapper.setProps({ open: true })
		await nextTick()
		window.dispatchEvent(new Event('scroll'))
		expect(wrapper.emitted('cancel')).toHaveLength(2)
	})

	it('adds the count to labels when acting on several things', async () => {
		mountMenu({ open: true, targetCount: 3 })
		await nextTick()
		expect(menu().querySelector('[role="menuitem"]').textContent.trim()).toBe('Open (3)')
	})
})
