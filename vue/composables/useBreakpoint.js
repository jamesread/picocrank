import { useMediaQuery } from './useMediaQuery.js'

/**
 * PicoCrank's one "narrow screen" breakpoint (phones and small tablets), in px.
 * CSS cannot read this value, so media queries in PicoCrank styles repeat it
 * as `@media (max-width: 768px)`; keep them in step when changing it.
 */
export const NARROW_MAX_WIDTH = 768

/** Media query matching narrow screens. */
export const NARROW_QUERY = `(max-width: ${NARROW_MAX_WIDTH}px)`

/** Reactive `true` while the viewport is narrow (see NARROW_QUERY). */
export function useIsNarrow() {
	return useMediaQuery(NARROW_QUERY)
}
