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

	<Section title="Modal dialog" subtitle="Opens with showModal() and closes on backdrop click">
		<div role="toolbar" class="dialog-actions">
			<button type="button" @click="openModal">Open modal</button>
		</div>

		<dialog
			ref="modalRef"
			class="example-dialog"
			@close="onModalClose"
			@click="onBackdropClick($event, modalRef)"
		>
			<div class="dialog-panel" @click.stop>
				<h3>Confirm action</h3>
				<p>
					This modal uses the native dialog API. Press Escape or click outside
					to dismiss, or choose an action below.
				</p>
				<form method="dialog" class="dialog-form">
					<div role="toolbar" class="dialog-actions">
						<button type="submit" value="cancel" class="neutral">Cancel</button>
						<button type="submit" value="confirm" class="good">Confirm</button>
					</div>
				</form>
			</div>
		</dialog>

		<p v-if="modalResult" class="subtle">{{ modalResult }}</p>
	</Section>

	<Section title="Non-modal dialog" subtitle="Stays open while the page remains interactive">
		<div role="toolbar" class="dialog-actions">
			<button type="button" class="neutral" @click="openPanel">Open panel</button>
			<button type="button" class="bad" :disabled="!panelRef?.open" @click="closePanel">
				Close panel
			</button>
		</div>

		<dialog ref="panelRef" class="example-dialog example-dialog-panel">
			<div class="dialog-panel">
				<h3>Side note</h3>
				<p>
					Non-modal dialogs use <code>show()</code> instead of
					<code>showModal()</code>. They do not trap focus or dim the page.
				</p>
				<button type="button" class="neutral" @click="closePanel">Dismiss</button>
			</div>
		</dialog>
	</Section>
</template>

<script setup>
import { ref } from 'vue'
import Section from '../components/Section.vue'

const modalRef = ref(null)
const panelRef = ref(null)
const modalResult = ref('')

function openModal() {
	modalRef.value?.showModal()
}

function onModalClose(event) {
	const value = event.target?.returnValue
	if (value === 'confirm') {
		modalResult.value = 'Action confirmed.'
	} else {
		modalResult.value = 'Dialog closed without confirming.'
	}
}

function onBackdropClick(event, dialog) {
	if (event.target === dialog) {
		dialog.close('cancel')
	}
}

function openPanel() {
	panelRef.value?.show()
}

function closePanel() {
	panelRef.value?.close()
}
</script>

<style scoped>
.dialog-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.dialog-panel h3 {
	margin: 0 0 0.5rem;
}

.dialog-panel p {
	margin: 0 0 1rem;
}

.dialog-form {
	margin: 0;
}

.example-dialog-panel {
	margin-block-start: 1rem;
	max-width: 24rem;
}
</style>
