<template>
	<div class="app-skeleton" :style="bannersHeightStyle">
		<slot name="header" />

		<div id="layout">
			<slot name="sidebar" />

			<div id="content">
				<div ref="bannersRef" class="app-skeleton-banners">
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
/* Below the header and any open sidebar drawer, above scrolling page content. */
.app-skeleton-banners {
	position: sticky;
	top: var(--picocrank-fixed-header-offset);
	z-index: 2;
	display: flex;
	flex-direction: column;
	min-width: 0;
}
</style>
