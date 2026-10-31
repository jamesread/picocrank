import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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

describe('Header toolbar overflow', () => {
	const sizes = { header: 1000, branding: 224, toolbar: 300 }
	let restore = []

	function stub(property, pick) {
		const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, property)
		Object.defineProperty(HTMLElement.prototype, property, {
			configurable: true,
			get() {
				const value = pick(this)
				return value === undefined ? (original?.get?.call(this) ?? 0) : value
			},
		})
		restore.push(() => Object.defineProperty(HTMLElement.prototype, property, original))
	}

	beforeEach(() => {
		stub('clientWidth', el => (el.tagName === 'HEADER' ? sizes.header : undefined))
		stub('offsetWidth', el => (el.classList.contains('header-toolbar') ? sizes.toolbar : undefined))
		const originalRect = HTMLElement.prototype.getBoundingClientRect
		HTMLElement.prototype.getBoundingClientRect = function () {
			const width = this.classList.contains('image-and-title') ? sizes.branding : 0
			return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0 }
		}
		restore.push(() => { HTMLElement.prototype.getBoundingClientRect = originalRect })
	})

	afterEach(() => {
		restore.forEach(fn => fn())
		restore = []
		sizes.header = 1000
		document.body.innerHTML = ''
	})

	function mountHeader(props = {}) {
		return mount(Header, {
			attachTo: document.body,
			props: { sidebarEnabled: false, ...props },
			slots: {
				toolbar: '<button type="button" class="search">Search</button><button type="button" class="help">Help</button>',
			},
			global: { plugins: [router], stubs: globalStubs },
		})
	}

	it('keeps the toolbar inline when the header has room', async () => {
		const wrapper = mountHeader()
		await nextTick()

		expect(wrapper.find('.header-toolbar-toggle').exists()).toBe(false)
		expect(wrapper.find('.header-toolbar').classes()).not.toContain('toolbar-overflow-menu')
	})

	it('moves the toolbar into a menu when the header is crowded', async () => {
		sizes.header = 400
		const wrapper = mountHeader()
		await nextTick()

		const toggle = wrapper.find('.header-toolbar-toggle')
		expect(toggle.exists()).toBe(true)
		expect(toggle.attributes('aria-label')).toBe('More actions')

		await toggle.trigger('click')
		expect(wrapper.find('.header-toolbar').classes()).toContain('toolbar-overflow-menu-open')

		await wrapper.find('.help').trigger('click')
		expect(wrapper.find('.header-toolbar').classes()).not.toContain('toolbar-overflow-menu-open')
	})

	it('keeps the toolbar inline when collapseToolbar is false', async () => {
		sizes.header = 400
		const wrapper = mountHeader({ collapseToolbar: false })
		await nextTick()

		expect(wrapper.find('.header-toolbar-toggle').exists()).toBe(false)
	})
})
