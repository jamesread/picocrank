<template>
	<PageToolbar label="Page actions">
		<span class="subtle">{{ selected }} selected</span>
		<button type="button" class="neutral" @click="selected++">Select another</button>
		<button type="button" class="good">Save</button>
	</PageToolbar>

	<Section
		title="Page toolbar"
		:icon="Menu01Icon"
		subtitle="Sticky page-level actions joined to the header"
	>
		<p>
			Use <code>&lt;PageToolbar&gt;</code> when a page's actions apply to several
			sibling sections, instead of wrapping them in one parent section (sections
			cannot contain sections). It sticks under the fixed header while the page
			scrolls. Scroll down to see it stay in place.
		</p>
	</Section>

	<Section v-for="n in 6" :key="n" :title="`Group ${n}`">
		<p v-for="line in 4" :key="line">Placeholder content line {{ line }} for group {{ n }}.</p>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import { Menu01Icon } from '@hugeicons/core-free-icons'

const selected = ref(0)
</script>
