import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LoadingArea from './LoadingArea.vue'

const globalStubs = {
	HugeiconsIcon: true,
}

describe('LoadingArea', () => {
	it('shows the placeholder by default', () => {
		const wrapper = mount(LoadingArea, {
			global: { stubs: globalStubs },
		})

		expect(wrapper.find('[role="status"]').exists()).toBe(true)
		expect(wrapper.text()).toContain('Loading…')
		expect(wrapper.attributes('aria-busy')).toBe('true')
	})

	it('renders default-slot content when not loading', async () => {
		const wrapper = mount(LoadingArea, {
			props: {
				loading: false,
			},
			slots: {
				default: '<p class="ready">Ready</p>',
			},
			global: { stubs: globalStubs },
		})

		await nextTick()

		expect(wrapper.find('[role="status"]').exists()).toBe(false)
		expect(wrapper.find('.ready').text()).toBe('Ready')
		expect(wrapper.attributes('aria-busy')).toBe('false')
	})

	it('keeps content mounted in overlay mode while loading', async () => {
		const wrapper = mount(LoadingArea, {
			props: {
				loading: true,
				overlay: true,
			},
			slots: {
				default: '<p class="ready">Ready</p>',
			},
			global: { stubs: globalStubs },
		})

		await nextTick()

		expect(wrapper.find('[role="status"]').exists()).toBe(true)
		expect(wrapper.find('.ready').exists()).toBe(true)
		expect(wrapper.classes()).toContain('is-overlay')
	})

	it('supports a custom placeholder slot', () => {
		const wrapper = mount(LoadingArea, {
			props: {
				loading: true,
			},
			slots: {
				placeholder: '<span class="custom">Please wait</span>',
			},
			global: { stubs: globalStubs },
		})

		expect(wrapper.find('.custom').text()).toBe('Please wait')
		expect(wrapper.text()).not.toContain('Loading…')
	})
})
