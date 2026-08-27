import { mount } from '@vue/test-utils'
import { computed, defineComponent, ref } from 'vue'
import FormField from '../components/FormField.vue'
import FormLayout from '../components/FormLayout.vue'
import NotificationBlock from '../components/NotificationBlock.vue'

export const routerLinkStub = {
	name: 'RouterLink',
	template: '<a><slot /></a>',
}

const defaultMountOptions = {
	attachTo: document.body,
}

export function mountFormField(options = {}) {
	const {
		props = {},
		slot = '<input id="test-input" />',
		global = {},
		attachTo = document.body,
		...rest
	} = options

	return mount(FormField, {
		...defaultMountOptions,
		attachTo,
		props: {
			label: 'Test Field',
			for: 'test-input',
			...props,
		},
		slots: {
			default: slot,
		},
		global: {
			stubs: {
				RouterLink: routerLinkStub,
				...global.stubs,
			},
			...global,
		},
		...rest,
	})
}

export function mountFormFieldWithError(initialError = '') {
	const error = ref(initialError)

	const wrapper = mount(
		defineComponent({
			components: { FormField },
			setup() {
				return { error }
			},
			template: `
				<FormField label="Email" for="email" v-model:error="error">
					<input id="email" />
				</FormField>
			`,
		}),
		{
			attachTo: document.body,
			global: {
				stubs: {
					RouterLink: routerLinkStub,
				},
			},
		},
	)

	return { wrapper, error }
}

export async function flushControlState() {
	const { nextTick } = await import('vue')
	await nextTick()
	await nextTick()
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const MIN_COMMENTS_LENGTH = 50

export function mountValidationForm() {
	const formData = ref({
		email: '',
		comments: '',
		accessibility: [],
	})

	const emailError = computed(() => {
		const email = formData.value.email.trim()
		if (!email) {
			return 'Email is required.'
		}
		if (!EMAIL_PATTERN.test(email)) {
			return 'Enter a valid email address.'
		}
		return ''
	})

	const commentsError = computed(() => {
		const comments = formData.value.comments.trim()
		if (comments.length > 0 && comments.length < MIN_COMMENTS_LENGTH) {
			return `Comments must be at least ${MIN_COMMENTS_LENGTH} characters.`
		}
		return ''
	})

	function validateAccessibilityRequirements() {
		const selected = formData.value.accessibility
		if (selected.includes('high-contrast') && selected.includes('low-contrast')) {
			return 'High contrast and low contrast UI cannot both be selected.'
		}
		return ''
	}

	const submitted = ref(false)

	const wrapper = mount(
		defineComponent({
			components: { FormField, FormLayout },
			setup() {
				function handleSubmit(event) {
					if (!event.target.reportValidity()) {
						return
					}
					if (validateAccessibilityRequirements()) {
						return
					}
					submitted.value = true
				}

				return {
					formData,
					emailError,
					commentsError,
					validateAccessibilityRequirements,
					submitted,
					handleSubmit,
				}
			},
			template: `
				<FormLayout @submit.prevent="handleSubmit">
					<FormField
						label="Email"
						for="email"
						:error="emailError"
					>
						<input
							id="email"
							v-model="formData.email"
							type="email"
							required
						/>
					</FormField>

					<FormField
						label="Comments"
						for="comments"
						:error="commentsError"
					>
						<textarea id="comments" v-model="formData.comments" />
					</FormField>

					<FormField
						label="Accessibility requirements"
						component-has-label
						:validate="validateAccessibilityRequirements"
						:validate-deps="[formData.accessibility]"
					>
						<div role="group" aria-label="Accessibility requirements">
							<label>
								<input
									type="checkbox"
									value="high-contrast"
									v-model="formData.accessibility"
								/>
								High contrast
							</label>
							<label>
								<input
									type="checkbox"
									value="low-contrast"
									v-model="formData.accessibility"
								/>
								Low contrast
							</label>
						</div>
					</FormField>

					<template #actions>
						<button type="submit">Submit</button>
					</template>
				</FormLayout>
			`,
		}),
		{
			global: {
				stubs: {
					RouterLink: routerLinkStub,
				},
			},
			attachTo: document.body,
		},
	)

	return { wrapper, formData, submitted }
}

export function mountLoginValidationForm() {
	const usernameError = ref('')
	const passwordError = ref('')
	const formError = ref('')

	const wrapper = mount(
		defineComponent({
			components: { FormField, NotificationBlock },
			setup() {
				const credentials = ref({ username: '', password: '' })

				function applyServerErrors(errors) {
					usernameError.value = errors.username || ''
					passwordError.value = errors.password || ''
					formError.value = errors.form || ''
				}

				function handleSubmit() {
					usernameError.value = ''
					passwordError.value = ''
					formError.value = ''
				}

				return {
					credentials,
					usernameError,
					passwordError,
					formError,
					applyServerErrors,
					handleSubmit,
				}
			},
			template: `
				<form @submit.prevent="handleSubmit">
					<FormField label="Username" for="username" label-skip v-model:error="usernameError">
						<input id="username" v-model="credentials.username" required aria-label="Username" />
					</FormField>
					<FormField label="Password" for="password" label-skip v-model:error="passwordError">
						<input id="password" v-model="credentials.password" type="password" required aria-label="Password" />
					</FormField>
					<button type="submit">Login</button>
					<NotificationBlock
						v-if="formError"
						class="login-form-error"
						type="bad"
						label="Error"
						:message="formError"
						role="alert"
					/>
				</form>
			`,
		}),
		{
			global: {
				stubs: {
					RouterLink: routerLinkStub,
				},
			},
			attachTo: document.body,
		},
	)

	return {
		wrapper,
		usernameError,
		passwordError,
		formError,
	}
}
