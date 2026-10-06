import { computed, toValue } from 'vue'
import { useMediaQuery } from './useMediaQuery.js'

/** Matches Sidebar mobile breakpoint. */
export const MOBILE_NAV_QUERY = '(max-width: 768px)'

/**
 * Mobile nav precedence:
 * - Sidebar + top bar → sidebar wins; top bar is hidden
 * - Top bar only → top bar wins; Header mounts a fallback sidebar
 * - Sidebar only → sidebar
 *
 * Explicit sidebar mounting stays with the app. Header owns the top-bar-only
 * mobile fallback via `needsFallbackSidebar`.
 */
export function useResponsiveNav(sidebarEnabled, topBarEnabled, topBarSpaceLimited) {
	const isMobile = useMediaQuery(MOBILE_NAV_QUERY)

	const hasExplicitSidebar = computed(() => !!toValue(sidebarEnabled))
	const topBarOnly = computed(
		() => !!toValue(topBarEnabled) && !toValue(sidebarEnabled),
	)

	const topBarCrowded = computed(() => !!toValue(topBarSpaceLimited))

	const needsFallbackSidebar = computed(
		() => topBarOnly.value && (isMobile.value || topBarCrowded.value),
	)

	const showSidebarChrome = computed(
		() => hasExplicitSidebar.value || needsFallbackSidebar.value,
	)

	const showTopBar = computed(
		() => !!toValue(topBarEnabled) && !isMobile.value && !topBarCrowded.value,
	)

	return {
		isMobile,
		showTopBar,
		showSidebarChrome,
		needsFallbackSidebar,
	}
}
