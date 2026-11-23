import { afterEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { overlayTeleportTarget, useOverlayTarget } from './overlayTarget.js'

function openDialog(id, { modal = true } = {}) {
	const dialog = document.createElement('dialog')
	dialog.id = id
	document.body.appendChild(dialog)
	if (modal) {
		dialog.showModal()
	} else {
		dialog.show()
	}
	// happy-dom answers false to :modal even after showModal(); browsers answer correctly.
	const matches = dialog.matches.bind(dialog)
	dialog.matches = selector => (selector === ':modal' ? modal : matches(selector))
	return dialog
}

afterEach(() => {
	document.body.innerHTML = ''
})

describe('overlayTeleportTarget', () => {
	it('uses body when no dialog is open', () => {
		const anchor = document.createElement('button')
		document.body.appendChild(anchor)
		expect(overlayTeleportTarget(anchor)).toBe('body')
		expect(overlayTeleportTarget(null)).toBe('body')
	})

	it('uses the open dialog holding the anchor', () => {
		const outer = openDialog('outer')
		const inner = openDialog('inner')
		const anchor = document.createElement('th')
		outer.appendChild(anchor)
		expect(overlayTeleportTarget(anchor)).toBe(outer)
		expect(inner.isConnected).toBe(true)
	})

	it('ignores a closed dialog around the anchor', () => {
		const closed = document.createElement('dialog')
		const anchor = document.createElement('th')
		closed.appendChild(anchor)
		document.body.appendChild(closed)
		expect(overlayTeleportTarget(anchor)).toBe('body')
	})

	it('ignores a non-modal dialog the anchor is not in', () => {
		openDialog('panel', { modal: false })
		expect(overlayTeleportTarget(null)).toBe('body')
	})

	it('uses the topmost modal dialog when there is no anchor in one', () => {
		openDialog('first')
		const last = openDialog('last')
		expect(overlayTeleportTarget(null)).toBe(last)
		const outside = document.createElement('div')
		document.body.appendChild(outside)
		expect(overlayTeleportTarget(outside)).toBe(last)
	})
})

describe('useOverlayTarget', () => {
	it('works the target out each time the overlay opens', async () => {
		const open = ref(false)
		const anchor = document.createElement('th')
		document.body.appendChild(anchor)
		const target = useOverlayTarget(() => open.value, () => anchor)
		expect(target.value).toBe('body')

		const dialog = openDialog('picker')
		dialog.appendChild(anchor)
		open.value = true
		await nextTick()
		expect(target.value).toBe(dialog)

		open.value = false
		await nextTick()
		document.body.appendChild(anchor)
		dialog.remove()
		open.value = true
		await nextTick()
		expect(target.value).toBe('body')
	})
})
