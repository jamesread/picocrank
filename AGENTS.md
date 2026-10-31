# PicoCrank — agent notes

PicoCrank is a Vue component library demo built on the [Femtocrank](https://github.com/jamesread/femtocrank) global CSS theme. Reusable components live under `vue/components/`; example pages under `vue/examples/`.

## UI patterns

- [Buttons with icons](docs/buttons-with-icons.md) — Femtocrank `.inline-icon`, Hugeicons, karma variants (icon + text and icon-only).
- [Table filterQuery v1](docs/filter-query-v1.md) — canonical remote filter wire format for `Table` / `fetchRows`.
- [Responsive layouts](docs/responsive.md) — 768px narrow breakpoint (`useIsNarrow`, `.hide-narrow`), toolbar overflow menus in `Section`/`Header`, `Dialog`, `.action-row`, `dvh` heights.
- Drop-in themes: `ThemeSwitcher` + `useCustomTheme()`; supplemental themes (Catppuccin, Dracula / Alucard, Gruvbox, waffles) bundled by default, loaded only when `includeSupplementalThemes` is set.

## Examples app

Run the Vite dev server and browse example routes (e.g. `/buttons-example`) for live reference implementations.
