const TEXT_OPERATORS = ['contains', 'equals', 'startsWith', 'empty']
const NUMBER_OPERATORS = ['eq', 'gt', 'gte', 'lt', 'lte']

const TEXT_OPERATOR_LABELS = {
	contains: 'Contains',
	equals: 'Equals',
	startsWith: 'Starts with',
	empty: 'Is empty',
}

const NUMBER_OPERATOR_LABELS = {
	eq: 'Equals',
	gt: 'Greater than',
	gte: 'Greater or equal',
	lt: 'Less than',
	lte: 'Less or equal',
}

let filterIdCounter = 0

export function createFilterId() {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return `filter-${crypto.randomUUID()}`
	}

	filterIdCounter += 1
	return `filter-${filterIdCounter}-${Date.now()}`
}

export function inferFilterType(header, rows = []) {
	if (!header) {
		return 'text'
	}

	if (header.filterType) {
		return header.filterType
	}

	const key = header.key
	for (const row of rows) {
		const value = row?.[key]
		if (value === null || value === undefined) {
			continue
		}
		if (typeof value === 'boolean') {
			return 'boolean'
		}
		if (typeof value === 'number') {
			return 'number'
		}
		break
	}

	return 'text'
}

export function createEmptyFilter(header, rows = []) {
	const type = inferFilterType(header, rows)

	switch (type) {
		case 'number':
			return { type: 'number', operator: 'eq', value: null }
		case 'boolean':
			return { type: 'boolean', value: null }
		case 'select':
			return { type: 'select', values: [] }
		default:
			return { type: 'text', operator: 'contains', value: '' }
	}
}

export function normalizeFilter(header, partial, rows = []) {
	if (!partial) {
		return null
	}

	const type = partial.type || inferFilterType(header, rows)

	switch (type) {
		case 'number': {
			const operator = NUMBER_OPERATORS.includes(partial.operator) ? partial.operator : 'eq'
			const raw = partial.value
			const value = raw === '' || raw === null || raw === undefined ? null : Number(raw)
			if (value === null || Number.isNaN(value)) {
				return null
			}
			return { type: 'number', operator, value }
		}
		case 'boolean': {
			if (partial.value === null || partial.value === undefined || partial.value === 'any') {
				return null
			}
			return { type: 'boolean', value: Boolean(partial.value) }
		}
		case 'select': {
			const values = Array.isArray(partial.values)
				? partial.values.filter((value) => value !== null && value !== undefined && value !== '')
				: []
			if (values.length === 0) {
				return null
			}
			return { type: 'select', values }
		}
		default: {
			const operator = TEXT_OPERATORS.includes(partial.operator) ? partial.operator : 'contains'
			const value = partial.value == null ? '' : String(partial.value)
			if (operator === 'empty') {
				return { type: 'text', operator: 'empty', value: '' }
			}
			if (value.trim() === '') {
				return null
			}
			return { type: 'text', operator, value }
		}
	}
}

export function filterEntrySpec(entry) {
	if (!entry || typeof entry !== 'object') {
		return null
	}

	const { id, name, enabled, ...filter } = entry
	return filter
}

export function normalizeStoredFilterEntry(header, entry, rows = []) {
	if (!entry || typeof entry !== 'object') {
		return null
	}

	const { id, name, enabled, ...partial } = entry
	const filter = normalizeFilter(header, partial, rows)
	if (!filter) {
		return null
	}

	return {
		id: id || createFilterId(),
		name: typeof name === 'string' ? name : '',
		enabled: enabled !== false,
		...filter,
	}
}

export function normalizeColumnFilterEntries(value, header = null, rows = []) {
	if (!value) {
		return []
	}

	if (Array.isArray(value)) {
		return value
			.map((entry) => normalizeStoredFilterEntry(header, entry, rows))
			.filter(Boolean)
	}

	if (typeof value === 'object' && value.type) {
		const filter = header ? normalizeFilter(header, value, rows) : value
		if (!filter || !isFilterActive(filter)) {
			return []
		}

		return [{
			id: value.id || createFilterId(),
			name: typeof value.name === 'string' ? value.name : '',
			enabled: value.enabled !== false,
			...filter,
		}]
	}

	return []
}

export function createFilterEntry(header, partial, rows = [], { name = '' } = {}) {
	const filter = normalizeFilter(header, partial, rows)
	if (!filter) {
		return null
	}

	return {
		id: createFilterId(),
		name: typeof name === 'string' ? name.trim() : '',
		enabled: true,
		...filter,
	}
}

export function describeFilter(header, entry) {
	const filter = filterEntrySpec(entry)
	if (!filter) {
		return 'Filter'
	}

	const label = header?.label || header?.key || 'Column'

	switch (filter.type) {
		case 'text':
			if (filter.operator === 'empty') {
				return `${label} is empty`
			}
			return `${TEXT_OPERATOR_LABELS[filter.operator] || 'Contains'} “${filter.value}”`
		case 'number':
			return `${NUMBER_OPERATOR_LABELS[filter.operator] || 'Equals'} ${filter.value}`
		case 'boolean':
			return filter.value ? 'Yes' : 'No'
		case 'select':
			return `${filter.values.length} selected`
		default:
			return 'Filter'
	}
}

