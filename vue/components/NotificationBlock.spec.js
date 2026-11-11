import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NotificationBlock from './NotificationBlock.vue'

const routerLinkStub = {
	name: 'RouterLink',
	template: '<a><slot /></a>',
}

function mountBlock(props = {}, options = {}) {
	return mount(NotificationBlock, {
		props,
		global: {
			stubs: {
				RouterLink: routerLinkStub,
				HugeiconsIcon: true,
			},
		},
		...options,
	})
}

describe('NotificationBlock', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('shows a copy control for critical, error, and bad types', () => {
		for (const type of ['critical', 'error', 'bad']) {
			const wrapper = mountBlock({ type, message: 'Something failed.' })
			expect(wrapper.find('.notification-copy').exists()).toBe(true)
			wrapper.unmount()
		}
	})

	it('does not show a copy control for non-critical types', () => {
		for (const type of ['info', 'note', 'success', 'warning', 'severe', 'old']) {
			const wrapper = mountBlock({ type, message: 'Status update.' })
			expect(wrapper.find('.notification-copy').exists()).toBe(false)
			wrapper.unmount()
		}
	})

	it('copies the body text to the clipboard', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', {
			clipboard: { writeText },
		})

		const wrapper = mountBlock({
			type: 'critical',
			message: 'Database unreachable.',
		})

		await wrapper.find('.notification-copy').trigger('click')

		expect(writeText).toHaveBeenCalledWith('Database unreachable.')
	})

	it('does not dismiss when the copy control is clicked', async () => {
		const wrapper = mountBlock({
			type: 'error',
			message: 'Boom.',
			dismissible: true,
		})

		await wrapper.find('.notification-copy').trigger('click')

		expect(wrapper.emitted('dismiss')).toBeUndefined()
	})

	it('shows a dismiss button only when dismissible', () => {
		const plain = mountBlock({ message: 'Status update.' })
		expect(plain.find('.notification-dismiss').exists()).toBe(false)

		const dismissible = mountBlock({ message: 'Status update.', dismissible: true })
		expect(dismissible.find('.notification-dismiss').attributes('aria-label')).toBe('Dismiss')
	})

	it('puts the dismiss button after the copy button', () => {
		const wrapper = mountBlock({ type: 'critical', message: 'Boom.', dismissible: true })
		const classes = wrapper.findAll('button').map((button) => button.classes())

		expect(classes).toHaveLength(2)
		expect(classes[0]).toContain('notification-copy')
		expect(classes[1]).toContain('notification-dismiss')
	})

	it('emits dismiss when the dismiss button is clicked, without a click event', async () => {
		const wrapper = mountBlock({ message: 'Status update.', dismissible: true })

		await wrapper.find('.notification-dismiss').trigger('click')

		expect(wrapper.emitted('dismiss')).toHaveLength(1)
		expect(wrapper.emitted('click')).toBeUndefined()
	})

	it('still dismisses when the body is clicked', async () => {
		const wrapper = mountBlock({ message: 'Status update.', dismissible: true })

		await wrapper.trigger('click')

		expect(wrapper.emitted('click')).toHaveLength(1)
		expect(wrapper.emitted('dismiss')).toHaveLength(1)
		expect(wrapper.classes()).toContain('clickable')
	})

	it('does not dismiss when a link in the body is followed', async () => {
		const wrapper = mountBlock({
			dismissible: true,
			linkLabel: 'Release notes',
			linkHref: '#notes',
		})

		await wrapper.find('.notification-body a').trigger('click')

		expect(wrapper.emitted('dismiss')).toBeUndefined()
	})
})
