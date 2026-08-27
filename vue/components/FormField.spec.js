import { describe, expect, it } from 'vitest'
import { mountFormField, flushControlState } from '../test/formTestUtils.js'

describe('FormField', () => {
	describe('labels and structure', () => {
		it('renders a label associated with the control via for/id', () => {
			const wrapper = mountFormField({
				props: {
					label: 'Email',
					for: 'email',
				},
				slot: '<input id="email" type="email" />',
			})

			const label = wrapper.find('label[for="email"]')
			expect(label.exists()).toBe(true)
			expect(label.text()).toContain('Email')
			expect(wrapper.find('#email').exists()).toBe(true)
		})

		it('renders a fake label when component-has-label is set', () => {
			const wrapper = mountFormField({
				props: {
					label: 'Role',
					componentHasLabel: true,
				},
				slot: '<div role="radiogroup">Options</div>',
			})

			expect(wrapper.find('label').exists()).toBe(false)
			expect(wrapper.find('.fake-label').text()).toContain('Role')
		})

		it('skips the label when label-skip is set', () => {
			const wrapper = mountFormField({
				props: {
					label: 'Username',
					labelSkip: true,
					for: 'username',
				},
				slot: '<input id="username" aria-label="Username" />',
			})

			expect(wrapper.find('label').exists()).toBe(false)
			expect(wrapper.find('.fake-label').exists()).toBe(false)
			expect(wrapper.find('.form-field-label-skip').exists()).toBe(true)
		})

		it('renders description below the control by default', () => {
			const wrapper = mountFormField({
				props: {
					description: 'Helpful hint text.',
				},
			})

			const description = wrapper.find('.form-field-description')
			expect(description.exists()).toBe(true)
			expect(description.text()).toBe('Helpful hint text.')
		})

		it('renders description above the control when description-above is set', () => {
			const wrapper = mountFormField({
				props: {
					description: 'Shown first.',
					descriptionAbove: true,
				},
			})

			const metaBlocks = wrapper.findAll('.form-field-meta')
			expect(metaBlocks).toHaveLength(1)
			expect(metaBlocks[0].find('.form-field-description').text()).toBe('Shown first.')
		})

		it('renders a docs link when docs-url is provided', () => {
			const wrapper = mountFormField({
				props: {
					docsUrl: 'https://example.com/docs',
					docsUrlTitle: 'Read the docs',
				},
			})

			const link = wrapper.find('.form-field-docs-link')
			expect(link.attributes('href')).toBe('https://example.com/docs')
			expect(link.attributes('target')).toBe('_blank')
			expect(link.attributes('rel')).toBe('noopener noreferrer')
			expect(link.text()).toBe('Read the docs')
		})
	})

	describe('required indicator', () => {
		it('shows a required asterisk when label-required is set', () => {
			const wrapper = mountFormField({
				props: {
					labelRequired: true,
				},
			})

			const marker = wrapper.find('.form-field-required')
			expect(marker.exists()).toBe(true)
			expect(marker.attributes('aria-hidden')).toBe('true')
			expect(marker.text()).toBe('*')
		})

		it('shows a required asterisk when the slotted control is required', async () => {
			const wrapper = mountFormField({
				slot: '<input id="test-input" required />',
			})

			await flushControlState()

			expect(wrapper.find('.form-field-required').exists()).toBe(true)
		})
	})

	describe('error prop validation', () => {
		it('shows a NotificationBlock when error is set', async () => {
			const wrapper = mountFormField({
				props: {
					error: 'This field is required.',
				},
			})

			await flushControlState()

			const errorBlock = wrapper.find('.form-field-error')
			expect(errorBlock.exists()).toBe(true)
			expect(errorBlock.attributes('role')).toBe('alert')
			expect(errorBlock.text()).toContain('This field is required.')
		})

		it('does not show an error block when error is empty', async () => {
			const wrapper = mountFormField({
				props: {
					error: '',
				},
			})

			await flushControlState()

			expect(wrapper.find('.form-field-error').exists()).toBe(false)
		})

		it('marks the native control invalid when error is set', async () => {
			const wrapper = mountFormField({
				props: {
					error: 'Invalid value.',
				},
			})

			await flushControlState()

			const input = wrapper.find('#test-input').element
			expect(input.getAttribute('aria-invalid')).toBe('true')
			expect(input.classList.contains('field-invalid')).toBe(true)
			expect(input.validationMessage).toBe('Invalid value.')
			expect(input.validity.customError).toBe(true)
		})

		it('links the control to the error via aria-describedby', async () => {
			const wrapper = mountFormField({
				props: {
					error: 'Invalid value.',
				},
			})

			await flushControlState()

			const input = wrapper.find('#test-input').element
			const errorId = wrapper.find('.form-field-error').attributes('id')
			expect(input.getAttribute('aria-describedby')).toContain(errorId)
		})

		it('clears native invalid state when error is removed', async () => {
			const wrapper = mountFormField({
				props: {
					error: 'Invalid value.',
				},
			})

			await flushControlState()
			await wrapper.setProps({ error: '' })
			await flushControlState()

			const input = wrapper.find('#test-input').element
			expect(input.hasAttribute('aria-invalid')).toBe(false)
			expect(input.classList.contains('field-invalid')).toBe(false)
			expect(input.validationMessage).toBe('')
		})

		it('emits update:error when the user edits a field with an external error', async () => {
			const wrapper = mountFormField({
				props: {
					error: 'Server rejected this value.',
				},
			})

			await flushControlState()
			await wrapper.find('#test-input').setValue('corrected')
			await flushControlState()

			expect(wrapper.emitted('update:error')).toContainEqual([''])
		})

		it('does not emit update:error on input when validate() supplies the error', async () => {
			const wrapper = mountFormField({
				props: {
					validate: () => 'Always invalid.',
					validateDeps: [],
				},
			})

			await flushControlState()
			await wrapper.find('#test-input').setValue('anything')
			await flushControlState()

			expect(wrapper.emitted('update:error')).toBeUndefined()
		})
	})

	describe('validate function', () => {
		it('shows an error from the validate callback', async () => {
			const wrapper = mountFormField({
				props: {
					validate: () => 'Pick at least one option.',
					validateDeps: [],
				},
			})

			await flushControlState()

			expect(wrapper.find('.form-field-error').text()).toContain('Pick at least one option.')
		})

		it('re-runs validate when validateDeps change', async () => {
			const state = { value: 'a' }
			const wrapper = mountFormField({
				props: {
					validateDeps: [state.value],
					validate: () => (state.value === 'a' ? 'First value is invalid.' : ''),
				},
			})

			await flushControlState()
			expect(wrapper.find('.form-field-error').exists()).toBe(true)

			state.value = 'b'
			await wrapper.setProps({ validateDeps: ['b'] })
			await flushControlState()
			expect(wrapper.find('.form-field-error').exists()).toBe(false)
		})

		it('prefers the error prop over validate()', async () => {
			const wrapper = mountFormField({
				props: {
					error: 'External error.',
					validate: () => 'Validation error.',
					validateDeps: [],
				},
			})

			await flushControlState()

			expect(wrapper.find('.form-field-error').text()).toContain('External error.')
			expect(wrapper.find('.form-field-error').text()).not.toContain('Validation error.')
		})

		it('ignores non-string validate results', async () => {
			const wrapper = mountFormField({
				props: {
					validate: () => false,
					validateDeps: [],
				},
			})

			await flushControlState()

			expect(wrapper.find('.form-field-error').exists()).toBe(false)
		})
	})

	describe('component-has-label controls', () => {
		it('does not apply native validity to composite controls', async () => {
			const wrapper = mountFormField({
				props: {
					componentHasLabel: true,
					error: 'Group error.',
				},
				slot: '<input id="test-input" />',
			})

			await flushControlState()

			const input = wrapper.find('#test-input').element
			expect(input.validationMessage).toBe('')
			expect(input.hasAttribute('aria-invalid')).toBe(false)
		})
	})

	describe('lifecycle', () => {
		it('clears native validity on unmount', async () => {
			const wrapper = mountFormField({
				props: {
					error: 'Invalid value.',
				},
			})

			await flushControlState()

			const input = wrapper.find('#test-input').element
			expect(input.validationMessage).toBe('Invalid value.')

			wrapper.unmount()

			expect(input.validationMessage).toBe('')
			expect(input.hasAttribute('aria-invalid')).toBe(false)
		})
	})

	describe('disabled state', () => {
		it('applies disabled styling class to the label', () => {
			const wrapper = mountFormField({
				props: {
					disabled: true,
				},
			})

			expect(wrapper.find('label.disabled').exists()).toBe(true)
		})
	})
})

describe('FormField htmlFor alias', () => {
		it('accepts htmlFor as an alias for for', async () => {
			const wrapper = mountFormField({
				props: {
					label: 'Name',
					htmlFor: 'name-field',
					for: '',
				},
				slot: '<input id="name-field" />',
			})

		expect(wrapper.find('label[for="name-field"]').exists()).toBe(true)

		await wrapper.setProps({ error: 'Required.' })
		await flushControlState()

		expect(wrapper.find('#name-field').element.getAttribute('aria-invalid')).toBe('true')
	})
})
