<template>
	<section class = "with-header-and-content">
		<div class = "section-header">
			<h2>{{ title }}</h2>
		</div>
		<div :class = "padding ? 'section-content padding' : 'section-content'">
			<slot />
		</div>
	</section>
</template>

<script setup>

const props = defineProps({
	title: {
		type: String,
		default: "Untitled Section",
	},
	padding: {
		type: Boolean,
		default: true,
	},
});
</script>
