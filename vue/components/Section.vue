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

<style scoped>
:slotted(button):not(.good),
:slotted(.button):not(.good)
{
	background-color: white;
}

:slotted(button:hover):not(.good),
:slotted(.button:hover):not(.good)
{
	background-color: #f0f0f0;
}

@media (prefers-color-scheme: dark) {
	:slotted(button):not(.good),
	:slotted(.button):not(.good)
	{
		background-color: #111;
		border: 1px solid #222;
		color: #fff;
	}

	:slotted(button:hover):not(.good),
	:slotted(.button:hover):not(.good)
	{
		background-color: #222;
		border: 1px solid #333;
		color: #fff;
	}
}
</style>