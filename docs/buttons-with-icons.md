# Buttons with icons (PicoCrank / Femtocrank)

Brief reference for reproducing icon buttons as shown in `vue/examples/ButtonsExample.vue`.

## Prerequisites

- **Femtocrank** `^2.5.3` or newer (provides `.inline-icon` and button/karma styles).
- **Hugeicons**: `@hugeicons/vue` and `@hugeicons/core-free-icons`.
- There is **no** `Button` Vue component — use plain HTML `<button>` (or `<a class="button">` for links).

## Pattern

1. Put **`inline-icon`** on the `<button>` (Femtocrank flex layout: icon + label, aligned with gap).
2. Add optional **karma intent** classes on the same element: `neutral`, `good`, `bad`, `warning`.
3. Render **`HugeiconsIcon`** at `1em` × `1em` with **`strokeWidth` `2.5`** for button-sized icons.
4. Set **`aria-hidden="true"`** on the icon when visible text is present.
5. For **icon-only** buttons, omit the label and set **`aria-label`** on the button instead.

## Icon and text

```vue
<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'
import { Add01Icon } from '@hugeicons/core-free-icons'

const iconStrokeWidth = 2.5
</script>

<template>
  <button type="button" class="inline-icon good">
    <HugeiconsIcon
      :icon="Add01Icon"
      width="1em"
      height="1em"
      :strokeWidth="iconStrokeWidth"
      aria-hidden="true"
    />
    <span>Add item</span>
  </button>
</template>
```

## Icon only

```vue
<button type="button" class="inline-icon neutral" aria-label="Edit">
  <HugeiconsIcon
    :icon="EditIcon"
    width="1em"
    height="1em"
    :strokeWidth="iconStrokeWidth"
    aria-hidden="true"
  />
</button>
```

## Karma variants

Apply on the same `<button>` as `inline-icon`:

| Class     | Use for              |
|-----------|----------------------|
| (none)    | Default              |
| `neutral` | Secondary / toolbar  |
| `good`    | Primary / confirm    |
| `bad`     | Destructive          |
| `warning` | Caution              |

Example: `<button type="button" class="inline-icon bad" aria-label="Delete">…</button>`

## Toolbars

Group buttons in a flex row (example-only layout, not from Femtocrank):

```vue
<div role="toolbar" class="buttons-row">
  <!-- buttons here -->
</div>
```

```css
.buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
```

## Do not

- Do not create a wrapper `Button` component unless the project already has one.
- Do not omit `aria-label` on icon-only buttons.
- Do not set `aria-hidden` on the button itself — only on the icon when a visible label exists.

## Live example

Route: `/buttons-example` — sections **Icon and text** and **Icon only** in `vue/examples/ButtonsExample.vue`.
