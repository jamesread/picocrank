<template>
	<Section
		title="Theme Switcher"
		subtitle="Drop-in themes layered on Femtocrank — not part of the Vite CSS/JS bundle"
	>
		<p>
			Themes live under <code>public/themes/&lt;name&gt;/theme.css</code>. Drop a folder
			in and restart the dev server (or rebuild); PicoCrank discovers themes from
			<code>index.json</code> and applies them with <code>useCustomTheme()</code>.
		</p>

		<label class="theme-picker">
			<span>Active theme</span>
			<select :value="themePreference" @change="onThemeChange">
				<option value="">Default (Femtocrank)</option>
				<option
					v-for="name in availableThemes"
					:key="name"
					:value="name"
				>
					{{ name }}
				</option>
			</select>
		</label>

		<p v-if="availableThemes.length === 0" class="subtle">
			No drop-in themes found. Add <code>public/themes/&lt;name&gt;/theme.css</code>
			and restart Vite.
		</p>
		<p v-else class="subtle">
			Preference is stored in localStorage and applies across the whole examples site.
			Light/dark mode (header sun/moon) is separate from drop-in themes.
		</p>
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
		<form class="preview-form" @submit.prevent>
			<label>
				Name
				<input type="text" value="PicoCrank" />
			</label>
			<label>
				Status
				<select>
					<option>Ready</option>
					<option>Busy</option>
				</select>
			</label>
			<label>
				Notes
				<textarea rows="3">Override Femtocrank tokens in theme.css</textarea>
			</label>
			<div role="toolbar" class="preview-row">
				<button type="submit" class="good">Save</button>
				<button type="button" class="neutral">Cancel</button>
			</div>
		</form>
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
			</tbody>
		</table>
	</Section>
</template>

<script setup>
import Section from '../components/Section.vue'
import { useCustomTheme } from '../composables/useCustomTheme.js'

const { availableThemes, themePreference, setTheme, discoverThemes } = useCustomTheme()

discoverThemes()

function onThemeChange(event) {
	setTheme(event.target.value)
}
</script>

<style scoped>
.theme-picker {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
	margin: 1rem 0;
}

.theme-picker select {
	min-width: 14rem;
}

.preview-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.preview-form {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	max-width: 28rem;
}

.preview-form label {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
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
