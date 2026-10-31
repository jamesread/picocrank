# Responsive layouts

PicoCrank has one "narrow screen" breakpoint, for phones and small tablets: **768px**
and below. Femtocrank has its own 600px breakpoint for some page chrome; PicoCrank
components and the helpers below all use 768px.

## Breakpoint

```js
import { NARROW_MAX_WIDTH, NARROW_QUERY, useIsNarrow } from 'picocrank/vue/composables/useBreakpoint.js'

const isNarrow = useIsNarrow() // reactive boolean
```

CSS cannot read `NARROW_MAX_WIDTH`, so write narrow media queries as
`@media (max-width: 768px)`.

| Class | Effect |
|-------|--------|
| `.hide-narrow` | Hidden at 768px and below |
| `.show-narrow` | Shown only at 768px and below |

## Toolbars that do not fit

`Section` and `Header` move their `toolbar` slot into a menu behind a ⋮ button
when it does not fit in one row (Section: beside the title; Header: beside the
branding and user controls). The slotted controls are the same elements, so their
handlers and state keep working, and dialogs or popovers they own still show.

- The menu closes when an action is chosen, on Escape (focus returns to ⋮) and on a
  click outside. Controls with `aria-haspopup` or `aria-expanded` leave it open.
- Props on both: `collapse-toolbar` (default `true`) and `toolbar-menu-label`
  (default "More actions"). Section also has `title-min-width-em` (default 8).
- In the menu, an icon-only button (only an icon inside, named by `aria-label`)
  shows its label as text. Put visible button text in an element, such as a `<span>`.
- Keep controls as direct children of the toolbar slot. A wrapper element becomes a
  single menu item; use `display: contents` on it if you need one.

Other toolbars can use the same behaviour with `useToolbarOverflow` and
`measureNaturalWidth` (`vue/composables/useToolbarOverflow.js`) and the global
`.toolbar-overflow-*` classes.

## Dialogs

`Dialog` (`vue/components/Dialog.vue`) is a modal on the native `<dialog>`:

```vue
<Dialog v-model:open="open" title="Delete 3 rows?" size="small">
	<p>This cannot be undone.</p>
	<template #actions="{ close }">
		<button type="button" class="neutral" @click="close('cancel')">Cancel</button>
		<button type="button" class="bad" @click="remove">Delete</button>
	</template>
</Dialog>
```

- `size`: `small`, `medium` (default) or `large` on wide screens.
- `:modal="false"` opens it with `show()`: no backdrop, the page stays usable, and it is
  still centred (or docked as a sheet when narrow).
- It keeps Femtocrank's dialog look, including the thick border.
- `narrow-layout`: `sheet` (default, docked to the bottom), `fullscreen` or `centered`.
- The body scrolls; the title bar and actions stay in view.
- Escape, the close button and (unless `:close-on-backdrop="false"`) a backdrop click
  close it. `close` is emitted with the dialog's return value.

## Action rows

`.action-row` lays out a group of buttons (dialog actions, form buttons, empty
states): right-aligned and wrapping, stacked at full width on narrow screens.
Modifiers: `.start`, `.center`, `.no-stack`.

## Viewport heights

Use `dvh` with a `vh` fallback for anything sized to the viewport, so it fits while a
mobile browser's address bar is showing:

```css
max-height: calc(100vh - 1rem);
max-height: calc(100dvh - 1rem);
```

Route: `/buttons-example` (action rows, overflowing toolbar) and `/dialog-example`.
