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

## Column resize

Hover a data-column header to reveal a drag handle on its right edge. Drag to
set a pixel width; the first drag freezes sibling column widths so only the
active column changes. Double-click the handle to clear that column’s width and
return it to browser auto sizing. Set `resizable: false` on a header to hide its
handle. Initial widths still come from optional `header.width`. While any
column has a resized width, overflowing header and cell content is clipped with
ellipsis.

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

Clicking a data cell emits `cell-click` with the enriched cell context, focuses
the cell when the click target is not interactive, and adds the visibly outlined
`table-active-cell` class. While an active cell is focused, arrow keys move
selection within the displayed grid (with focus following).

Sortable headers expose `aria-sort` (`none` / `ascending` / `descending`).
Filterable headers use `aria-haspopup="dialog"` and `aria-expanded`. The table
sets `aria-busy` while loading and `aria-colcount` for the visible column count
(including select and column-options columns when present).

The component ref exposes:

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

## Classes and attributes

A `class`, `style` or other attribute given to `Table` goes on its root element,
`.table-root`, which is laid out as if it were not there (`display: contents`): use it
to style what is inside (`.my-table td { … }`). To give the table a box of its own
(margins, a border), wrap it in an element.

## Header labels

A header without a `label` shows its `key`. An empty `label` (`label: ''`) shows
nothing, for a column such as row actions; give it an `ariaLabel` to name it for
assistive technology and in the filter and column options menus. `ariaLabel` also
names a column whose visible label is not descriptive on its own.

```js
{ key: 'actions', label: '', ariaLabel: 'Row actions', sortable: false, filterable: false }
```

## Filtered rows

`filtered-rows-change` reports the rows the column filters leave, in display order
and across every page (with `fetchRows`, the rows of the current fetch), with
`{ filtersActive }`. It fires on mount and whenever the data, filters or sort
change. The same rows are exposed as `filteredRows` on the component instance.

```vue
<Table :data="rows" :headers="headers" @filtered-rows-change="(rows, { filtersActive }) => …" />
```

Use it for actions on "the rows shown" (export, bulk edit) instead of repeating the
filter matching.

## Inside a Dialog

The column filter and column options popovers and the row context menu work in a
Table inside a modal `Dialog`: they are rendered into the dialog (see
[Responsive layouts](responsive.md#dialogs)).

