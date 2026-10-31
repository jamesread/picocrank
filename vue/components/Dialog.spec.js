import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Dialog from './Dialog.vue'

// jsdom's <dialog> lacks showModal/close; give it the parts Dialog relies on.
let originals

beforeEach(() => {
	const proto = HTMLDialogElement.prototype
	originals = { showModal: proto.showModal, show: proto.show, close: proto.close }
	proto.showModal = function showModal() {
		this.setAttribute('open', '')
		this.dataset.openedAs = 'modal'
	}
	proto.show = function show() {
		this.setAttribute('open', '')
		this.dataset.openedAs = 'non-modal'
	}
	proto.close = function close(returnValue) {
		if (!this.hasAttribute('open')) return
		if (returnValue !== undefined) this.returnValue = returnValue
		this.removeAttribute('open')
		this.dispatchEvent(new Event('close'))
	}
})

afterEach(() => {
	Object.assign(HTMLDialogElement.prototype, originals)
	document.body.innerHTML = ''
})

function mountDialog(props = {}, slots = {}) {
	return mount(Dialog, {
		attachTo: document.body,
		props: { title: 'Delete rows', ...props },
		slots: {
			default: '<p class="body-text">Delete 3 rows?</p>',
			...slots,
		},
		global: { stubs: { HugeiconsIcon: true } },
	})
}

describe('Dialog', () => {
	it('opens from v-model:open and labels itself with the title', async () => {
		const wrapper = mountDialog({ open: false })
		const dialog = wrapper.find('dialog')
		expect(dialog.attributes('open')).toBeUndefined()

		await wrapper.setProps({ open: true })
		expect(dialog.attributes('open')).toBeDefined()
		expect(wrapper.emitted('open')).toHaveLength(1)

		const titleId = wrapper.find('.dialog-title').attributes('id')
		expect(dialog.attributes('aria-labelledby')).toBe(titleId)
		expect(wrapper.find('.dialog-title').text()).toBe('Delete rows')
	})

	it('closes from the close button and reports update:open false', async () => {
		const wrapper = mountDialog({ open: true })
		await nextTick()

		await wrapper.find('.dialog-close').trigger('click')
		expect(wrapper.find('dialog').attributes('open')).toBeUndefined()
		expect(wrapper.emitted('update:open')).toEqual([[false]])
		expect(wrapper.emitted('close')).toHaveLength(1)
	})

	it('closes on a backdrop click but not on a click inside the panel', async () => {
		const wrapper = mountDialog({ open: true })
		await nextTick()

		await wrapper.find('.body-text').trigger('click')
		expect(wrapper.find('dialog').attributes('open')).toBeDefined()

		await wrapper.find('dialog').trigger('click')
		expect(wrapper.find('dialog').attributes('open')).toBeUndefined()
	})

	it('ignores backdrop clicks when closeOnBackdrop is false', async () => {
		const wrapper = mountDialog({ open: true, closeOnBackdrop: false })
		await nextTick()

		await wrapper.find('dialog').trigger('click')
		expect(wrapper.find('dialog').attributes('open')).toBeDefined()
	})

	it('renders actions in an action row with a close helper', async () => {
		const wrapper = mountDialog({ open: true }, {
			actions: `<template #actions="{ close }">
				<button type="button" class="cancel" @click="close('cancel')">Cancel</button>
			</template>`,
		})
		await nextTick()

		expect(wrapper.find('.dialog-actions').classes()).toContain('action-row')
		await wrapper.find('.cancel').trigger('click')
		expect(wrapper.emitted('close')).toEqual([['cancel']])
	})

	it('applies size and narrow layout classes', () => {
		const wrapper = mountDialog({ size: 'large', narrowLayout: 'fullscreen' })
		const classes = wrapper.find('dialog').classes()
		expect(classes).toContain('dialog-size-large')
		expect(classes).toContain('dialog-narrow-fullscreen')
	})

	it('uses ariaLabel when there is no title', () => {
		const wrapper = mountDialog({ title: '', ariaLabel: 'Pick a colour' })
		const dialog = wrapper.find('dialog')
		expect(dialog.attributes('aria-label')).toBe('Pick a colour')
		expect(dialog.attributes('aria-labelledby')).toBeUndefined()
	})

	it('opens non-modal with show() and ignores backdrop clicks', async () => {
		const wrapper = mountDialog({ open: true, modal: false })
		await nextTick()

		const dialog = wrapper.find('dialog')
		expect(dialog.element.dataset.openedAs).toBe('non-modal')

		await dialog.trigger('click')
		expect(dialog.attributes('open')).toBeDefined()
	})
})
