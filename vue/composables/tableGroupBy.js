export const EMPTY_GROUP_LABEL = '(empty)'

export function isHeaderGroupable(header, tableGroupable = true) {
	if (!tableGroupable || !header?.key) {
		return false
	}
	if (header.groupable === false) {
		return false
	}
	return true
}

export function groupableHeaders(headers = [], tableGroupable = true) {
	return headers.filter((header) => isHeaderGroupable(header, tableGroupable))
}

export function formatGroupValue(value) {
	if (value === null || value === undefined || value === '') {
		return EMPTY_GROUP_LABEL
	}
	return String(value)
}

export function normalizeGroupValue(value) {
	if (value === null || value === undefined || value === '') {
		return null
	}
	return value
}

export function buildGroupId(columnKey, value) {
	const normalized = normalizeGroupValue(value)
	return `${columnKey}::${normalized === null ? '' : String(normalized)}`
}

export function compareGroupValues(a, b) {
	const aEmpty = a === null || a === undefined || a === ''
	const bEmpty = b === null || b === undefined || b === ''
	if (aEmpty && bEmpty) {
		return 0
	}
	if (aEmpty) {
		return 1
	}
	if (bEmpty) {
		return -1
	}
	if (typeof a === 'number' && typeof b === 'number') {
		return a - b
	}
	if (typeof a === 'boolean' && typeof b === 'boolean') {
		return Number(a) - Number(b)
	}
	return String(a).localeCompare(String(b))
}

export function groupRowsByColumn(rows, columnKey) {
	if (!columnKey || rows.length === 0) {
		return []
	}

	const groups = new Map()
	const order = []

	for (const row of rows) {
		const value = normalizeGroupValue(row?.[columnKey])
		const groupId = buildGroupId(columnKey, value)
		if (!groups.has(groupId)) {
			const group = {
				columnKey,
				value,
				groupId,
				rows: [],
			}
			groups.set(groupId, group)
			order.push(groupId)
		}
		groups.get(groupId).rows.push(row)
	}

	return order.map((id) => groups.get(id))
}

export function paginateGroupedRows(rows, columnKey, page, pageSize) {
	if (!columnKey || pageSize <= 0) {
		return []
	}

	const groups = groupRowsByColumn(rows, columnKey)
	const start = (page - 1) * pageSize
	const end = start + pageSize
	let globalIndex = 0
	const pageGroups = []

	for (const group of groups) {
		const groupStart = globalIndex
		const groupEnd = globalIndex + group.rows.length
		const overlapStart = Math.max(start, groupStart)
		const overlapEnd = Math.min(end, groupEnd)

		if (overlapStart < overlapEnd) {
			const sliceStart = overlapStart - groupStart
			const sliceEnd = overlapEnd - groupStart
			pageGroups.push({
				...group,
				rows: group.rows.slice(sliceStart, sliceEnd),
				count: group.rows.length,
			})
		}

		globalIndex = groupEnd
	}

	return pageGroups
}

export function flattenGroups(groups, collapsedGroupIds = new Set(), sourceRows = null) {
	const rowIndexByReference = sourceRows
		? new Map(sourceRows.map((row, index) => [row, index]))
		: null
	const items = []

	for (const group of groups) {
		const collapsed = collapsedGroupIds.has(group.groupId)
		items.push({
			kind: 'group',
			columnKey: group.columnKey,
			value: group.value,
			groupId: group.groupId,
			count: group.count ?? group.rows.length,
			collapsed,
		})

		if (!collapsed) {
			for (const row of group.rows) {
				items.push({
					kind: 'row',
					row,
					sourceIndex: rowIndexByReference?.get(row) ?? null,
				})
			}
		}
	}

	return items
}

export function buildDisplayBodyItems(rows, {
	groupBy = null,
	page = 1,
	pageSize = 10,
	paginate = true,
	collapsedGroupIds = new Set(),
} = {}) {
	if (!groupBy) {
		const dataRows = paginate
			? rows.slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize)
			: rows

		const startIndex = paginate ? (page - 1) * pageSize : 0
		return dataRows.map((row, index) => ({
			kind: 'row',
			row,
			sourceIndex: startIndex + index,
		}))
	}

	const groups = paginate
		? paginateGroupedRows(rows, groupBy, page, pageSize)
		: groupRowsByColumn(rows, groupBy)

	return flattenGroups(groups, collapsedGroupIds, rows)
}
