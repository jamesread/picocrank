import { nextTick, onMounted, onUnmounted, ref, toValue, watch } from 'vue'

function headerGapTotal(headerEl) {
	const style = getComputedStyle(headerEl)
	const gap = parseFloat(style.columnGap || style.gap) || 0
	return gap * Math.max(0, headerEl.children.length - 1)
}

function childrenWidth(headerEl, except = null) {
	let width = 0
	for (const child of headerEl.children) {
		if (child === except) {
			continue
		}
		width += child.getBoundingClientRect().width
	}
	return width
}

/**
 * Hides the header top bar when link row would wrap or clip (measures against header width).
 * `active` should stay true while the top bar is eligible (enabled and not mobile-only hidden).
 */
export function useHeaderTopBarFit(headerRef, active, spaceLimitedOut) {
	const internalLimited = ref(false)
	const spaceLimited = spaceLimitedOut ?? internalLimited
	const requiredWidth = ref(0)
	let observer = null

	function update() {
		if (!toValue(active)) {
			spaceLimited.value = false
			requiredWidth.value = 0
			return
		}

		const headerEl = headerRef.value
		if (!headerEl) {
			return
		}

		const topBarNav = headerEl.querySelector(':scope > nav.topbar')

		if (topBarNav) {
			const links = topBarNav.querySelector('.topbar-links')
			if (!links) {
				return
			}

			requiredWidth.value = Math.ceil(links.scrollWidth)
			const fitsInRow = links.scrollWidth <= links.clientWidth + 1
			const others = childrenWidth(headerEl, topBarNav)
			const available = headerEl.clientWidth - others - headerGapTotal(headerEl)
			const fitsInHeader = requiredWidth.value <= available + 1
			spaceLimited.value = !fitsInRow || !fitsInHeader
			return
		}

		if (requiredWidth.value <= 0) {
			spaceLimited.value = false
			return
		}

		const others = childrenWidth(headerEl)
		const available = headerEl.clientWidth - others - headerGapTotal(headerEl)
		spaceLimited.value = requiredWidth.value > available + 1
	}

	watch(
		() => toValue(active),
		() => nextTick(update),
	)

	onMounted(() => {
		const headerEl = headerRef.value
		if (!headerEl) {
			return
		}

		observer = new ResizeObserver(() => update())
		observer.observe(headerEl)
		nextTick(update)
	})

	onUnmounted(() => {
		observer?.disconnect()
		observer = null
	})

	return { spaceLimited, remeasure: update }
}
