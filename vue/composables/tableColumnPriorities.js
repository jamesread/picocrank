export function isValidColPriority(priority) {
	return Number.isInteger(priority) && priority >= 1 && priority <= 5
}

/** Default responsive priority by visible column index (0-based). First column has no auto priority. */
export function autoColumnPriorityForIndex(index) {
	if (index <= 0) {
		return null
	}
	if (index === 1) {
		return 5
	}
	if (index === 2) {
		return 4
	}
	if (index === 3) {
		return 3
	}
	if (index === 4) {
		return 2
	}
	return 1
}

export function defaultColumnPriorityForIndex(header, index, responsiveColumns = true) {
	if (isValidColPriority(header?.colPriority)) {
		return header.colPriority
	}
	if (!responsiveColumns) {
		return null
	}
	return autoColumnPriorityForIndex(index)
}
