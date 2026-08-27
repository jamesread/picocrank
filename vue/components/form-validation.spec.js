import { describe, expect, it } from 'vitest'
import {
	flushControlState,
	MIN_COMMENTS_LENGTH,
	mountLoginValidationForm,
	mountValidationForm,
} from '../test/formTestUtils.js'

describe('form validation integration', () => {
	it('blocks submit and surfaces native required validation for empty email', async () => {
		const { wrapper, submitted } = mountValidationForm()

		await wrapper.find('button[type="submit"]').trigger('click')
		await flushControlState()

		expect(submitted.value).toBe(false)
		expect(wrapper.find('#email').element.validationMessage).not.toBe('')
	})

	it('shows computed email format errors as the user types', async () => {
		const { wrapper } = mountValidationForm()

		await wrapper.find('#email').setValue('not-an-email')
		await flushControlState()

		expect(wrapper.find('#email').element.getAttribute('aria-invalid')).toBe('true')
		expect(wrapper.text()).toContain('Enter a valid email address.')
	})

	it('clears email errors when a valid address is entered', async () => {
		const { wrapper } = mountValidationForm()

		await wrapper.find('#email').setValue('not-an-email')
		await flushControlState()
		await wrapper.find('#email').setValue('user@example.com')
		await flushControlState()

		expect(wrapper.find('#email').element.hasAttribute('aria-invalid')).toBe(false)
		expect(wrapper.findAll('.form-field-error')).toHaveLength(0)
	})

	it('shows comments length validation only when comments are non-empty', async () => {
		const { wrapper } = mountValidationForm()

		await wrapper.find('#email').setValue('user@example.com')
		await wrapper.find('#comments').setValue('Too short')
		await flushControlState()

		expect(wrapper.text()).toContain(`Comments must be at least ${MIN_COMMENTS_LENGTH} characters.`)
	})

	it('allows submit when email is valid and comments are empty', async () => {
		const { wrapper, submitted } = mountValidationForm()

		await wrapper.find('#email').setValue('user@example.com')
		await wrapper.find('button[type="submit"]').trigger('click')
		await flushControlState()

		expect(submitted.value).toBe(true)
	})

	it('blocks submit for conflicting accessibility selections via validate()', async () => {
		const { wrapper, submitted, formData } = mountValidationForm()

		await wrapper.find('#email').setValue('user@example.com')
		formData.value.accessibility = ['high-contrast', 'low-contrast']
		await flushControlState()

		await wrapper.find('button[type="submit"]').trigger('click')
		await flushControlState()

		expect(submitted.value).toBe(false)
		expect(wrapper.text()).toContain('High contrast and low contrast UI cannot both be selected.')
	})

	it('submits when accessibility selections are compatible', async () => {
		const { wrapper, submitted, formData } = mountValidationForm()

		await wrapper.find('#email').setValue('user@example.com')
		formData.value.accessibility = ['high-contrast']
		await flushControlState()

		await wrapper.find('button[type="submit"]').trigger('click')
		await flushControlState()

		expect(submitted.value).toBe(true)
	})
})

describe('Login-style server validation', () => {
	it('maps password errors to the password field', async () => {
		const { wrapper } = mountLoginValidationForm()

		wrapper.vm.applyServerErrors({ password: 'Incorrect password.' })
		await flushControlState()

		expect(wrapper.find('#password').element.getAttribute('aria-invalid')).toBe('true')
		expect(wrapper.text()).toContain('Incorrect password.')
		expect(wrapper.find('.login-form-error').exists()).toBe(false)
	})

	it('maps server failures to a form-level NotificationBlock', async () => {
		const { wrapper } = mountLoginValidationForm()

		wrapper.vm.applyServerErrors({ form: 'Unable to reach authentication service.' })
		await flushControlState()

		expect(wrapper.find('.login-form-error').exists()).toBe(true)
		expect(wrapper.find('.login-form-error').attributes('role')).toBe('alert')
		expect(wrapper.text()).toContain('Unable to reach authentication service.')
		expect(wrapper.find('#username').element.hasAttribute('aria-invalid')).toBe(false)
	})

	it('clears field errors when the user edits the control', async () => {
		const { wrapper, passwordError } = mountLoginValidationForm()

		wrapper.vm.applyServerErrors({ password: 'Incorrect password.' })
		await flushControlState()

		await wrapper.find('#password').setValue('new-secret')
		await flushControlState()

		expect(passwordError.value).toBe('')
		expect(wrapper.find('#password').element.hasAttribute('aria-invalid')).toBe(false)
	})
})
