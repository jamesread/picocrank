import { ref } from 'vue'

export const NOTIFICATION_POPUPS_KEY = Symbol('notificationPopups')

const DEFAULT_DURATION_MS = 5000

export const notificationPopups = ref([])
const timers = new Map()
let nextId = 0

function clearTimer(id) {
	const timer = timers.get(id)
	if (timer !== undefined) {
		clearTimeout(timer)
		timers.delete(id)
	}
}

export function dismissNotificationPopup(id) {
	clearTimer(id)
	notificationPopups.value = notificationPopups.value.filter((popup) => popup.id !== id)
}

export function dismissAllNotificationPopups() {
	for (const popup of notificationPopups.value) {
		clearTimer(popup.id)
	}
	notificationPopups.value = []
}

export function showNotificationPopup(options = {}) {
	const message = options.message?.trim()
	if (!message) {
		console.warn('[NotificationPopups] show() requires a message.')
		return null
	}

	const id = options.id || `notification-popup-${Date.now()}-${nextId++}`
	const popup = {
		id,
		message,
		label: options.label || null,
		class: options.class || 'info',
		linkTo: options.linkTo || null,
		linkLabel: options.linkLabel || null,
		durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
	}

	notificationPopups.value = [...notificationPopups.value, popup]

	const durationMs = popup.durationMs
	if (durationMs > 0) {
		const timer = setTimeout(() => dismissNotificationPopup(id), durationMs)
		timers.set(id, timer)
	}

	return id
}

/**
 * Access the global notification popup stack.
 * Requires `<NotificationPopups />` to be mounted (typically in App.vue).
 */
export function useNotificationPopups() {
	return {
		popups: notificationPopups,
		show: showNotificationPopup,
		dismiss: dismissNotificationPopup,
		dismissAll: dismissAllNotificationPopups,
	}
}

export function clearNotificationPopupTimers() {
	for (const timer of timers.values()) {
		clearTimeout(timer)
	}
	timers.clear()
}
