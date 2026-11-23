import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Combobox from './Combobox.vue'

const options = [
	{ value: 1, label: 'Beef mince', description: 'Meat' },
	{ value: 2, label: 'Crème fraîche', description: 'Dairy' },
	{ value: 3, label: 'Milk', description: 'Dairy' },
	{ value: 4, label: 'Saffron', description: 'Spices', disabled: true },
]

function mountBox(props = {}, attrs = {}) {
	return mount(Combobox, {
		attachTo: document.body,
		props: { options, ...props },
		attrs,
		global: { stubs: { HugeiconsIcon: true } },
	})
}

function optionTexts(wrapper) {
	return wrapper.findAll('[role="option"] .combobox-option-label').map(option => option.text())
}

async function type(wrapper, text) {
	const input = wrapper.find('input')
	await input.setValue(text)
	await input.trigger('input')
}

afterEach(() => {
	document.body.innerHTML = ''
})

describe('Combobox', () => {
	it('shows the chosen option and follows value changes', async () => {
		const wrapper = mountBox({ modelValue: 3 })
		expect(wrapper.find('input').element.value).toBe('Milk')
		await wrapper.setProps({ modelValue: 1 })
		expect(wrapper.find('input').element.value).toBe('Beef mince')
		await wrapper.setProps({ modelValue: 99 })
		expect(wrapper.find('input').element.value).toBe('99')
	})

	it('opens the list when the box is clicked', async () => {
		const wrapper = mountBox()
		await wrapper.find('input').trigger('click')
		expect(wrapper.find('input').attributes('aria-expanded')).toBe('true')
		expect(wrapper.findAll('[role="option"]')).toHaveLength(options.length)
	})

	it('filters by every word of the label and description, ignoring accents', async () => {
		const wrapper = mountBox()
		await type(wrapper, 'dairy creme')
		expect(optionTexts(wrapper)).toEqual(['Crème fraîche'])
		await type(wrapper, 'dairy')
		expect(optionTexts(wrapper)).toEqual(['Crème fraîche', 'Milk'])
		await type(wrapper, 'zzz')
		expect(wrapper.find('.combobox-message').text()).toBe('No matches')
	})

	it('picks with the arrow keys and Enter, skipping disabled options', async () => {
		const wrapper = mountBox()
		const input = wrapper.find('input')
		await input.trigger('keydown', { key: 'ArrowDown' })
		expect(input.attributes('aria-expanded')).toBe('true')
		expect(input.attributes('aria-activedescendant')).toBe(wrapper.find('.combobox-option-active').attributes('id'))
		await input.trigger('keydown', { key: 'ArrowUp' })
		expect(wrapper.find('.combobox-option-active').text()).toContain('Milk')
		const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
		input.element.dispatchEvent(enter)
		await nextTick()
		expect(enter.defaultPrevented).toBe(true)
		expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([3])
		expect(wrapper.emitted('change').at(-1)[0].label).toBe('Milk')
		expect(input.attributes('aria-expanded')).toBe('false')
	})

	it('ignores clicks on disabled options', async () => {
		const wrapper = mountBox()
		await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
		await wrapper.findAll('[role="option"]')[3].trigger('click')
		expect(wrapper.emitted('update:modelValue')).toBeUndefined()
	})

	it('closes on Escape without letting it reach a dialog, and restores the label', async () => {
		const wrapper = mountBox({ modelValue: 1 })
		await type(wrapper, 'mil')
		const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
		const outer = vi.fn()
		document.body.addEventListener('keydown', outer)
		wrapper.find('input').element.dispatchEvent(escape)
		await nextTick()
		document.body.removeEventListener('keydown', outer)
		expect(escape.defaultPrevented).toBe(true)
		expect(outer).not.toHaveBeenCalled()
		expect(wrapper.find('input').element.value).toBe('Beef mince')
	})

	it('puts the label back when focus leaves after typing', async () => {
		const wrapper = mountBox({ modelValue: 2 })
		await type(wrapper, 'xyz')
		await wrapper.find('input').trigger('blur')
		expect(wrapper.find('input').element.value).toBe('Crème fraîche')
		expect(wrapper.emitted('update:modelValue')).toBeUndefined()
	})

	it('offers None and a clear button when clearable', async () => {
		const wrapper = mountBox({ modelValue: 1, clearable: true })
		await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
		const none = wrapper.find('.combobox-option-none')
		expect(none.text()).toBe('— None —')
		await none.trigger('click')
		expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([null])

		await wrapper.setProps({ modelValue: 1 })
		await wrapper.find('.combobox-clear').trigger('click')
		expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([null])
		expect(mountBox({ modelValue: 1 }).find('.combobox-clear').exists()).toBe(false)
	})

	it('lists at most limit options, with a more item that emits the typed text', async () => {
		const onMore = vi.fn()
		const wrapper = mountBox({ limit: 2 }, { onMore })
		await type(wrapper, 'i')
		expect(optionTexts(wrapper)).toHaveLength(2)
		const more = wrapper.find('.combobox-option-more')
		// 'i' is in Beef mince, Crème fraîche, Milk and Spices.
		expect(more.text()).toBe('2 more…')
		expect(more.attributes('role')).toBe('option')
		await more.trigger('click')
		expect(onMore).toHaveBeenCalledWith('i')
	})

	it('asks for more typing when nothing listens for more', async () => {
		const wrapper = mountBox({ limit: 1 })
		await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
		const more = wrapper.find('.combobox-option-more')
		expect(more.text()).toBe('3 more: keep typing to narrow them down')
		expect(more.attributes('role')).toBe('presentation')
	})

	it('renders the actions slot beside the box, and uses the given id', () => {
		const wrapper = mount(Combobox, {
			props: { options, id: 'field-ingredient' },
			slots: { actions: '<button class="browse">Browse…</button>' },
			global: { stubs: { HugeiconsIcon: true } },
		})
		expect(wrapper.find('.combobox-field .browse').exists()).toBe(true)
		expect(wrapper.find('input').attributes('id')).toBe('field-ingredient')
		expect(wrapper.find('[role="listbox"]').attributes('id')).toBe('field-ingredient-listbox')
	})
})
