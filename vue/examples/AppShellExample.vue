<template>
	<Section
		title="App shell banners"
		subtitle="Application-wide notices in AppShell's banners slot"
	>
		<template #toolbar>
			<button type="button" class="severe inline-icon" @click="showConnectionLost">
				<HugeiconsIcon :icon="WifiDisconnected01Icon" width="1em" height="1em" aria-hidden="true" />
				<span>Connection lost</span>
			</button>
			<button type="button" class="info inline-icon" @click="showMaintenance">
				<HugeiconsIcon :icon="Notification01Icon" width="1em" height="1em" aria-hidden="true" />
				<span>Maintenance</span>
			</button>
			<button type="button" class="inline-icon" @click="showNewVersion">
				<HugeiconsIcon :icon="Notification01Icon" width="1em" height="1em" aria-hidden="true" />
				<span>New version</span>
			</button>
			<button type="button" class="bad inline-icon" @click="clearBanners">
				<HugeiconsIcon :icon="Cancel01Icon" width="1em" height="1em" aria-hidden="true" />
				<span>Clear all</span>
			</button>
		</template>

		<p>
			Banners sit directly below the header and stay there while the page scrolls.
			Unlike the header toolbar, they are never moved into an overflow menu, so use
			them for notices users must not miss. Use the buttons above to add some, then
			scroll the page or narrow the window.
		</p>

		<ul>
			<li><strong>Connection lost</strong> uses <code>role="alert"</code> and has a fixed id, so pressing it again replaces the banner instead of adding another.</li>
			<li><strong>Maintenance</strong> stays until the application removes it.</li>
			<li><strong>New version</strong> includes a router link and is dismissible: use its × button to close it.</li>
		</ul>

		<p class="subtle">
			{{ bannerCount === 0 ? 'No banners are shown.' : `${bannerCount} banner${bannerCount === 1 ? ' is' : 's are'} shown.` }}
		</p>
	</Section>

	<Section
		title="1. Render banners in the app shell"
		subtitle="App.vue keeps the list and shares it with pages"
	>
		<pre><code>{{ appCode }}</code></pre>
	</Section>

	<Section
		title="2. Create banners from a page"
		subtitle="Inject the API anywhere below App.vue"
	>
		<pre><code>{{ pageCode }}</code></pre>
	</Section>
</template>

<script setup>
import { computed, inject } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import {
	Cancel01Icon,
	Notification01Icon,
	WifiDisconnected01Icon,
} from '@hugeicons/core-free-icons'
import Section from '../components/Section.vue'

const appBanners = inject('appBanners')

const bannerCount = computed(() => appBanners.banners.value.length)

function showConnectionLost() {
	appBanners.show({
		id: 'connection-lost',
		type: 'severe',
		role: 'alert',
		message: 'Connection to the server was lost. Retrying…',
	})
}

function showMaintenance() {
	appBanners.show({
		type: 'info',
		message: 'Scheduled maintenance tonight from 22:00 to 23:00 UTC.',
	})
}

function showNewVersion() {
	appBanners.show({
		id: 'new-version',
		type: 'note',
		dismissible: true,
		messagePrefix: 'A new version is available. ',
		linkLabel: 'Open the welcome page',
		linkTo: { name: 'Welcome' },
		messageSuffix: ' to see what changed.',
	})
}

function clearBanners() {
	appBanners.clear()
}

// Split so the SFC parser does not end this script block early.
const SCRIPT_CLOSE = '</' + 'script>'

const appCode = `<template>
	<AppShell>
		<template #header>
			<Header title="My app" />
		</template>

		<template #banners>
			<NotificationBlock
				v-for="banner in banners"
				:key="banner.id"
				v-bind="banner.props"
				:dismissible="banner.dismissible"
				@dismiss="dismissBanner(banner.id)"
			/>
		</template>

		<router-view />
	</AppShell>
</template>

<script setup>
import { provide, ref } from 'vue'
import AppShell from 'picocrank/vue/components/AppShell.vue'
import Header from 'picocrank/vue/components/Header.vue'
import NotificationBlock from 'picocrank/vue/components/NotificationBlock.vue'

const banners = ref([])
let nextId = 1

// Skip ids already in use, so a generated id never replaces a banner that was
// given that id explicitly.
function generateBannerId() {
	let candidate
	do {
		candidate = \`banner-\${nextId++}\`
	} while (banners.value.some((b) => b.id === candidate))
	return candidate
}

// Props are passed straight to NotificationBlock: type, role, message, link…
// Reusing an id replaces that banner instead of adding another.
function showBanner({ id, dismissible = false, ...props }) {
	const bannerId = id ?? generateBannerId()
	const banner = { id: bannerId, dismissible, props }
	const existing = banners.value.findIndex((b) => b.id === bannerId)

	if (existing === -1) {
		banners.value = [...banners.value, banner]
	} else {
		banners.value = banners.value.map((b, i) => (i === existing ? banner : b))
	}

	return bannerId
}

function dismissBanner(id) {
	banners.value = banners.value.filter((banner) => banner.id !== id)
}

provide('appBanners', {
	banners,
	show: showBanner,
	dismiss: dismissBanner,
	clear: () => { banners.value = [] },
})
${SCRIPT_CLOSE}`

const pageCode = `<script setup>
import { inject } from 'vue'

const appBanners = inject('appBanners')

function onDisconnect() {
	appBanners.show({
		id: 'connection-lost',
		type: 'severe',
		role: 'alert',
		message: 'Connection to the server was lost. Retrying…',
	})
}

function onReconnect() {
	appBanners.dismiss('connection-lost')
}

// A dismissible banner has a × button the user can close it with.
appBanners.show({
	id: 'new-version',
	type: 'note',
	dismissible: true,
	message: 'A new version is available.',
})
${SCRIPT_CLOSE}`
</script>

<style scoped>
pre {
	overflow-x: auto;
	max-width: 100%;
	tab-size: 4;
}
</style>
