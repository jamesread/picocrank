import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Header from './Header.vue'

const router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{ path: '/login', name: 'Login', component: { template: '<div>Login</div>' } },
	],
})

const globalStubs = {
	HugeiconsIcon: true,
	Breadcrumbs: true,
	TopBar: true,
	Sidebar: true,
}

describe('Header loginRoute', () => {
	it('shows a Login link when username is empty and loginRoute is set', async () => {
		const wrapper = mount(Header, {
			props: {
				username: '',
				loginRoute: { name: 'Login' },
				sidebarEnabled: false,
			},
			global: {
				plugins: [router],
				stubs: globalStubs,
			},
		})

		const loginLink = wrapper.find('a.login-link')
		expect(loginLink.exists()).toBe(true)
		expect(loginLink.text()).toBe('Login')
	})

	it('shows the username control instead of Login when username is set', () => {
		const wrapper = mount(Header, {
			props: {
				username: 'tester',
				loginRoute: { name: 'Login' },
				sidebarEnabled: false,
			},
			global: {
				plugins: [router],
				stubs: globalStubs,
			},
		})

		expect(wrapper.find('a.login-link').exists()).toBe(false)
		expect(wrapper.find('.user-info span').text()).toBe('tester')
	})

	it('shows neither Login nor username when loginRoute is not set', () => {
		const wrapper = mount(Header, {
			props: {
				username: '',
				sidebarEnabled: false,
			},
			global: {
				plugins: [router],
				stubs: globalStubs,
			},
		})

		expect(wrapper.find('a.login-link').exists()).toBe(false)
		expect(wrapper.find('.user-info').exists()).toBe(false)
	})
})
