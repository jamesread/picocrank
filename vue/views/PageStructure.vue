<template>
	<Section
		title="Page structure"
		subtitle="Configure the example application shell and layout"
	>
		<p>
			Use these controls to turn PicoCrank layout features on or off while you
			explore the other examples. Changes apply immediately across the app.
		</p>
	</Section>

	<Section title="Header" subtitle="Branding, search, and top navigation">
		<dl>
			<dt>Logo and title</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="brandingEnabled"
						@change="toggleBrandingEnabled"
					/>
					<span>Show logo and title in the header</span>
				</label>
			</dd>

			<dt>QuickSearch</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="quickSearchEnabled"
						@change="toggleQuickSearchEnabled"
					/>
					<span>Show QuickSearch in the header toolbar</span>
				</label>
			</dd>

			<dt>Top bar</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="topBarEnabled"
						@change="toggleTopBarEnabled"
					/>
					<span>Show horizontal navigation links below the header</span>
				</label>
			</dd>

			<dt>Breadcrumbs</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="breadcrumbsEnabled"
						@change="toggleBreadcrumbsEnabled"
					/>
					<span>Show route breadcrumbs in the header</span>
				</label>
			</dd>
		</dl>
	</Section>

	<Section title="Sidebar" subtitle="Primary navigation panel">
		<dl>
			<dt>Sidebar navigation</dt>
			<dd>
				<label class="page-structure-control">
					<input
						type="checkbox"
						:checked="sidebarEnabled"
						@change="toggleSidebarEnabled"
					/>
					<span>Show the sidebar navigation panel</span>
				</label>
				<p class="subtle">
					When enabled, use the menu button in the header to open and pin the sidebar.
				</p>
			</dd>
		</dl>
	</Section>
</template>

<script setup>
import { inject } from 'vue'
import Section from '../components/Section.vue'

const sidebarEnabled = inject('sidebarEnabled')
const toggleSidebarEnabled = inject('toggleSidebarEnabled')
const brandingEnabled = inject('brandingEnabled')
const toggleBrandingEnabled = inject('toggleBrandingEnabled')
const quickSearchEnabled = inject('quickSearchEnabled')
const toggleQuickSearchEnabled = inject('toggleQuickSearchEnabled')
const topBarEnabled = inject('topBarEnabled')
const toggleTopBarEnabled = inject('toggleTopBarEnabled')
const breadcrumbsEnabled = inject('breadcrumbsEnabled')
const toggleBreadcrumbsEnabled = inject('toggleBreadcrumbsEnabled')
</script>

<style scoped>
.page-structure-control {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
}

.page-structure-control + .subtle {
	margin-top: 0.5rem;
}
</style>
