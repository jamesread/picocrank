import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FormLayout from './FormLayout.vue'

describe('FormLayout', () => {
	it('renders a form element with default slot content', () => {
		const wrapper = mount(FormLayout, {
			attachTo: document.body,
			slots: {
				default: '<input id="name" />',
			},
		})

		expect(wrapper.element.tagName).toBe('FORM')
		expect(wrapper.find('#name').exists()).toBe(true)
	})

	it('does not render an actions fieldset when the actions slot is empty', () => {
		const wrapper = mount(FormLayout, {
			slots: {
				default: '<input id="name" />',
			},
		})

		expect(wrapper.find('fieldset').exists()).toBe(false)
	})

	it('renders an actions fieldset when the actions slot is provided', () => {
		const wrapper = mount(FormLayout, {
			slots: {
				default: '<input id="name" />',
				actions: '<button type="submit">Save</button>',
			},
		})

		const fieldset = wrapper.find('fieldset')
		expect(fieldset.exists()).toBe(true)
		expect(fieldset.find('button[type="submit"]').exists()).toBe(true)
	})

	it('forwards submit events from the native form', async () => {
		const onSubmit = vi.fn((event) => event.preventDefault())
		const wrapper = mount(FormLayout, {
			attrs: {
				onSubmit,
			},
			slots: {
				default: '<button type="submit">Save</button>',
			},
		})

		await wrapper.find('form').trigger('submit')

		expect(onSubmit).toHaveBeenCalledTimes(1)
	})
})
