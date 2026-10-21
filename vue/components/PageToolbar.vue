<template>
	<div class="page-toolbar" role="toolbar" :aria-label="label || undefined">
		<slot />
	</div>
</template>

<script setup>
defineProps({
	label: {
		type: String,
		default: '',
	},
})
</script>

<style scoped>
/*
 * Page-level toolbar that sticks under the fixed header and looks like a
 * Femtocrank section joined to it (square top, rounded bottom).
 * Override --page-toolbar-pull to match main's top padding (0 when main has none).
 */
.page-toolbar {
	--page-toolbar-pull: 1em;
	position: sticky;
	top: var(--picocrank-fixed-header-offset);
	/* Below header.fixed (5) so its drop shadow draws over the toolbar. */
	z-index: 4;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
	margin-top: calc(-1 * var(--page-toolbar-pull));
	margin-bottom: 1rem;
	padding: calc(0.5rem + var(--page-toolbar-pull)) 1rem 0.5rem;
	background-color: var(--section-bg-color);
	border-radius: 0 0 .4em .4em;
	box-shadow: 0 0 .5em var(--shadow-color);
}

.page-toolbar :slotted(button),
.page-toolbar :slotted(.button) {
	padding: 0.4em 1em;
	line-height: normal;
	flex-shrink: 0;
}

/* Femtocrank drops main's padding on narrow screens. */
@media (max-width: 600px) {
	.page-toolbar {
		--page-toolbar-pull: 0px;
	}
}
</style>
