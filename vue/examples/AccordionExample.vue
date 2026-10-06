<template>
	<Section
		title="Accordion"
		:icon="ArrowDown01Icon"
		subtitle="Collapsible subsections inside a section."
		:padding="false"
	>
		<p class="padding">
			<code>Accordion</code> tracks which panels are open.
			Each <code>AccordionItem</code> is a subsection: a
			<code>section-subheader</code> trigger and a padded content region.
			Pass ids in <code>default-open-ids</code> for panels that start expanded.
		</p>

		<Accordion :default-open-ids="['details']">
			<AccordionItem item-id="details" title="Details">
				<p>This subsection starts open.</p>
			</AccordionItem>
			<AccordionItem item-id="notes" title="Notes">
				<p>This subsection starts closed. Select the heading to expand it.</p>
			</AccordionItem>
			<AccordionItem item-id="history" title="History">
				<p>Several subsections can be open at the same time.</p>
			</AccordionItem>
		</Accordion>
	</Section>
</template>

<script setup>
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import Accordion from '../components/Accordion.vue'
import AccordionItem from '../components/AccordionItem.vue'
</script>
