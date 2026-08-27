import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Tabs from './Tabs.vue'

const globalStubs = {
	HugeiconsIcon: true,
}

describe('Tabs disabled support', () => {
	const tabs = [
		{ id: 'first', label: 'First' },
		{ id: 'second', label: 'Second', disabled: true },
		{ id: 'third', label: 'Third' },
	]

	function mountTabs(overrides = {}) {
		return mount(Tabs, {
			attachTo: document.body,
			props: {
				tabs,
				defaultTab: 'first',
				...overrides.props,
			},
			slots: {
				'tab-first': '<p>First panel</p>',
				'tab-second': '<p>Second panel</p>',
				'tab-third': '<p>Third panel</p>',
			},
			global: {
				stubs: globalStubs,
			},
		})
	}

	it('marks disabled tabs with disabled and aria-disabled', () => {
		const wrapper = mountTabs()

		const disabledTab = wrapper.find('#tab-second')
		expect(disabledTab.attributes('disabled')).toBeDefined()
		expect(disabledTab.attributes('aria-disabled')).toBe('true')
	})

	it('does not select a disabled tab on click', async () => {
		const wrapper = mountTabs()

		await wrapper.find('#tab-second').trigger('click')
		await nextTick()

		expect(wrapper.find('#tab-first').attributes('aria-selected')).toBe('true')
		expect(wrapper.emitted('tab-change')).toBeUndefined()
	})

	it('skips disabled tabs when moving focus with arrow keys', async () => {
		const wrapper = mountTabs()

		await wrapper.find('#tab-first').trigger('keydown', { key: 'ArrowRight' })
		await nextTick()

		expect(wrapper.find('#tab-third').attributes('tabindex')).toBe('0')
		expect(wrapper.find('#tab-third').attributes('aria-selected')).toBe('true')
	})

	it('selects the first enabled tab when defaultTab is disabled', async () => {
		const wrapper = mountTabs({
			props: {
				defaultTab: 'second',
			},
		})

		await nextTick()

		expect(wrapper.find('#tab-first').attributes('aria-selected')).toBe('true')
	})

	it('moves off a tab when it becomes disabled', async () => {
		const wrapper = mountTabs({
			props: {
				tabs: [
					{ id: 'first', label: 'First' },
					{ id: 'second', label: 'Second' },
				],
				defaultTab: 'second',
			},
			slots: {
				'tab-first': '<p>First panel</p>',
				'tab-second': '<p>Second panel</p>',
			},
		})

		await wrapper.setProps({
			tabs: [
				{ id: 'first', label: 'First' },
				{ id: 'second', label: 'Second', disabled: true },
			],
		})
		await nextTick()

		expect(wrapper.find('#tab-first').attributes('aria-selected')).toBe('true')
	})
})
