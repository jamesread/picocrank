import {
	applyColumnFilter,
	filterEntrySpec,
	isFilterActive,
	isFilterEntryActive,
	normalizeColumnFilterEntries,
	normalizeFilter,
} from './tableFilters.js'

export const FILTER_QUERY_VERSION = 1

/** @see docs/filter-query-v1.md */

export function createEmptyFilterQuery() {
	return {
		version: FILTER_QUERY_VERSION,
		match: 'all',
		columns: [],
	}
}

function normalizeFilterSpec(entry, header, rows) {
	if (!entry || typeof entry !== 'object') {
		return null
	}

	const { id, name, enabled, ...partial } = entry
	const filter = normalizeFilter(header, partial, rows)
	if (!filter) {
		return null
	}

	return {
		id: typeof id === 'string' ? id : undefined,
		name: typeof name === 'string' ? name : '',
		enabled: enabled !== false,
		...filter,
	}
}

export function normalizeFilterQuery(filterQuery, headers = [], rows = []) {
	if (!filterQuery || typeof filterQuery !== 'object') {
		return createEmptyFilterQuery()
	}

	const headerByKey = new Map(
		headers
			.filter((header) => header?.key)
			.map((header) => [header.key, header]),
	)

	const columns = Array.isArray(filterQuery.columns)
		? filterQuery.columns
			.map((column) => {
				if (!column?.key || !headerByKey.has(column.key)) {
					return null
				}

				const header = headerByKey.get(column.key)
				if (header.filterable === false) {
					return null
				}

				const filters = Array.isArray(column.filters)
					? column.filters
						.map((entry) => normalizeFilterSpec(entry, header, rows))
						.filter(Boolean)
					: []

				if (filters.length === 0) {
					return null
				}

				return {
					key: column.key,
					match: column.match === 'any' ? 'any' : 'all',
					filters,
				}
			})
			.filter(Boolean)
		: []

	return {
		version: FILTER_QUERY_VERSION,
		match: filterQuery.match === 'any' ? 'any' : 'all',
		columns,
	}
}

export function buildFilterQuery(filters = {}, headers = [], rows = [], { includeInactive = true } = {}) {
	const headerByKey = new Map(
		headers
			.filter((header) => header?.key)
			.map((header) => [header.key, header]),
	)

	const columns = []

	for (const [key, columnFilters] of Object.entries(filters ?? {})) {
		const header = headerByKey.get(key)
		if (!header || header.filterable === false) {
			continue
		}

		const entries = normalizeColumnFilterEntries(columnFilters, header, rows)
			.map((entry) => normalizeFilterSpec(entry, header, rows))
			.filter(Boolean)
			.filter((entry) => includeInactive || isFilterEntryActive(entry))

		if (entries.length === 0) {
			continue
		}

		columns.push({
			key,
			match: 'all',
			filters: entries,
		})
	}

	return {
		version: FILTER_QUERY_VERSION,
		match: 'all',
		columns,
	}
}

export function filterQueryToFilters(filterQuery, headers = [], rows = []) {
	const normalized = normalizeFilterQuery(filterQuery, headers, rows)
	const filters = {}

	for (const column of normalized.columns) {
		filters[column.key] = column.filters.map((entry) => ({ ...entry }))
	}

	return filters
}

function applyColumnFilterQuery(row, header, columnQuery) {
	const activeFilters = (columnQuery.filters ?? [])
		.filter((entry) => entry.enabled !== false)
		.map((entry) => filterEntrySpec(entry))
		.filter((filter) => isFilterActive(filter))

	if (activeFilters.length === 0) {
		return true
	}

	if (columnQuery.match === 'any') {
		return activeFilters.some((filter) => applyColumnFilter(row, header, filter))
	}

	return activeFilters.every((filter) => applyColumnFilter(row, header, filter))
}

export function applyFilterQuery(rows, headers = [], filterQuery) {
	const normalized = normalizeFilterQuery(filterQuery, headers, rows)
	if (normalized.columns.length === 0) {
		return rows
	}

	const headerByKey = new Map(
		headers
			.filter((header) => header?.key)
			.map((header) => [header.key, header]),
	)

	return rows.filter((row) => {
		const columnResults = normalized.columns.map((column) => {
			const header = headerByKey.get(column.key)
			if (!header) {
				return true
			}
			return applyColumnFilterQuery(row, header, column)
		})

		if (normalized.match === 'any') {
			return columnResults.some(Boolean)
		}

		return columnResults.every(Boolean)
	})
}

export function countActiveFilterQuery(filterQuery, headers = [], rows = []) {
	const normalized = normalizeFilterQuery(filterQuery, headers, rows)
	let total = 0

	for (const column of normalized.columns) {
		total += column.filters.filter((entry) => isFilterEntryActive(entry)).length
	}

	return total
}

export function isFilterQueryActive(filterQuery, headers = [], rows = []) {
	return countActiveFilterQuery(filterQuery, headers, rows) > 0
}

export function cloneFilterQuery(filterQuery) {
	return JSON.parse(JSON.stringify(filterQuery ?? createEmptyFilterQuery()))
}
