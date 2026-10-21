import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PageToolbar from './PageToolbar.vue'

describe('PageToolbar', () => {
	it('renders default-slot content in a toolbar', () => {
		const wrapper = mount(PageToolbar, {
			slots: {
				default: '<button type="button">Refresh</button>',
			},
		})

		expect(wrapper.attributes('role')).toBe('toolbar')
		expect(wrapper.find('button').text()).toBe('Refresh')
		expect(wrapper.attributes('aria-label')).toBeUndefined()
	})

	it('sets aria-label from the label prop', () => {
		const wrapper = mount(PageToolbar, {
			props: { label: 'Projects' },
		})

		expect(wrapper.attributes('aria-label')).toBe('Projects')
	})
})
