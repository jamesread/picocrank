import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppShell from './AppShell.vue'

describe('AppShell', () => {
	let observedCallback

	beforeEach(() => {
		vi.stubGlobal('ResizeObserver', class {
			constructor(callback) {
				observedCallback = callback
			}
			observe() {}
			disconnect() {}
		})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	function mountShell(slots) {
		return mount(AppShell, { slots })
	}

	it('places each slot in the application layout', () => {
		const wrapper = mountShell({
			header: '<header class="test-header" />',
			sidebar: '<aside class="test-sidebar" />',
			banners: '<p class="test-banner" />',
			default: '<p class="test-page" />',
			footer: '<p class="test-footer" />',
		})

		expect(wrapper.find('.app-shell > .test-header').exists()).toBe(true)
		expect(wrapper.find('.app-shell > #layout > .test-sidebar').exists()).toBe(true)
		expect(wrapper.find('#content > .app-shell-banners > .test-banner').exists()).toBe(true)
		expect(wrapper.find('#content > main > .test-page').exists()).toBe(true)
		expect(wrapper.find('#content > footer > .test-footer').exists()).toBe(true)
	})

	it('keeps banners out of the header', () => {
		const wrapper = mountShell({
			header: '<header />',
			banners: '<p class="test-banner" />',
		})

		expect(wrapper.find('header .test-banner').exists()).toBe(false)
	})

	it('omits the footer element when the footer slot is not used', () => {
		const wrapper = mountShell({ default: '<p />' })

		expect(wrapper.find('footer').exists()).toBe(false)
	})

	it('publishes the banner height for other sticky elements', async () => {
		const wrapper = mountShell({ banners: '<p />' })
		const banners = wrapper.find('.app-shell-banners').element
		banners.getBoundingClientRect = () => ({ height: 42 })

		observedCallback()
		await nextTick()

		expect(wrapper.find('.app-shell').attributes('style'))
			.toContain('--picocrank-app-banners-height: 42px')
	})
})
