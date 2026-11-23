/**
 * How a Table header is labelled.
 *
 * A header without a `label` shows its `key`; one whose `label` is an empty string shows nothing
 * (e.g. an actions or remove column). `ariaLabel` names a column for assistive technology and in
 * menus (filter and column options) when its visible label is blank or not descriptive.
 */

/** The text shown in the header cell. */
export function headerDisplayLabel(header) {
	if (header == null) {
		return ''
	}
	if (typeof header !== 'object') {
		return String(header)
	}
	return header.label ?? header.key ?? ''
}

/** The column's name for assistive technology and menus: never blank when the header has a key. */
export function headerAccessibleName(header) {
	if (header == null) {
		return ''
	}
	if (typeof header !== 'object') {
		return String(header)
	}
	return header.ariaLabel || header.label || header.key || ''
}
