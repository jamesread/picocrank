<template>
	<section :class="'with-header-and-content ' + classes" :id="id">
		<div
			ref="headerRef"
			class="section-header flex-row toolbar-overflow-host"
			:class="{ 'section-header-toolbar-collapsed': collapsed }"
		>
			<div ref="titleRef" class="fg1 section-header-title">
				<h2 :title="subtitle">
					<span v-if="icon" class="section-title-with-icon">
						<HugeiconsIcon
							:icon="icon"
							class="section-title-icon"
							aria-hidden="true"
						/>
						<span class="section-title-text">
							<slot name="title">{{ title }}</slot>
						</span>
					</span>
					<slot v-else name="title">{{ title }}</slot>
				</h2>
			</div>
			<button
				v-if="collapsed"
				ref="toggleRef"
				type="button"
				class="neutral section-toolbar-toggle"
				:aria-label="toolbarMenuLabel"
				:title="toolbarMenuLabel"
				:aria-expanded="menuOpen ? 'true' : 'false'"
				:aria-controls="toolbarId"
				@click="toggleMenu"
				@keydown="onKeydown"
			>
				<HugeiconsIcon :icon="MoreVerticalIcon" aria-hidden="true" />
			</button>
			<div
				:id="toolbarId"
				ref="toolbarRef"
				role="toolbar"
				:class="{
					'toolbar-overflow-menu': collapsed,
					'toolbar-overflow-menu-open': collapsed && menuOpen,
				}"
				:aria-label="collapsed ? toolbarMenuLabel : undefined"
				:aria-orientation="collapsed ? 'vertical' : undefined"
				@click="onToolbarClick"
				@keydown="onKeydown"
			>
				<slot name="toolbar" />
			</div>
		</div>
		<div :class="padding ? 'section-content padding' : 'section-content'">
			<slot />
		</div>
	</section>
</template>

<script setup>
import { ref, useId, watch } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { MoreVerticalIcon } from '@hugeicons/core-free-icons'
import { measureNaturalWidth, useToolbarOverflow } from '../composables/useToolbarOverflow.js'

const props = defineProps({
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
	/**
	 * Move the toolbar into a menu behind a button at the top right of the
	 * section when its controls do not fit beside the title.
	 */
	collapseToolbar: {
		type: Boolean,
		default: true,
	},
	/** Accessible name of the toolbar menu button (and of the menu). */
	toolbarMenuLabel: {
		type: String,
		default: 'More actions',
	},
	/**
	 * The title keeps at least this many ems (or its own width, if less)
	 * before the toolbar collapses into the menu.
	 */
	titleMinWidthEm: {
		type: Number,
		default: 8,
	},
})

const toolbarId = `section-toolbar-${useId()}`

const headerRef = ref(null)
const titleRef = ref(null)
const toolbarRef = ref(null)
const toggleRef = ref(null)

function px(value) {
	const number = Number.parseFloat(value)
	return Number.isFinite(number) ? number : 0
}

/** Whether the toolbar, in one row at natural width, fits beside the title. */
function toolbarFits() {
	const header = headerRef.value
	const title = titleRef.value
	if (!header || !title) return true

	const toolbarWidth = measureNaturalWidth(toolbarRef.value)
	header.classList.add('section-header-measuring')
	const titleWidth = title.offsetWidth
	header.classList.remove('section-header-measuring')

	const style = getComputedStyle(header)
	const available = header.clientWidth
		- px(style.paddingLeft)
		- px(style.paddingRight)
		- px(style.columnGap || style.gap)
	const titleMin = Math.min(titleWidth, props.titleMinWidthEm * px(style.fontSize))

	return toolbarWidth + titleMin <= available
}

const {
	collapsed,
	menuOpen,
	update,
	scheduleUpdate,
	openMenu,
	closeMenu,
	toggleMenu,
	onToolbarClick,
	onKeydown,
} = useToolbarOverflow({
	rootRef: headerRef,
	toolbarRef,
	toggleRef,
	fits: toolbarFits,
	enabled: () => props.collapseToolbar,
})

watch(() => [props.title, props.titleMinWidthEm], scheduleUpdate)

defineExpose({ collapsed, menuOpen, openMenu, closeMenu, update })
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

.section-header-title {
	min-width: 0;
}

.section-header-toolbar-collapsed .section-header-title h2 {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.section-toolbar-toggle {
	flex: 0 0 auto;
	margin: 0;
	padding: .35em .55em;
	line-height: 1;
}

.section-toolbar-toggle svg {
	display: block;
}

/* Measuring pass for the title: natural width. */
.section-header.section-header-measuring .section-header-title {
	flex: none;
	width: max-content;
}
</style>
