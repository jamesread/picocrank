# Table

`Table` supports local data and remote `fetchRows` data. Existing usages remain
uncontrolled; pass any query-state prop to control that field independently.

## Query state

```vue
<Table
  v-model:sort-by="sortBy"
  v-model:sort-dir="sortDir"
  v-model:page="page"
  v-model:page-size="pageSize"
/>
```

`sortBy`, `sortDir`, `page`, and `pageSize` default to internal state when
omitted. Controlled values may be changed after mount. User actions emit the
corresponding `update:*` event. Sorting resets the page by default; set
`:reset-page-on-sort="false"` to preserve the current page. Page-size, data, and
filter changes continue to reset to page 1.

A sortable header can provide a value comparator:

```js
{
  key: 'version',
  sortable: true,
  comparator: (left, right, leftRow, rightRow) =>
    left.localeCompare(right, undefined, { numeric: true }),
}
```

The comparator defines ascending order and receives non-null cell values plus
their rows. `Table` reverses its result for descending order and keeps null
values last. `sortRows(rows, sortBy, sortDir, comparator)` accepts the same
optional comparator.

## Cells and display hooks

Named `#cell-{key}` slots and the generic `#cell` slot receive:

```ts
{ row, value, header, rowIndex, sourceIndex }
```

`rowIndex` is the index on the displayed page. For local data, `sourceIndex` is
the index in `data`; for remote data it is the index in the current response.

The `rowClass` and `rowStyle` callbacks receive
`{ row, rowIndex, sourceIndex }`. `cellClass`, `cellStyle`, and `cellAttrs`
receive that context plus `{ value, header }`. Return Vue-compatible class or
style values. `cellAttrs` is intended for attributes such as `title`, `aria-*`,
and `data-*`; use the dedicated class/style callbacks for those fields.
Header `class` continues to apply to both its header and body cells.

## Selection and active cells

`selectionClickMode` controls selectable-row clicks:

- `row` (default): row clicks toggle selection; Ctrl/Cmd also toggles and Shift
  selects a range on the displayed page.
- `checkbox`: only checkboxes change selection; row clicks emit `row-click`.
- `modifier`: Ctrl/Cmd toggles, Shift selects a displayed-page range, and an
  unmodified click emits `row-click`.
- `extended`: unmodified clicks replace the selection, Ctrl/Cmd toggles, and
  Shift adds a range on the displayed page. This matches desktop-style
  selection while leaving the default behavior unchanged.

The additive `row-click` payload is `{ row, index, event }`, where `event` is
the native click event.

`activeCell` is an optional controlled `{ rowKey, columnKey }` value:

```vue
<Table
  v-model:active-cell="activeCell"
  @cell-click="onCellClick"
/>
```

Clicking a data cell emits `cell-click` with the enriched cell context and adds
the visibly outlined `table-active-cell` class. The component ref exposes:

- `clearFilters()`
- `focusActiveCell(options?)` (returns whether a displayed active cell was focused)
- `clearActiveCell()`
- `activateCellAt(rowIndex, columnIndex, options?)`
- `moveActiveCell(rowDelta, columnDelta, options?)`
- `getActiveCellContext()`
- the existing `loadDeveloperDefaults()` and `layoutLabel`

Cell indices use `displayRows` and `visibleHeaders` and are clamped to the
displayed grid. Pass `{ wrapColumns: true }` to `moveActiveCell` to move from
the last column of one row to the first column of the next (or in reverse),
which is suitable for Tab/Shift+Tab. Pass `{ focus: true, focusOptions? }` to
activation or movement methods to focus the destination after Vue renders.
`getActiveCellContext()` returns the cell slot context plus `rowKey`,
`columnKey`, and `columnIndex`, or `null` when the active cell is not displayed.
