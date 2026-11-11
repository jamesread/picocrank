<template>
	<div class="app-shell" :style="bannersHeightStyle">
		<slot name="header" />

		<div id="layout">
			<slot name="sidebar" />

			<div id="content">
				<div ref="bannersRef" class="app-shell-banners">
					<slot name="banners" />
				</div>

				<main>
					<slot />
				</main>

				<footer v-if="$slots.footer">
					<slot name="footer" />
				</footer>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const bannersRef = ref(null)
const bannersHeight = ref(0)
let bannersObserver = null

const bannersHeightStyle = computed(() => ({
	'--picocrank-app-banners-height': `${bannersHeight.value}px`,
}))

function measureBanners() {
	bannersHeight.value = bannersRef.value?.getBoundingClientRect().height ?? 0
}

onMounted(() => {
	measureBanners()
	bannersObserver = new ResizeObserver(measureBanners)
	bannersObserver.observe(bannersRef.value)
})

onBeforeUnmount(() => {
	bannersObserver?.disconnect()
})
</script>

<style scoped>
/*
 * Below the header and any open sidebar drawer, above scrolling page content.
 * Do not raise this above the header (5 when fixed): the header is one stacking
 * layer, so the banners would then also cover its dropdowns (toolbar overflow
 * menu) and the top of the sidebar drawer. The header's shadow is removed
 * instead while banners are shown; see the unscoped style below.
 */
.app-shell-banners {
	position: sticky;
	top: var(--picocrank-fixed-header-offset);
	z-index: 2;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

/* Stacked banners read as one strip attached to the header: square, no gaps,
   one divider between neighbours. */
.app-shell-banners > :slotted(*) {
	margin: 0;
	border-radius: 0;
	border-width: 0 0 1px;
}

/* The last banner carries the header's shadow, clipped so it only falls below. */
.app-shell-banners > :slotted(:last-child) {
	box-shadow: var(--header-shadow);
	clip-path: inset(0 0 -2em 0);
}
</style>

<style>
/*
 * While banners are shown, the header and banners read as one block: the header
 * drops its shadow so it does not fall across the banners, and the last banner
 * carries it instead. Unscoped because the header comes from a slot.
 */
.app-shell:has(> #layout > #content > .app-shell-banners > *) > header {
	box-shadow: none;
}
</style>
