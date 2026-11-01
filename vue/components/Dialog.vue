<template>
	<dialog
		ref="dialogRef"
		:class="[
			'picocrank-dialog',
			`dialog-size-${size}`,
			`dialog-narrow-${narrowLayout}`,
		]"
		:aria-labelledby="hasTitle ? titleId : undefined"
		:aria-label="hasTitle ? undefined : (ariaLabel || undefined)"
		@close="onClose"
		@click="onDialogClick"
	>
		<div class="dialog-panel">
			<div v-if="hasTitle || showClose || $slots.toolbar" class="dialog-header">
				<h2 v-if="hasTitle" :id="titleId" class="dialog-title">
					<slot name="title">{{ title }}</slot>
				</h2>
				<div v-if="$slots.toolbar" role="toolbar" class="dialog-toolbar" :aria-label="toolbarLabel">
					<slot name="toolbar" :close="close" />
				</div>
				<button
					v-if="showClose"
					type="button"
					class="neutral dialog-close"
					:aria-label="closeLabel"
					:title="closeLabel"
					@click="close()"
				>
					<HugeiconsIcon :icon="Cancel01Icon" width="1em" height="1em" aria-hidden="true" />
				</button>
			</div>
			<div class="dialog-body">
				<slot :close="close" />
			</div>
			<div v-if="$slots.actions" class="dialog-actions action-row">
				<slot name="actions" :close="close" />
			</div>
		</div>
	</dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Cancel01Icon } from '@hugeicons/core-free-icons'

/**
 * Modal dialog on the native <dialog> element.
 *
 * Wide screens: a centred panel (`size`). Narrow screens (PicoCrank's 768px
 * breakpoint): `narrowLayout` "sheet" docks it to the bottom edge, "fullscreen"
 * fills the screen, "centered" keeps the wide-screen look. The body scrolls;
 * the title bar and `actions` (an .action-row, stacked when narrow) stay put. The
 * `toolbar` slot puts compact controls (a filter dropdown, say) in the title bar, beside the
 * close button.
 *
 * Open with `v-model:open` or the exposed `show()` / `close()`. With
 * `:modal="false"` it opens with show(): no backdrop, and the page stays usable.
 */
const props = defineProps({
	open: {
		type: Boolean,
		default: false,
	},
	/** Modal (showModal(): backdrop, rest of the page inert) or non-modal (show()). */
	modal: {
		type: Boolean,
		default: true,
	},
	title: {
		type: String,
		default: '',
	},
	/** Accessible name when there is no title. */
	ariaLabel: {
		type: String,
		default: '',
	},
	/** Wide-screen width: small (26em), medium (38em) or large (60em). */
	size: {
		type: String,
		default: 'medium',
		validator: value => ['small', 'medium', 'large'].includes(value),
	},
	/** Narrow-screen layout: sheet, fullscreen or centered. */
	narrowLayout: {
		type: String,
		default: 'sheet',
		validator: value => ['sheet', 'fullscreen', 'centered'].includes(value),
	},
	closeOnBackdrop: {
		type: Boolean,
		default: true,
	},
	showClose: {
		type: Boolean,
		default: true,
	},
	closeLabel: {
		type: String,
		default: 'Close',
	},
	/** Accessible name of the title bar's toolbar slot. */
	toolbarLabel: {
		type: String,
		default: '',
	},
})

const emit = defineEmits(['update:open', 'open', 'close'])

const slots = useSlots()
const dialogRef = ref(null)
const titleId = `dialog-title-${useId()}`
const hasTitle = computed(() => Boolean(props.title || slots.title))

function show() {
	const dialog = dialogRef.value
	if (!dialog || dialog.open) return
	const method = props.modal ? dialog.showModal : dialog.show
	if (typeof method === 'function') method.call(dialog)
	else dialog.setAttribute('open', '')
	emit('open')
	if (!props.open) emit('update:open', true)
}

function close(returnValue) {
	const dialog = dialogRef.value
	if (!dialog || !dialog.open) return
	if (typeof dialog.close === 'function') {
		dialog.close(returnValue)
	} else {
		dialog.removeAttribute('open')
		onClose()
	}
}

