import { nextTick, onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue'

const MEASURING_CLASS = 'toolbar-overflow-measuring'

const FOCUSABLE = [
	'button:not([disabled])',
	'a[href]',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Width of a toolbar laid out in one row at its natural size, whether it is
 * currently inline or collapsed into its menu. The measuring class is removed
 * again synchronously, so the browser never paints it.
 */
export function measureNaturalWidth(element) {
	if (!element) return 0
	element.classList.add(MEASURING_CLASS)
	const width = element.offsetWidth
	element.classList.remove(MEASURING_CLASS)
	return width
}

/**
 * Collapses a toolbar into a menu behind a toggle button when it does not fit.
 *
 * The toolbar element itself becomes the menu (styled by the global
 * `.toolbar-overflow-menu` rules), so slotted controls keep their handlers and
 * state. Bind in the template:
 *
 * - toolbar: `:class="menuClasses"`, `@click="onToolbarClick"`, `@keydown="onKeydown"`
 * - toggle (rendered while `collapsed`): `@click="toggleMenu"`, `@keydown="onKeydown"`,
 *   `:aria-expanded="menuOpen ? 'true' : 'false'"`
 *
 * @param {object} options
 * @param {import('vue').Ref<HTMLElement|null>} options.rootRef Clicks outside it close the menu; resizes re-measure.
 * @param {import('vue').Ref<HTMLElement|null>} options.toolbarRef The toolbar (and menu) element.
 * @param {import('vue').Ref<HTMLElement|null>} options.toggleRef The menu button.
 * @param {() => boolean} options.fits Whether the toolbar fits inline now.
 * @param {import('vue').MaybeRefOrGetter<boolean>} [options.enabled] Collapsing allowed (default true).
 */
export function useToolbarOverflow({ rootRef, toolbarRef, toggleRef, fits, enabled = true }) {
	const collapsed = ref(false)
	const menuOpen = ref(false)

	let resizeObserver = null
	let mutationObserver = null
	let frame = 0

	function update() {
		frame = 0
		if (!toValue(enabled)) {
			collapsed.value = false
			return
		}
		// The open menu is laid out as a column; keep the state until it closes.
		if (menuOpen.value) return
		const toolbar = toolbarRef.value
		if (!toolbar || toolbar.children.length === 0) {
			collapsed.value = false
			return
		}
		collapsed.value = !fits()
	}

	function scheduleUpdate() {
		if (frame) return
		if (typeof requestAnimationFrame === 'function') {
			frame = requestAnimationFrame(update)
		} else {
			update()
		}
	}

	function openMenu() {
		menuOpen.value = true
		void nextTick(() => toolbarRef.value?.querySelector(FOCUSABLE)?.focus())
	}

	function closeMenu({ focusToggle = false } = {}) {
		if (!menuOpen.value) return
		menuOpen.value = false
		if (focusToggle) toggleRef.value?.focus()
		scheduleUpdate()
	}

	function toggleMenu() {
		if (menuOpen.value) closeMenu()
		else openMenu()
	}

	/** Choosing an action closes the menu; controls that open their own popups do not. */
	function onToolbarClick(event) {
		if (!collapsed.value || !menuOpen.value) return
		const control = event.target?.closest?.('button, a')
		if (!control || !toolbarRef.value?.contains(control)) return
		if (control.hasAttribute('aria-haspopup') || control.hasAttribute('aria-expanded')) return
		closeMenu()
	}

	function onKeydown(event) {
		if (event.key !== 'Escape' || !collapsed.value || !menuOpen.value) return
		event.stopPropagation()
		closeMenu({ focusToggle: true })
	}

	function onDocumentPointerDown(event) {
		if (!menuOpen.value) return
		if (rootRef.value?.contains(event.target)) return
		closeMenu()
	}

	watch(collapsed, (value) => {
		if (!value) menuOpen.value = false
	})

	watch(() => toValue(enabled), scheduleUpdate)

	onMounted(() => {
		update()
		if (typeof ResizeObserver === 'function') {
			resizeObserver = new ResizeObserver(scheduleUpdate)
			if (rootRef.value) resizeObserver.observe(rootRef.value)
			if (toolbarRef.value) resizeObserver.observe(toolbarRef.value)
		}
		if (typeof MutationObserver === 'function' && toolbarRef.value) {
			mutationObserver = new MutationObserver(scheduleUpdate)
			mutationObserver.observe(toolbarRef.value, {
				childList: true,
				subtree: true,
				characterData: true,
			})
		}
		document.addEventListener('pointerdown', onDocumentPointerDown)
	})

	onBeforeUnmount(() => {
		resizeObserver?.disconnect()
		mutationObserver?.disconnect()
		if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
		document.removeEventListener('pointerdown', onDocumentPointerDown)
	})

	return {
		collapsed,
		menuOpen,
		update,
		scheduleUpdate,
		openMenu,
		closeMenu,
		toggleMenu,
		onToolbarClick,
		onKeydown,
	}
}
