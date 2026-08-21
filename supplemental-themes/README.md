# PicoCrank supplemental themes

Optional drop-in themes (Catppuccin Latte / Frappé, Dracula / Alucard, Gruvbox (Dark+Light), waffles) shipped alongside the default build unless disabled.

- **Build / dev assets:** included by default. Set `VITE_INCLUDE_SUPPLEMENTAL_THEMES=false` for a minimal build (`npm run build:minimal`).
- **Runtime:** opt in with `includeSupplementalThemes` on `ThemeSwitcher` or `useCustomTheme()` (default `false`). Client apps do not list or apply these themes unless explicitly enabled.
- **Catppuccin Latte / Frappé:** one theme folder (`catppuccin-latte-frappe`); header light/dark toggle switches between Latte (light) and Frappé (dark).
- **Gruvbox (Dark+Light):** one theme folder (`gruvbox-dark-light`); header light/dark toggle switches between Gruvbox Dark and Light.
- **Dracula / Alucard:** one theme folder (`dracula-alucard`); header light/dark toggle switches between Dracula (dark) and Alucard (light).
