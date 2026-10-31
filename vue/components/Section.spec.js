import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Section from './Section.vue'

// jsdom does no layout: stub the widths Section measures.
const widths = { header: 400, toolbar: 200, title: 100 }

function stubWidth(property, pick) {
	const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, property)
	Object.defineProperty(HTMLElement.prototype, property, {
		configurable: true,
		get() {
			const value = pick(this)
			return value === undefined ? (original?.get?.call(this) ?? 0) : value
		},
	})
	return () => Object.defineProperty(HTMLElement.prototype, property, original)
}

let restore = []

beforeEach(() => {
	restore = [
		stubWidth('clientWidth', (el) => (
			el.classList.contains('section-header') ? widths.header : undefined
		)),
		stubWidth('offsetWidth', (el) => {
			if (el.getAttribute('role') === 'toolbar') return widths.toolbar
			if (el.classList.contains('section-header-title')) return widths.title
			return undefined
		}),
	]
})

afterEach(() => {
	restore.forEach(fn => fn())
	widths.header = 400
	widths.toolbar = 200
	widths.title = 100
	document.body.innerHTML = ''
})

function mountSection(options = {}) {
	return mount(Section, {
		attachTo: document.body,
		props: { title: 'Projects', ...options.props },
		slots: {
			toolbar: options.toolbar ?? '<button type="button" class="refresh">Refresh</button><button type="button" class="create">Create</button>',
		},
	})
}

describe('Section', () => {
	it('shows the toolbar inline when it fits', async () => {
		const wrapper = mountSection()
		await nextTick()

		expect(wrapper.find('.section-toolbar-toggle').exists()).toBe(false)
		expect(wrapper.find('[role="toolbar"]').classes()).not.toContain('toolbar-overflow-menu')
	})

	it('moves the toolbar into a menu when it does not fit', async () => {
		widths.toolbar = 500
		const wrapper = mountSection()
		await nextTick()

		const toggle = wrapper.find('.section-toolbar-toggle')
		expect(toggle.exists()).toBe(true)
		expect(toggle.attributes('aria-label')).toBe('More actions')
		expect(toggle.attributes('aria-expanded')).toBe('false')

		const toolbar = wrapper.find('[role="toolbar"]')
		expect(toolbar.classes()).toContain('toolbar-overflow-menu')
		expect(toolbar.classes()).not.toContain('toolbar-overflow-menu-open')
		expect(toggle.attributes('aria-controls')).toBe(toolbar.attributes('id'))
	})

	it('opens the menu, and closes it when an action is chosen', async () => {
		widths.toolbar = 500
		const onRefresh = vi.fn()
		const withHandler = mount({
			components: { Section },
			template: '<Section title="Projects"><template #toolbar><button type="button" class="refresh" @click="onRefresh">Refresh</button></template></Section>',
			methods: { onRefresh },
		}, { attachTo: document.body })
		await nextTick()

		await withHandler.find('.section-toolbar-toggle').trigger('click')
		expect(withHandler.find('[role="toolbar"]').classes()).toContain('toolbar-overflow-menu-open')
		expect(withHandler.find('.section-toolbar-toggle').attributes('aria-expanded')).toBe('true')
		await nextTick()
		expect(document.activeElement).toBe(withHandler.find('.refresh').element)

		await withHandler.find('.refresh').trigger('click')
		expect(onRefresh).toHaveBeenCalledOnce()
		expect(withHandler.find('[role="toolbar"]').classes()).not.toContain('toolbar-overflow-menu-open')
	})

	it('keeps the menu open for controls that open their own popup', async () => {
		widths.toolbar = 500
		const wrapper = mountSection({
			toolbar: '<button type="button" class="views" aria-haspopup="menu">Views</button>',
		})
		await nextTick()

		await wrapper.find('.section-toolbar-toggle').trigger('click')
		await wrapper.find('.views').trigger('click')
		expect(wrapper.find('[role="toolbar"]').classes()).toContain('toolbar-overflow-menu-open')
	})

	it('closes on Escape and returns focus to the toggle', async () => {
		widths.toolbar = 500
		const wrapper = mountSection()
		await nextTick()

		await wrapper.find('.section-toolbar-toggle').trigger('click')
		await wrapper.find('.refresh').trigger('keydown', { key: 'Escape' })
		expect(wrapper.find('[role="toolbar"]').classes()).not.toContain('toolbar-overflow-menu-open')
		expect(document.activeElement).toBe(wrapper.find('.section-toolbar-toggle').element)
	})

	it('closes when clicking outside the header', async () => {
		widths.toolbar = 500
		const wrapper = mountSection()
		await nextTick()

		await wrapper.find('.section-toolbar-toggle').trigger('click')
		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
		await nextTick()
		expect(wrapper.find('[role="toolbar"]').classes()).not.toContain('toolbar-overflow-menu-open')
	})

	it('expands again when there is room', async () => {
		widths.toolbar = 500
		const wrapper = mountSection()
		await nextTick()
		expect(wrapper.find('.section-toolbar-toggle').exists()).toBe(true)

		widths.header = 800
		wrapper.vm.update()
		await nextTick()
		expect(wrapper.find('.section-toolbar-toggle').exists()).toBe(false)
	})

	it('never collapses when collapseToolbar is false or the toolbar is empty', async () => {
		widths.toolbar = 500
		const optedOut = mountSection({ props: { collapseToolbar: false } })
		const empty = mountSection({ toolbar: '' })
		await nextTick()

		expect(optedOut.find('.section-toolbar-toggle').exists()).toBe(false)
		expect(empty.find('.section-toolbar-toggle').exists()).toBe(false)
	})

	it('uses toolbarMenuLabel for the toggle', async () => {
		widths.toolbar = 500
		const wrapper = mountSection({ props: { toolbarMenuLabel: 'Table actions' } })
		await nextTick()

		expect(wrapper.find('.section-toolbar-toggle').attributes('aria-label')).toBe('Table actions')
	})
})
