# Context menu

`ContextMenu` (`vue/components/ContextMenu.vue`) is a menu of actions at a point on
screen: where something was right-clicked, or under the button that opened it.
Table's row menu and Calendar's day menu use it.

```vue
<ContextMenu
	v-model:open="menuOpen"
	aria-label="Entry actions"
	:items="[
		{ id: 'duplicate', label: 'Duplicate', icon: Copy01Icon },
		{ divider: true },
		{ id: 'remove', label: 'Remove', icon: Delete02Icon, danger: true },
	]"
	:client-x="menuX"
	:client-y="menuY"
	@select="onMenuSelect"
/>
```

```js
function onContextMenu(event) {
	event.preventDefault()
	menuX.value = event.clientX
	menuY.value = event.clientY
	menuOpen.value = true
}
```

- Items: `{ id, label, icon, danger, disabled, divider }`, plus any keys of your own;
  `select` passes the picked item back. A `label` may be a function of `{ count }`.
- It stays on screen near the point, and focuses itself so arrow keys, Home and End
  move between items. Escape, Tab past either end, a click elsewhere, scrolling or
  resizing close it (`update:open` false, then `cancel`).
- `target-count` above 1 adds a count to labels ("Delete (3)") unless an item sets
  `showCount: false`.
- `aria-label` names the menu (default "Actions"); a `class` goes on the menu.
- Inside a modal `Dialog` it is rendered into the dialog, so it is not hidden beneath it.
