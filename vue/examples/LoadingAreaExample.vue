<template>
	<Section
		title="Loading area"
		:icon="Loading03Icon"
		subtitle="Placeholder for async regions — wrap content or use as a standalone status block."
	>
		<p>
			Bind <code>:loading</code> around a default slot for the usual Vue pattern, or
			render <code>&lt;LoadingArea /&gt;</code> on its own while data is pending.
			The spinner uses Hugeicons <code>Loading03Icon</code> with a CSS rotation
			(respects <code>prefers-reduced-motion</code>).
		</p>
	</Section>

	<Section title="Wrap content" subtitle="Toggle loading to swap between placeholder and content">
		<template #toolbar>
			<button type="button" class="neutral" @click="contentLoading = !contentLoading">
				{{ contentLoading ? 'Show content' : 'Show loading' }}
			</button>
		</template>

		<LoadingArea :loading="contentLoading" message="Fetching table rows…" min-height="10rem">
			<div class="demo-panel">
				<p>Content is ready. This block is the default slot.</p>
				<ul>
					<li>Ada — London</li>
					<li>Grace — New York</li>
					<li>Katherine — Newport News</li>
				</ul>
			</div>
		</LoadingArea>
	</Section>

	<Section title="Overlay mode" subtitle="Keep layout size while covering content">
		<template #toolbar>
			<button type="button" class="neutral" @click="runOverlayFetch">
				{{ overlayLoading ? 'Loading…' : 'Simulate refresh' }}
			</button>
		</template>

		<LoadingArea
			:loading="overlayLoading"
			overlay
			message="Refreshing…"
			min-height="8rem"
		>
			<div class="demo-panel">
				<p>
					With <code>overlay</code>, the default slot stays mounted so the area does
					not collapse. Useful for refresh-in-place.
				</p>
				<p class="subtle">Last refreshed: {{ lastRefreshedLabel }}</p>
			</div>
		</LoadingArea>
	</Section>

	<Section title="Standalone placeholder" subtitle="No default slot — just the loading state">
		<LoadingArea message="Connecting to server…" min-height="8rem" />
	</Section>

	<Section title="Custom placeholder slot" subtitle="Replace the spinner with your own markup">
		<LoadingArea :loading="true" min-height="8rem">
			<template #placeholder>
				<p class="custom-placeholder">Preparing preview…</p>
			</template>
		</LoadingArea>
	</Section>

	<Section title="Idiomatic async example" subtitle="ref + async function with try/finally">
		<template #toolbar>
			<button type="button" class="good" :disabled="peopleLoading" @click="loadPeople">
				{{ peopleLoading ? 'Loading…' : 'Load people' }}
			</button>
			<button type="button" class="neutral" :disabled="!people.length" @click="people = []">
				Clear
			</button>
		</template>

		<LoadingArea :loading="peopleLoading" message="Loading people…" min-height="10rem">
			<div v-if="peopleError" class="demo-panel">
				<p class="annotation bad">{{ peopleError }}</p>
			</div>
			<div v-else-if="people.length" class="demo-panel">
				<ul>
					<li v-for="person in people" :key="person.name">
						{{ person.name }} — {{ person.city }}
					</li>
				</ul>
			</div>
			<p v-else class="subtle">No people loaded yet. Click “Load people”.</p>
		</LoadingArea>
	</Section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { getExampleTableRows } from '../data/examplePeople.js'

const contentLoading = ref(true)
const overlayLoading = ref(false)
const lastRefreshedAt = ref(Date.now())
const people = ref([])
const peopleLoading = ref(false)
const peopleError = ref('')

let overlayTimer = null
let peopleTimer = null

const lastRefreshedLabel = computed(() =>
	new Date(lastRefreshedAt.value).toLocaleTimeString(),
)

function runOverlayFetch() {
	if (overlayLoading.value) {
		return
	}
	overlayLoading.value = true
	clearTimeout(overlayTimer)
	overlayTimer = setTimeout(() => {
		lastRefreshedAt.value = Date.now()
		overlayLoading.value = false
		overlayTimer = null
	}, 1500)
}

async function loadPeople() {
	peopleLoading.value = true
	peopleError.value = ''
	try {
		people.value = await fetchPeople()
	} catch (error) {
		peopleError.value = error?.message || 'Failed to load people.'
		people.value = []
	} finally {
		peopleLoading.value = false
	}
}

function fetchPeople() {
	return new Promise((resolve, reject) => {
		clearTimeout(peopleTimer)
		peopleTimer = setTimeout(() => {
			peopleTimer = null
			if (Math.random() < 0.15) {
				reject(new Error('Simulated network failure. Try again.'))
				return
			}
			resolve(getExampleTableRows().slice(0, 5))
		}, 1200)
	})
}

onBeforeUnmount(() => {
	clearTimeout(overlayTimer)
	clearTimeout(peopleTimer)
})
</script>

<style scoped>
.demo-panel {
	padding: 1rem;
}

.demo-panel ul {
	margin: 0.5rem 0 0;
	padding-left: 1.25rem;
}

.custom-placeholder {
	margin: 0;
	font-style: italic;
	color: var(--muted-text-color);
}
</style>
