import { ref, onUnmounted } from 'vue'

/** Shared matchMedia state keyed by query string. */
const stores = new Map()

/**
 * Reactive match for a CSS media query (e.g. '(max-width: 768px)').
 * Identical queries share one listener so callers stay in sync.
 */
export function useMediaQuery(query) {
	let store = stores.get(query)

	if (!store) {
		const getMatches = () =>
			typeof window !== 'undefined' && window.matchMedia(query).matches

		const matches = ref(getMatches())
		let mediaQueryList = null

		function onChange(event) {
			matches.value = event.matches
		}

		if (typeof window !== 'undefined') {
			mediaQueryList = window.matchMedia(query)
			matches.value = mediaQueryList.matches
			mediaQueryList.addEventListener('change', onChange)
		}

		store = {
			matches,
			mediaQueryList,
			onChange,
			subscriberCount: 0,
		}
		stores.set(query, store)
	}

	store.subscriberCount += 1

	onUnmounted(() => {
		store.subscriberCount -= 1
		if (store.subscriberCount <= 0 && store.mediaQueryList) {
			store.mediaQueryList.removeEventListener('change', store.onChange)
			stores.delete(query)
		}
	})

	return store.matches
}
