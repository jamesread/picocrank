# Combobox

`Combobox` (`vue/components/Combobox.vue`) is a searchable select: a text box that
filters a list of options as you type, for choosing one of tens or hundreds of
things (a related row, a user, a country).

```vue
<FormField label="Ingredient" for="ingredient">
	<Combobox
		id="ingredient"
		v-model="ingredientId"
		:options="ingredients.map(row => ({ value: row.id, label: row.name, description: row.aisle }))"
		placeholder="Search ingredients…"
		clearable
		@more="openBrowseDialog"
	>
		<template #actions>
			<button type="button" class="neutral" @click="openBrowseDialog('')">Browse…</button>
		</template>
	</Combobox>
</FormField>
```

- Options are `{ value, label, description?, disabled? }`; `v-model` holds the chosen
  option's `value` (null for none). `change` also passes the chosen option.
- Every typed word must appear in an option's label or description, ignoring case and
  accents ("creme dairy" finds "Crème fraîche", Dairy).
- Clicking the box or typing opens the list; arrow keys move through the list
  (skipping disabled options), Enter picks, Escape closes the list without closing
  a surrounding `Dialog`, and Tab or leaving the box closes it and puts back the
  chosen option's label.
- `clearable` adds a None choice at the top and a clear button, both setting null.
- `limit` (default 50) caps how many options are listed. Past that, a "N more…" item
  emits `more` with the typed text, e.g. to open a fuller picker; with no `more`
  listener it asks for more typing instead.
- Slots: `actions` sits beside the box (e.g. a Browse button); `option` (with
  `{ option, selected }`) renders an option.
- `id` names the input (for `FormField`'s `for`); also `placeholder`, `disabled`,
  `loading`, `aria-label`, and texts `none-label`, `clear-label`, `empty-text`,
  `no-matches-text` and `loading-text`.
- It follows the theme: the list uses Femtocrank's menu dropdown colours.

The matching is exported as `matchesAllWords`, `queryWords` and `foldText` from
`vue/composables/textMatch.js`, for search boxes that should behave the same way.
