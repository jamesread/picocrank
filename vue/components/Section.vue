<template>
	<section :class="'with-header-and-content ' + classes" :id="id">
		<div class="section-header flex-row">
			<div class="fg1">
				<h2 :title="subtitle">
					<span v-if="icon" class="section-title-with-icon">
						<HugeiconsIcon
							:icon="icon"
							class="section-title-icon"
							width="1.1em"
							height="1.1em"
							:strokeWidth="2"
							aria-hidden="true"
						/>
						<span class="section-title-text">
							<slot name="title">{{ title }}</slot>
						</span>
					</span>
					<slot v-else name="title">{{ title }}</slot>
				</h2>
			</div>
			<div role="toolbar">
				<slot name="toolbar" />
			</div>
		</div>
		<div :class="padding ? 'section-content padding' : 'section-content'">
			<slot />
		</div>
	</section>
</template>

<script setup>
import { HugeiconsIcon } from '@hugeicons/vue'

defineProps({
	title: {
		type: String,
		default: 'Untitled Section',
	},
	padding: {
		type: Boolean,
		default: true,
	},
	subtitle: {
		type: String,
		default: '',
	},
	id: {
		type: String,
		default: '',
	},
	classes: {
		type: String,
		default: '',
	},
	icon: {
		type: [Object, Array, Function],
		default: null,
	},
})
</script>

<style scoped>
.section-title-with-icon {
	display: inline-flex;
	align-items: center;
	gap: 0.45em;
	vertical-align: middle;
}

.section-title-icon {
	flex: 0 0 auto;
}
</style>
