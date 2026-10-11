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
})
