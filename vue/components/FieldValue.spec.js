import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FieldValue from './FieldValue.vue'

const globalStubs = {
	HugeiconsIcon: true,
	RouterLink: {
		props: ['to'],
		template: '<a class="outline-link" :href="typeof to === \'string\' ? to : \'#\'"><slot /></a>',
	},
}

describe('FieldValue', () => {
	it('shows a read-only icon when no edit template or outline target is provided', () => {
		const wrapper = mount(FieldValue, {
			props: { modelValue: 'Yesterday' },
			global: { stubs: globalStubs },
		})

		expect(wrapper.text()).toContain('Yesterday')
		expect(wrapper.find('[aria-label="Read only"]').exists()).toBe(true)
		expect(wrapper.find('.field-value-outline').exists()).toBe(false)
	})

	it('shows an inline-edit icon and the edit template after click', async () => {
		const wrapper = mount(FieldValue, {
			props: { modelValue: 'Ada' },
			slots: {
				edit: '<input class="edit-box" :value="value" />',
			},
			global: { stubs: globalStubs },
		})

		expect(wrapper.find('[aria-label="Read only"]').exists()).toBe(false)
		expect(wrapper.find('.field-value-display.editable').exists()).toBe(true)

		await wrapper.find('.field-value-display').trigger('click')
		await nextTick()

		expect(wrapper.find('.edit-box').exists()).toBe(true)
		expect(wrapper.find('.edit-box').element.value).toBe('Ada')
	})

	it('commits the edited value from the template', async () => {
		const wrapper = mount(FieldValue, {
			props: { modelValue: 'Ada' },
			slots: {
				edit: `
					<input
						class="edit-box"
						:value="value"
						@input="update($event.target.value)"
						@keyup.enter="commit"
					/>
				`,
			},
			global: { stubs: globalStubs },
		})

		await wrapper.find('.field-value-display').trigger('click')
		await nextTick()
		const input = wrapper.find('.edit-box')
		await input.setValue('Grace')
		await input.trigger('keyup.enter')

		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Grace'])
		expect(wrapper.emitted('commit')?.[0]).toEqual(['Grace'])
		expect(wrapper.text()).toContain('Ada')
	})

	it('shows an outline-edit link when a route is provided and no edit template', () => {
		const wrapper = mount(FieldValue, {
			props: {
				modelValue: 'Website',
				to: '/customers/1/edit',
				editLabel: 'Edit customer',
			},
			global: { stubs: globalStubs },
		})

		const link = wrapper.find('.field-value-outline')
		expect(link.exists()).toBe(true)
		expect(link.attributes('aria-label')).toBe('Edit customer')
		expect(link.attributes('href')).toBe('/customers/1/edit')
		expect(wrapper.find('[aria-label="Read only"]').exists()).toBe(false)
	})
})
