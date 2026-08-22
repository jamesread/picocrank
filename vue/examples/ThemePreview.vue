<template>
	<Section
		title="Theme Switcher"
		subtitle="Drop-in themes layered on Femtocrank — not part of the Vite CSS/JS bundle"
	>
		<p>
			Themes live under <code>public/themes/&lt;name&gt;/theme.css</code> (app themes) and
			optionally <code>supplemental-themes/</code> (Catppuccin, Dracula / Alucard, Gruvbox, waffles). Drop a folder
			in and restart the dev server (or rebuild); PicoCrank discovers themes from
			<code>index.json</code> and applies them with <code>useCustomTheme()</code> or
			<code>ThemeSwitcher</code> in the examples app header toolbar. Supplemental themes are bundled by default but only
			listed when <code>include-supplemental-themes</code> is enabled.
		</p>

		<p class="subtle">
			Use the theme dropdown in the header (next to the light/dark toggle) to switch drop-in themes.
			Preference is stored in localStorage and applies across the whole examples site.
			Light/dark mode switches Femtocrank defaults, or the dual-variant supplemental themes when active.
		</p>

		<button
			type="button"
			class="neutral open-theme-switcher-button"
			:disabled="!themeSwitcherEnabled"
			@click="openThemeSwitcher"
		>
			Open theme switcher
		</button>
	</Section>

	<Section title="Buttons" subtitle="Default and karma variants">
		<div role="toolbar" class="preview-row">
			<button type="button">Default</button>
			<button type="button" class="neutral">Neutral</button>
			<button type="button" class="good">Good</button>
			<button type="button" class="bad">Bad</button>
			<button type="button" class="warning">Warning</button>
			<button type="button" disabled>Disabled</button>
		</div>
	</Section>

	<Section title="Notifications" subtitle="Block-level karma status">
		<div class="notification show good" role="status">
			<strong>GOOD:</strong> Theme tokens are applying to karma backgrounds.
		</div>
		<div class="notification show bad" role="status">
			<strong>BAD:</strong> Check contrast on error surfaces.
		</div>
		<div class="notification show warning" role="status">
			<strong>WARNING:</strong> Accent and border colors should stay readable.
		</div>
		<p class="fg-success show inline-notification">
			<strong>SUCCESS:</strong> Inline notification with foreground karma.
		</p>
		<p class="fg-warning show inline-notification">
			<strong>WARNING:</strong> Another inline status line.
		</p>
	</Section>

	<Section title="Form controls" subtitle="Inputs inherit theme variables">
		<FormLayout @submit.prevent>
			<FormField label="Name" for="theme-preview-name">
				<input id="theme-preview-name" type="text" value="PicoCrank" />
			</FormField>
			<FormField label="Status" for="theme-preview-status">
				<select id="theme-preview-status">
					<option>Ready</option>
					<option>Busy</option>
				</select>
			</FormField>
			<FormField label="Notes" for="theme-preview-notes">
				<textarea id="theme-preview-notes" rows="3">Override Femtocrank tokens in theme.css</textarea>
			</FormField>
			<template #actions>
				<button type="submit" class="good">Save</button>
				<button type="button" class="neutral">Cancel</button>
			</template>
		</FormLayout>
	</Section>

	<Section title="Content chrome" subtitle="Sections, links, and muted text">
		<p>
			Body copy should pick up <code>--text-color</code>.
			<a href="#">Sample link</a> uses the theme link color.
		</p>
		<p class="subtle">
			Muted / subtle text uses secondary contrast — useful for captions and hints.
		</p>
		<table class="preview-table">
			<thead>
				<tr>
					<th>Token</th>
					<th>Role</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>--border-color</code></td>
					<td>Borders and rules</td>
				</tr>
				<tr>
					<td><code>--standout-bg-color</code></td>
					<td>Raised / standout surfaces</td>
				</tr>
				<tr>
					<td><code>--karma-*</code></td>
					<td>Status backgrounds and accents</td>
				</tr>
				<tr>
					<td><code>--link-color</code></td>
					<td>Links, active tabs, sort/filter column headers</td>
				</tr>
				<tr>
					<td><code>--muted-text-color</code></td>
					<td>Secondary text and inactive tab labels</td>
				</tr>
				<tr>
					<td><code>--header-fg-color</code></td>
					<td>Header chrome text and icons</td>
				</tr>
				<tr>
					<td><code>--input-bg-color</code> / <code>--input-fg-color</code></td>
					<td>Form fields</td>
				</tr>
			</tbody>
		</table>
	</Section>
</template>

<script setup>
import { inject } from 'vue'
import Section from '../components/Section.vue'
import FormLayout from '../components/FormLayout.vue'
import FormField from '../components/FormField.vue'
import { HEADER_THEME_SWITCHER_SELECT_ID } from '../components/ThemeSwitcher.vue'

const themeSwitcherEnabled = inject('themeSwitcherEnabled')

function openThemeSwitcher() {
	const select = document.getElementById(HEADER_THEME_SWITCHER_SELECT_ID)
	if (!(select instanceof HTMLSelectElement)) {
		return
	}
	select.focus()
	select.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
</script>

<style scoped>
.open-theme-switcher-button {
	margin-top: 0.75rem;
}

.preview-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.preview-table {
	width: 100%;
	border-collapse: collapse;
}

.preview-table th,
.preview-table td {
	text-align: left;
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--border-color, #d7d7d7);
}

.notification {
	margin-bottom: 0.5rem;
}

.inline-notification {
	margin: 0.5rem 0;
}
</style>
