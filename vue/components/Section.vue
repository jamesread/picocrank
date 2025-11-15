<template>
	<section :class = "'with-header-and-content ' + classes" :id = "id">
		<div class = "section-header flex-row">
			<div class = "fg1">
				<h2 :title = "subtitle">{{ title }}</h2>
			</div>
			<div role = "toolbar">
				<slot name="toolbar" />
			</div>
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
	subtitle: {
		type: String,
		default: "",
	},
	id: {
		type: String,
		default: "",
	},
	classes: {
		type: String,
		default: "",
	},
});
</script>