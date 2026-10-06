import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Accordion from './Accordion.vue'
import AccordionItem from './AccordionItem.vue'

const globalStubs = {
	HugeiconsIcon: true,
}

describe('Accordion', () => {
	it('opens the default subsection and toggles the rest', async () => {
		const wrapper = mount(Accordion, {
			props: {
				defaultOpenIds: ['details'],
			},
			slots: {
				default: `
					<AccordionItem item-id="details" title="Details"><p class="details">Open</p></AccordionItem>
					<AccordionItem item-id="notes" title="Notes"><p class="notes">Closed</p></AccordionItem>
				`,
			},
			global: {
				stubs: globalStubs,
				components: { AccordionItem },
			},
		})

		await nextTick()

		const details = wrapper.get('#accordion-item-details')
		const notes = wrapper.get('#accordion-item-notes')
		expect(details.attributes('open')).toBeDefined()
		expect(notes.attributes('open')).toBeUndefined()

		notes.element.open = true
		await notes.trigger('toggle')
		await nextTick()

		expect(wrapper.get('#accordion-item-notes').attributes('open')).toBeDefined()

		details.element.open = false
		await details.trigger('toggle')
		await nextTick()

		expect(wrapper.get('#accordion-item-details').attributes('open')).toBeUndefined()
	})
})
