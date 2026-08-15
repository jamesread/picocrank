import { ref } from 'vue'

const DEFAULT_DELAY_MS = 500
const DEFAULT_MOVE_TOLERANCE_PX = 10

export function useLongPress(callback, options = {}) {
	const delayMs = options.delayMs ?? DEFAULT_DELAY_MS
	const moveTolerancePx = options.moveTolerancePx ?? DEFAULT_MOVE_TOLERANCE_PX

	const suppressClick = ref(false)
	let timer = null
	let startX = 0
	let startY = 0
	let pointerId = null

	function clearTimer() {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
	}

	function onPointerDown(event) {
		if (typeof callback !== 'function') {
			return
		}

		clearTimer()
		pointerId = event.pointerId
		startX = event.clientX
		startY = event.clientY

		timer = window.setTimeout(() => {
			timer = null
			suppressClick.value = true
			callback(event)
		}, delayMs)
	}

	function onPointerMove(event) {
		if (timer === null || event.pointerId !== pointerId) {
			return
		}

		const dx = Math.abs(event.clientX - startX)
		const dy = Math.abs(event.clientY - startY)
		if (dx > moveTolerancePx || dy > moveTolerancePx) {
			clearTimer()
		}
	}

	function onPointerUp() {
		clearTimer()
		pointerId = null
	}

	function onClick(event) {
		if (!suppressClick.value) {
			return
		}

		event.preventDefault()
		event.stopPropagation()
		suppressClick.value = false
	}

	return {
		suppressClick,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel: onPointerUp,
		onPointerLeave: onPointerUp,
		onClick,
	}
}
