# Table filterQuery v1

Canonical wire format for PicoCrank `Table` column filters. Use **`filterQuery`** in remote integrations (`fetchRows`, server persistence). The table builds this object from UI state; client-side tables apply it with `applyFilterQuery`.

Implementation: [`vue/composables/tableFilterQuery.js`](../vue/composables/tableFilterQuery.js).

Live reference: [`vue/examples/TableRemoteExample.vue`](../vue/examples/TableRemoteExample.vue) (`fetchRows` logs `query.filterQuery`).

## Query payload

Remote `fetchRows` and `@query-change` (when `fetchRows` is set) receive:

```ts
{
  page: number
  pageSize: number
  sortBy: string | null
  sortDir: 'asc' | 'desc'
  filterQuery: FilterQueryV1
}
```

> **Deprecation:** In **remote mode**, `filters` is **not** included in the query object. Read `filterQuery` only. Local (non-remote) `@query-change` still emits `filters` for backward compatibility; prefer `filterQuery` for new code.

## FilterQueryV1 shape

```json
{
  "version": 1,
  "match": "all",
  "columns": [
    {
      "key": "name",
      "match": "all",
      "filters": [
        {
          "id": "filter-…",
          "name": "Managers",
          "enabled": true,
          "type": "text",
          "operator": "contains",
          "value": "Alice"
        }
      ]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | `1` | Schema version. Always `1` for v1. |
| `match` | `'all' \| 'any'` | How to combine **columns**. `'all'` = every column group must match (AND). `'any'` = at least one column group matches (OR). UI-built queries use `'all'`. |
| `columns` | array | Non-empty list of per-column filter groups. Unknown or non-filterable columns are dropped on normalize. |
| `columns[].key` | string | Header `key`. |
| `columns[].match` | `'all' \| 'any'` | How to combine **filters within the column**. `'all'` = every enabled filter must match (AND). `'any'` = at least one enabled filter matches (OR). UI-built queries use `'all'`. |
| `columns[].filters` | array | One or more filter entries (see below). |

### Filter entry fields

| Field | Required | Description |
|-------|----------|-------------|
| `type` | yes | `'text'`, `'number'`, `'boolean'`, or `'select'`. Usually matches header `filterType`. |
| `enabled` | no | Default `true`. Disabled entries are ignored when applying. |
| `id` | no | Stable id for UI toggling; safe to ignore on the server. |
| `name` | no | Optional display label from the filter popover. |
| `operator` | text/number | See operators below. |
| `value` | text/number/boolean | Comparison value. |
| `values` | select | Array of selected values (OR within the select filter: row value must match **any** selected value). |

Inactive or invalid entries (empty text, invalid number, empty select) are omitted when the query is built from UI state.

## Filter types and operators

### Text (`type: 'text'`)

Case-insensitive comparison on stringified cell values.

| `operator` | Meaning |
|------------|---------|
| `contains` | Cell contains substring (default). |
| `equals` | Cell equals string (case-insensitive). |
| `startsWith` | Cell starts with string. |
| `empty` | Cell is empty / whitespace only (`value` ignored). |

### Number (`type: 'number'`)

Numeric comparison; non-numeric cells do not match.

| `operator` | Meaning |
|------------|---------|
| `eq` | Equal (default). |
| `gt` | Greater than. |
| `gte` | Greater or equal. |
| `lt` | Less than. |
| `lte` | Less or equal. |

### Boolean (`type: 'boolean'`)

| `value` | Meaning |
|---------|---------|
| `true` | Cell is truthy. |
| `false` | Cell is falsy. |

### Select (`type: 'select'`)

| Field | Meaning |
|-------|---------|
| `values` | Non-empty array. Row matches if cell value equals **any** entry (strict or string-coerced equality). |

## Matching semantics (summary)

1. For each **column** in `columns`, evaluate enabled filters using that column’s `match` (`all` / `any`).
2. Combine column results using top-level `match` (`all` / `any`).
3. Columns with no active filters are ignored.

Default UI behavior: **AND** across columns, **AND** across filters on the same column.

## JavaScript helpers

```js
import {
  buildFilterQuery,
  normalizeFilterQuery,
  applyFilterQuery,
  filterQueryToFilters,
  countActiveFilterQuery,
  isFilterQueryActive,
  cloneFilterQuery,
  FILTER_QUERY_VERSION,
} from '../composables/tableFilterQuery.js'
```

| Function | Purpose |
|----------|---------|
| `buildFilterQuery(filters, headers, rows)` | UI storage `{ [columnKey]: entries[] }` → `FilterQueryV1`. |
| `normalizeFilterQuery(filterQuery, headers, rows)` | Validate, drop unknown columns, normalize filter specs. |
| `applyFilterQuery(rows, headers, filterQuery)` | Client-side row filtering (same semantics as the table). |
| `filterQueryToFilters(filterQuery, headers, rows)` | Convert back to UI storage shape (e.g. after loading from an API). |
| `countActiveFilterQuery(filterQuery, headers, rows)` | Count enabled, active filters. |

## Remote `fetchRows` example

```js
async function fetchRows(query, { signal }) {
  // query.filterQuery — use this, not query.filters
  const res = await api.listRows({
    page: query.page,
    pageSize: query.pageSize,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    filterQuery: query.filterQuery,
    signal,
  })
  return { rows: res.rows, total: res.total }
}
```

To mirror client semantics in Node without reimplementing operators, reuse `applyFilterQuery` on an in-memory dataset (as in `TableRemoteExample`), or port the logic to your query layer.

## Layout presets vs filterQuery

Saved layouts (localStorage or `layoutPresets` callbacks) store **`filters`** (UI storage shape) inside `state`, not `filterQuery`. When a preset is applied, the table rebuilds `filterQuery` automatically. Server-side layout persistence can store either:

- **`state.filters`** — round-trips the table UI exactly, or  
- **`filterQuery`** — if you control load/save; convert with `filterQueryToFilters` before `setFilters` if needed.

## Header configuration

Set `filterType` on headers for remote tables (empty `:data` cannot infer types):

```js
{ key: 'age', label: 'Age', filterable: true, filterType: 'number' }
{ key: 'city', label: 'City', filterable: true, filterType: 'select', filterOptions: […] }
```

## Versioning

- **v1** (`version: 1`): current schema.  
- Servers should ignore unknown top-level fields and reject unsupported `version` values explicitly if strict validation is required.