/** Every close (Escape, close(), form method="dialog") ends here. */
function onClose() {
	if (props.open) emit('update:open', false)
	emit('close', dialogRef.value?.returnValue ?? '')
}

/** A click on the <dialog> itself (not the panel) is a click on the backdrop. */
function onDialogClick(event) {
	if (props.modal && props.closeOnBackdrop && event.target === dialogRef.value) close()
}

watch(() => props.open, (value) => {
	if (value) show()
	else close()
})

onMounted(() => {
	if (props.open) show()
})

onBeforeUnmount(() => {
	if (dialogRef.value?.open) dialogRef.value.close?.()
})

defineExpose({ show, close, dialog: dialogRef })
</script>

<style scoped>
/*
 * Femtocrank pads <dialog>; the panel fills it so backdrop clicks are exact.
 * The border (the browser's thick dialog border) is left as Femtocrank has it.
 */
dialog.picocrank-dialog {
	padding: 0;
	width: min(38em, calc(100vw - 2em));
	max-width: calc(100vw - 2em);
	max-height: calc(100vh - 2em);
	max-height: calc(100dvh - 2em);
	overflow: hidden;
}

/*
 * Non-modal: Femtocrank makes it position: fixed but leaves it where it sits in
 * the page; centre it in the viewport like a modal (no backdrop).
 */
dialog.picocrank-dialog:not(:modal) {
	inset: 0;
	height: fit-content;
	margin: auto;
}

dialog.picocrank-dialog.dialog-size-small {
	width: min(26em, calc(100vw - 2em));
}

dialog.picocrank-dialog.dialog-size-large {
	width: min(60em, calc(100vw - 2em));
}

.dialog-panel {
	display: flex;
	flex-direction: column;
	max-height: inherit;
	box-sizing: border-box;
}

.dialog-header {
	display: flex;
	align-items: center;
	gap: 1em;
	padding: .75em 1em;
	border-bottom: 1px solid var(--border-color);
}

.dialog-title {
	flex: 1 1 auto;
	min-width: 0;
	margin: 0;
	font-size: 1.15em;
}

/* Title-bar controls: compact, beside the close button; the title gives way first. */
.dialog-toolbar {
	display: flex;
	flex: 0 1 auto;
	align-items: center;
	gap: .5em;
	min-width: 0;
	margin: 0 0 0 auto;
}

.dialog-toolbar :slotted(select),
.dialog-toolbar :slotted(input) {
	min-width: 0;
	max-width: 12em;
	margin: 0;
	padding: .35em .55em;
}

.dialog-toolbar :slotted(button),
.dialog-toolbar :slotted(.button) {
	margin: 0;
	padding: .35em .55em;
}

.dialog-toolbar + .dialog-close {
	margin-left: 0;
}

.dialog-close {
	flex: 0 0 auto;
	margin: 0 0 0 auto;
	padding: .35em .55em;
	line-height: 1;
}

.dialog-close svg {
	display: block;
}

.dialog-body {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	padding: 1em;
}

.dialog-actions {
	padding: .75em 1em;
	border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
	dialog.picocrank-dialog.dialog-narrow-sheet {
		width: 100vw;
		max-width: 100vw;
		margin: auto 0 0;
		max-height: 90vh;
		max-height: 90dvh;
	}

	dialog.picocrank-dialog.dialog-narrow-fullscreen {
		width: 100vw;
		max-width: 100vw;
		height: 100vh;
		height: 100dvh;
		max-height: 100vh;
		max-height: 100dvh;
		margin: 0;
	}

	/* Edge to edge: no side borders or rounded corners. */
	dialog.picocrank-dialog:not(.dialog-narrow-centered) {
		border-left: 0;
		border-right: 0;
		border-radius: 0;
	}

	dialog.picocrank-dialog.dialog-narrow-fullscreen .dialog-panel {
		height: 100%;
	}

	/* Keep the last action clear of the home indicator on notched phones. */
	dialog.picocrank-dialog:not(.dialog-narrow-centered) .dialog-actions {
		padding-bottom: max(.75em, env(safe-area-inset-bottom));
	}
}
</style>
