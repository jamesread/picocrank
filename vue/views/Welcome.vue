<template>
	<Section title = "Welcome" classes = "">
		<template #toolbar>
			<button @click="toggleSidebarEnabled" :class="sidebarEnabled ? 'neutral' : 'good'">
				<HugeiconsIcon :icon="Menu01Icon" width="1em" height="1em" />
				{{ sidebarEnabled ? 'Disable Sidebar' : 'Enable Sidebar' }}
			</button>
			<button @click="toggleBrandingEnabled" :class="brandingEnabled ? 'neutral' : 'good'">
				<HugeiconsIcon :icon="HighlighterIcon" width="1em" height="1em" />
				{{ brandingEnabled ? 'Hide Logo & Title' : 'Show Logo & Title' }}
			</button>
			<div style="display: flex; gap: 1rem; align-items: center;">
				<label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
					<input type="checkbox" :checked="quickSearchEnabled" @change="toggleQuickSearchEnabled" />
					<span>Enable QuickSearch</span>
				</label>
				<label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
					<input type="checkbox" :checked="topBarEnabled" @change="toggleTopBarEnabled" />
					<span>Enable TopBar</span>
				</label>
			</div>
		</template>
		<p>
			Welcome to <strong>PicoCrank</strong>! This is a flexible example application to showcase a modular Vue 3 UI with a focus on ease of navigation, live UI controls, and modern design elements. Use the toolbar above to interactively enable or disable interface features like the sidebar, branding, QuickSearch, and the top navigation bar.
		</p>
		<p>
			Explore the sections below to see reusable components in action, including toolbars, buttons, and layout options. PicoCrank is designed to be a starting point for your own rapid Vue projects&mdash;inspect the code and try customizing the UI!
		</p>

	</Section>

	<Section title = "Lorum" id = "lorem">
		<template #toolbar>
			<button>
				<HugeiconsIcon :icon = "HighlighterIcon" width = "1em" height = "1em" />
				Highlight</button>
			<button>Quote</button>
			<button class = "good">Add</button>
		</template>

		<div role = "toolbar">
			<button class = "neutral">
				Neutral
			</button>
			<button class = "good">
				Good
			</button>
			<button class = "bad">
				Bad
			</button>
		</div>

		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
			Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
			Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
			Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
		</p>
	</Section>

	<Section title = "Shakespeare" id = "shakespeare">
		<p>
			To be, or not to be, that is the question:
			Whether 'tis nobler in the mind to suffer
			The slings and arrows of outrageous fortune,
			Or to take arms against a sea of troubles
			And by opposing end them. To die: to sleep;
			No more; and by a sleep to say we end
			The heart-ache and the thousand natural shocks
			That flesh is heir to, 'tis a consummation
			Devoutly to be wish'd. To die, to sleep;
			To sleep: perchance to dream: ay, there's the rub;
			For in that sleep of death what dreams may come
			When we have shuffled off this mortal coil,
			Must give us pause: there's the respect
			That makes calamity of so long life;
			For who would bear the whips and scorns of time,
			The oppressor's wrong
		</p>
	</Section>

	<Section title = "More Lorem" id = "more-lorem">
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
			Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
			Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
			Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
		</p>
	</Section>

</template>

<script setup>
	import { inject } from 'vue';
	import Section from '../components/Section.vue';
	import { HugeiconsIcon } from '@hugeicons/vue';
	import { HighlighterIcon } from '@hugeicons/core-free-icons';
	import { Menu01Icon } from '@hugeicons/core-free-icons';

	// Inject sidebar and branding state and toggle functions from App.vue
	const sidebarEnabled = inject('sidebarEnabled');
	const toggleSidebarEnabled = inject('toggleSidebarEnabled');
	const brandingEnabled = inject('brandingEnabled');
	const toggleBrandingEnabled = inject('toggleBrandingEnabled');
	const quickSearchEnabled = inject('quickSearchEnabled');
	const toggleQuickSearchEnabled = inject('toggleQuickSearchEnabled');
	const topBarEnabled = inject('topBarEnabled');
	const toggleTopBarEnabled = inject('toggleTopBarEnabled');
</script>
