import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NotificationPopup from './NotificationPopup.vue'

function mountPopup(popup = {}) {
	return mount(NotificationPopup, {
		props: {
			popup: { id: 'p1', message: 'Saved.', ...popup },
		},
		global: {
			stubs: {
				RouterLink: { name: 'RouterLink', template: '<a class="notification-popup-link"><slot /></a>' },
				HugeiconsIcon: true,
			},
		},
	})
}

describe('NotificationPopup', () => {
	it('dismisses when the popup body is clicked', async () => {
		const wrapper = mountPopup()

		await wrapper.find('.notification-body').trigger('click')

		expect(wrapper.emitted('dismiss')).toEqual([['p1']])
	})

	it('dismisses once from the close button', async () => {
		const wrapper = mountPopup()

		await wrapper.find('.notification-popup-dismiss').trigger('click')

		expect(wrapper.emitted('dismiss')).toEqual([['p1']])
	})

	it('dismisses once when its link is followed', async () => {
		const wrapper = mountPopup({ linkTo: { name: 'Welcome' }, linkLabel: 'Open' })

		await wrapper.find('.notification-popup-link').trigger('click')

		expect(wrapper.emitted('dismiss')).toEqual([['p1']])
	})

	it('does not dismiss when the copy control is clicked', async () => {
		const wrapper = mountPopup({ class: 'critical' })

		await wrapper.find('.notification-copy').trigger('click')

		expect(wrapper.emitted('dismiss')).toBeUndefined()
	})
})
