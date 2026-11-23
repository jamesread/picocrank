/**
 * Where a floating overlay (popover, context menu) anchored to something on the page should be
 * teleported.
 *
 * Overlays teleported to <body> end up beneath a modal <dialog>: it sits in the browser's top layer
 * and makes the rest of the page inert, so a Table or Calendar inside a Dialog would open its
 * popovers out of sight and out of reach. Overlays go into the open dialog holding their anchor, or,
 * without one, into the topmost modal dialog, and only otherwise into <body>. They are positioned
 * with `position: fixed` from viewport coordinates, which holds inside a dialog too (Dialog sets no
 * transform).
 */
import { ref, watch } from 'vue'

/** Whether an open dialog was opened with showModal(). */
function isModalDialog(dialog) {
	try {
		return dialog.matches(':modal')
	} catch {
		// Environments without the :modal pseudo-class: treat any open dialog as modal.
		return true
	}
}

/**
 * The element to teleport an overlay into: the open dialog containing anchor, else the topmost
 * (last) open modal dialog, else 'body'.
 */
export function overlayTeleportTarget(anchor, root = globalThis.document) {
	const fromAnchor = anchor?.closest?.('dialog[open]')
	if (fromAnchor) {
		return fromAnchor
	}
	const modals = [...(root?.querySelectorAll?.('dialog[open]') ?? [])].filter(isModalDialog)
	return modals.at(-1) ?? 'body'
}

/**
 * A ref holding the teleport target for an overlay, worked out each time isOpen() turns true (before
 * the overlay renders). anchor() returns the element the overlay is anchored to, when it has one.
 */
export function useOverlayTarget(isOpen, anchor = () => null) {
	const target = ref('body')
	watch(isOpen, (open) => {
		if (open) {
			target.value = overlayTeleportTarget(anchor())
		}
	}, { immediate: true })
	return target
}