export function isFilterActive(filter) {
	if (!filter) {
		return false
	}

	switch (filter.type) {
		case 'text':
			return filter.operator === 'empty' || String(filter.value ?? '').trim() !== ''
		case 'number':
			return filter.value !== null && filter.value !== undefined && !Number.isNaN(filter.value)
		case 'boolean':
			return filter.value === true || filter.value === false
		case 'select':
			return Array.isArray(filter.values) && filter.values.length > 0
		default:
			return false
	}
}

export function isFilterEntryActive(entry) {
	return entry?.enabled !== false && isFilterActive(filterEntrySpec(entry))
}

export function isColumnFiltered(columnValue, header = null, rows = []) {
	return normalizeColumnFilterEntries(columnValue, header, rows)
		.some((entry) => isFilterEntryActive(entry))
}

export function countActiveFilters(filters = {}, headers = [], rows = []) {
	const headerByKey = new Map(headers.map((header) => [header.key, header]))
	let total = 0

	for (const [key, value] of Object.entries(filters ?? {})) {
		const header = headerByKey.get(key) ?? { key }
		total += normalizeColumnFilterEntries(value, header, rows)
			.filter((entry) => isFilterEntryActive(entry))
			.length
	}

	return total
}

function compareText(value, filter) {
	const text = value == null ? '' : String(value)
	const needle = String(filter.value ?? '')
	const haystack = text.toLowerCase()
	const search = needle.toLowerCase()

	switch (filter.operator) {
		case 'equals':
			return haystack === search
		case 'startsWith':
			return haystack.startsWith(search)
		case 'empty':
			return text.trim() === ''
		case 'contains':
		default:
			return haystack.includes(search)
	}
}

function compareNumber(value, filter) {
	if (value === null || value === undefined || Number.isNaN(Number(value))) {
		return false
	}

	const numeric = Number(value)
	const target = Number(filter.value)

	switch (filter.operator) {
		case 'gt':
			return numeric > target
		case 'gte':
			return numeric >= target
		case 'lt':
			return numeric < target
		case 'lte':
			return numeric <= target
		case 'eq':
		default:
			return numeric === target
	}
}

export function applyColumnFilter(row, header, filter) {
	if (!isFilterActive(filter)) {
		return true
	}

	const value = row?.[header.key]

	switch (filter.type) {
		case 'number':
			return compareNumber(value, filter)
		case 'boolean':
			return Boolean(value) === filter.value
		case 'select':
			return filter.values.some((selected) => selected === value || String(selected) === String(value))
		case 'text':
		default:
			return compareText(value, filter)
	}
}

export function applyColumnFilterEntries(row, header, entries) {
	const activeFilters = normalizeColumnFilterEntries(entries, header)
		.filter((entry) => isFilterEntryActive(entry))
		.map((entry) => filterEntrySpec(entry))

	if (activeFilters.length === 0) {
		return true
	}

	return activeFilters.every((filter) => applyColumnFilter(row, header, filter))
}

export function applyFilters(rows, headers, filters) {
	if (!filters || Object.keys(filters).length === 0) {
		return rows
	}

	const headerByKey = new Map(headers.map((header) => [header.key, header]))

	return rows.filter((row) => {
		for (const [key, columnFilters] of Object.entries(filters)) {
			const header = headerByKey.get(key)
			if (!header) {
				continue
			}
			if (!applyColumnFilterEntries(row, header, columnFilters)) {
				return false
			}
		}
		return true
	})
}

export function buildSelectOptions(rows, header) {
	if (Array.isArray(header.filterOptions) && header.filterOptions.length > 0) {
		return header.filterOptions.map((option) => {
			if (typeof option === 'string' || typeof option === 'number') {
				return { value: option, label: String(option) }
			}
			return {
				value: option.value,
				label: option.label ?? String(option.value),
			}
		})
	}

	const seen = new Set()
	const options = []

	for (const row of rows) {
		const value = row?.[header.key]
		if (value === null || value === undefined || value === '') {
			continue
		}
		const key = String(value)
		if (seen.has(key)) {
			continue
		}
		seen.add(key)
		options.push({ value, label: String(value) })
	}

	return options.sort((a, b) => a.label.localeCompare(b.label))
}

export function cloneFilters(filters = {}) {
	return JSON.parse(JSON.stringify(filters ?? {}))
}

export function cloneColumnFilterEntries(value, header = null, rows = []) {
	return normalizeColumnFilterEntries(value, header, rows).map((entry) => ({ ...entry }))
}

export function sortRows(rows, sortBy, sortDir) {
	if (!sortBy) {
		return [...rows]
	}

	return [...rows].sort((a, b) => {
		const av = a[sortBy]
		const bv = b[sortBy]

		if (av === bv) return 0
		if (av === null || av === undefined) return 1
		if (bv === null || bv === undefined) return -1
		if (typeof av === 'string' && typeof bv === 'string') {
			return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
		}
		if (typeof av === 'number' && typeof bv === 'number') {
			return sortDir === 'asc' ? av - bv : bv - av
		}
		if (typeof av === 'boolean' && typeof bv === 'boolean') {
			return sortDir === 'asc' ? (av ? 1 : 0) - (bv ? 1 : 0) : (bv ? 1 : 0) - (av ? 1 : 0)
		}
		if (av < bv) return sortDir === 'asc' ? -1 : 1
		if (av > bv) return sortDir === 'asc' ? 1 : -1
		return 0
	})
}
