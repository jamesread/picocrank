<template>
	<Section
		title="Dialog"
		subtitle="Native HTML dialog element with showModal()"
	>
		<p>
			The <code>&lt;dialog&gt;</code> element provides accessible modal and
			non-modal overlays without a third-party library. Femtocrank styles the
			element globally; use <code>showModal()</code> for a modal with backdrop,
			or <code>show()</code> for a non-modal panel.
		</p>
	</Section>

	<Section
		title="Dialog component"
		subtitle="Responsive modal: centred when wide, a bottom sheet or full screen when narrow"
	>
		<p>
			<code>Dialog</code> wraps the native element with a title bar, a scrolling
			body and an <code>actions</code> slot (an <code>.action-row</code> that
			stacks on narrow screens). Open it with <code>v-model:open</code>. Narrow
			the window to see <code>narrow-layout</code>.
		</p>
		<div class="action-row start no-stack">
			<button type="button" class="neutral" @click="sheetOpen = true">Bottom sheet</button>
			<button type="button" class="neutral" @click="fullscreenOpen = true">Full screen</button>
		</div>

		<Dialog v-model:open="sheetOpen" title="Delete 3 rows?" size="small">
			<p>The rows and their history are removed. This cannot be undone.</p>
			<template #actions="{ close }">
				<button type="button" class="bad" @click="close('delete')">Delete</button>
			</template>
		</Dialog>

		<Dialog
			v-model:open="fullscreenOpen"
			title="Edit filters"
			size="large"
			narrow-layout="fullscreen"
			toolbar-label="Filter set"
		>
			<template #toolbar>
				<select v-model="filterSet" aria-label="Filter set">
					<option value="all">All rows</option>
					<option value="mine">My rows</option>
				</select>
			</template>
			<p v-for="n in 12" :key="n">
				Filter {{ n }}: long dialog bodies scroll while the title bar and
				actions stay in view.
			</p>
			<template #actions="{ close }">
				<button type="button" class="good" @click="close('apply')">Apply</button>
			</template>
		</Dialog>
	</Section>

	<Section title="Modal dialog" subtitle="Dialog with the default modal: a backdrop, closed by Escape or a backdrop click">
		<div class="action-row start no-stack">
			<button type="button" @click="modalOpen = true">Open modal</button>
		</div>

		<Dialog v-model:open="modalOpen" title="Confirm action" size="small" @close="onModalClose">
			<p>
				This modal uses the native dialog API. Press Escape or click outside
				to dismiss, or choose an action below.
			</p>
			<template #actions="{ close }">
				<button type="button" class="good" @click="close('confirm')">Confirm</button>
			</template>
		</Dialog>

		<p v-if="modalResult" class="subtle">{{ modalResult }}</p>
	</Section>

	<Section title="Non-modal dialog" subtitle="Dialog with :modal=&quot;false&quot; stays open while the page remains interactive">
		<div class="action-row start no-stack">
			<button type="button" class="neutral" @click="panelOpen = true">Open panel</button>
			<button type="button" class="bad" :disabled="!panelOpen" @click="panelOpen = false">
				Close panel
			</button>
		</div>

		<Dialog v-model:open="panelOpen" :modal="false" title="Side note" size="small">
			<p>
				Non-modal dialogs open with <code>show()</code> instead of
				<code>showModal()</code>. They do not trap focus or dim the page.
			</p>
			<template #actions="{ close }">
				<button type="button" class="neutral" @click="close()">Dismiss</button>
			</template>
		</Dialog>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import Section from '../components/Section.vue'
import Dialog from '../components/Dialog.vue'

const sheetOpen = ref(false)
const fullscreenOpen = ref(false)
const filterSet = ref('all')
const modalOpen = ref(false)
const panelOpen = ref(false)
const modalResult = ref('')

function onModalClose(returnValue) {
	modalResult.value = returnValue === 'confirm'
		? 'Action confirmed.'
		: 'Dialog closed without confirming.'
}
</script>
