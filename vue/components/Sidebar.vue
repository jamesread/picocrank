<template>
	<aside
		:id="SIDEBAR_PANEL_ID"
		ref="sidebarRef"
		class="sidebar"
		:class="{ 'shown': isOpen, 'stuck': isStuck }"
		aria-label="Sidebar"
		:aria-hidden="isVisible ? undefined : 'true'"
		:inert="isVisible ? undefined : true"
	>
		<div class="flex-row">
			<h2 :id="headingId">Navigation</h2>
			<div class="fg1" />
			<button
				type="button"
				class="stick-toggle"
				:aria-pressed="isStuck"
				:aria-label="isStuck ? 'Unstick sidebar' : 'Stick sidebar'"
				:title="isStuck ? 'Unstick sidebar' : 'Stick sidebar'"
				@click="toggleStick"
			>
				<span aria-hidden="true">
					<HugeiconsIcon
						v-if="isStuck"
						:icon="Pin02Icon"
						width="1em"
						height="1em"
						:strokeWidth="3"
					/>
					<HugeiconsIcon
						v-else
						:icon="PinIcon"
						width="1em"
						height="1em"
						:strokeWidth="3"
					/>
				</span>
			</button>
		</div>

		<nav class="mainnav" :aria-labelledby="headingId">
			<menu class="navigation-links">
				<SidebarNavLink
					v-for="link in navigationGroups.ungrouped"
					:key="link.name"
					:link="link"
					:active="isLinkActive(link)"
					@select="handleNavItemClick"
				/>

				<li
					v-for="section in navigationGroups.sections"
					:key="section.id"
					class="nav-section"
				>
					<button
						type="button"
						class="nav-section-header"
						:id="sectionHeaderId(section.id)"
						:aria-expanded="!isSectionCollapsed(section.id)"
						:aria-controls="sectionPanelId(section.id)"
						@click="toggleSection(section.id)"
					>
						<span>{{ section.title }}</span>
						<HugeiconsIcon
							:icon="isSectionCollapsed(section.id) ? ArrowRight01Icon : ArrowDown01Icon"
							width="0.85em"
							height="0.85em"
							class="nav-section-chevron"
							aria-hidden="true"
						/>
					</button>

					<menu
						:id="sectionPanelId(section.id)"
						class="nav-section-links"
						role="group"
						:aria-labelledby="sectionHeaderId(section.id)"
						:hidden="isSectionCollapsed(section.id)"
					>
						<SidebarNavLink
							v-for="link in section.items"
							:key="link.name"
							:link="link"
							:active="isLinkActive(link)"
							@select="handleNavItemClick"
						/>
					</menu>
				</li>

				<SidebarNavLink
					v-for="link in navigationGroups.trailingUngrouped"
					:key="link.name"
					:link="link"
					:active="isLinkActive(link)"
					@select="handleNavItemClick"
				/>
			</menu>
		</nav>
	</aside>
</template>

<script setup>
import { ref, inject, onUnmounted, watch, nextTick, computed, useId } from 'vue'
import { useRoute } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Pin02Icon, PinIcon, ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import SidebarNavLink from './SidebarNavLink.vue'

const STORAGE_KEY = 'picocrank-nav-sections-collapsed'
const SIDEBAR_PANEL_ID = 'picocrank-sidebar'
const TOGGLER_ID = 'sidebar-toggler-button'

const props = defineProps({
	navigation: {
		type: Object,
		default: null,
	},
})

const isOpen = ref(false)
const isStuck = ref(false)
const sidebarRef = ref(null)
const route = useRoute()
const headingId = useId()

const isVisible = computed(() => isOpen.value || isStuck.value)

const injectedNavigation = inject('navigation', null)

const navigation = computed(() => {
	const nav = props.navigation || injectedNavigation
	if (!nav) return null
	if (nav.value) {
		return nav.value
	}
	return nav
})

const navigationLinks = computed(() => {
	const nav = navigation.value
	if (!nav?.navigationLinks) {
		return []
	}
	const links = nav.navigationLinks
	return Array.isArray(links) ? links : (links?.value ?? [])
})

function isActive(link) {
	const nav = navigation.value
	if (!nav?.isActive) {
		return false
	}
	return nav.isActive(link)
}

function loadCollapsedSections() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return new Set()
		const parsed = JSON.parse(raw)
		return new Set(Array.isArray(parsed) ? parsed : [])
	} catch {
		return new Set()
	}
}

const collapsedSections = ref(loadCollapsedSections())

function saveCollapsedSections() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsedSections.value]))
}

function isSectionCollapsed(sectionId) {
	return collapsedSections.value.has(sectionId)
}

function sectionHeaderId(sectionId) {
	return `nav-section-header-${sectionId}`
}

function sectionPanelId(sectionId) {
	return `nav-section-${sectionId}`
}

function toggleSection(sectionId) {
	const next = new Set(collapsedSections.value)
	if (next.has(sectionId)) {
		next.delete(sectionId)
	} else {
		next.add(sectionId)
	}
	collapsedSections.value = next
	saveCollapsedSections()
}

const navigationGroups = computed(() => {
	const ungrouped = []
	const trailingUngrouped = []
	const sections = []
	let currentSection = null
	let afterSeparator = false

	for (const link of navigationLinks.value) {
		if (link.type === 'section') {
			currentSection = { id: link.name, title: link.title, items: [] }
			sections.push(currentSection)
			afterSeparator = false
			continue
		}

		if (link.type === 'separator') {
			currentSection = null
			afterSeparator = true
			continue
		}

		if (currentSection) {
			currentSection.items.push(link)
		} else if (afterSeparator) {
			trailingUngrouped.push(link)
		} else {
			ungrouped.push(link)
		}
	}

	return { ungrouped, trailingUngrouped, sections }
})

function expandSectionContainingActiveRoute() {
	for (const section of navigationGroups.value.sections) {
		const hasActiveLink = section.items.some((link) => isActive(link))
		if (!hasActiveLink || !isSectionCollapsed(section.id)) {
			continue
		}
		const next = new Set(collapsedSections.value)
		next.delete(section.id)
		collapsedSections.value = next
		saveCollapsedSections()
	}
}

watch(() => route.fullPath, () => {
	expandSectionContainingActiveRoute()
}, { immediate: true })

function toggleStick() {
	isStuck.value = !isStuck.value
}

function stick() {
	isStuck.value = true
}

function unstick() {
	isStuck.value = false
}

function toggle() {
	isOpen.value = !isOpen.value
	isStuck.value = false
}

function open() {
	isOpen.value = true
}

function close() {
	isOpen.value = false
	isStuck.value = false
}

function isLinkActive(link) {
	if (link.disabled) {
		return false
	}
	return isActive(link)
}

function handleNavItemClick(link) {
	if (link.disabled) {
		return
	}
	if (link.type === 'callback' && link.callback) {
		handleLinkClick(() => link.callback())
		return
	}
	handleLinkClick()
}

function handleLinkClick(callback = null) {
	if (callback) {
		callback()
	}
	if (!isStuck.value) {
		close()
	}
}

function syncTogglerAria() {
	const toggler = document.getElementById(TOGGLER_ID)
	if (!toggler) {
		return
	}

	const expanded = isVisible.value
	toggler.setAttribute('aria-expanded', String(expanded))
	toggler.setAttribute('aria-controls', SIDEBAR_PANEL_ID)
	toggler.setAttribute(
		'aria-label',
		expanded ? 'Close sidebar navigation' : 'Open sidebar navigation',
	)
	toggler.removeAttribute('aria-pressed')
	toggler.removeAttribute('aria-haspopup')
}

function handleClickOutside(event) {
	if (!isOpen.value || isStuck.value) {
		return
	}

	const target = event.target

	const sidebarButton = document.getElementById('sidebar-button')
	const sidebarTogglerButton = document.getElementById(TOGGLER_ID)

	if (sidebarButton && sidebarButton.contains(target)) {
		return
	}

	if (sidebarTogglerButton && sidebarTogglerButton.contains(target)) {
		return
	}

	if (sidebarRef.value && !sidebarRef.value.contains(target)) {
		close()
	}
}

function handleDocumentKeydown(event) {
	if (event.key !== 'Escape') {
		return
	}
	if (!isOpen.value || isStuck.value) {
		return
	}
	close()
	document.getElementById(TOGGLER_ID)?.focus()
}

watch([isOpen, isStuck], ([open, stuck]) => {
	nextTick(() => {
		syncTogglerAria()
		if (open && !stuck) {
			document.addEventListener('click', handleClickOutside)
			document.addEventListener('keydown', handleDocumentKeydown)
		} else {
			document.removeEventListener('click', handleClickOutside)
			document.removeEventListener('keydown', handleDocumentKeydown)
		}
	})
}, { immediate: true })

onUnmounted(() => {
	document.removeEventListener('click', handleClickOutside)
	document.removeEventListener('keydown', handleDocumentKeydown)
})

defineExpose({
	isOpen,
	isStuck,
	isVisible,
	stick,
	unstick,
	toggleStick,
	toggle,
	open,
	close,
})
</script>

<style scoped>
h2 {
	padding: .75em;
}

li {
	margin: 0;
	padding: 0;
}

button {
	border: 0;
}

.navigation-links,
.nav-section-links {
	list-style: none;
	margin: 0;
	padding: 0;
}

.nav-section {
	list-style: none;
}

.nav-section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	width: 100%;
	padding: 0.75em;
	text-align: left;
	font-weight: 600;
	font-size: 1em;
	color: var(--text-color);
	background: transparent;
	border-radius: 0;
	cursor: pointer;
}

.nav-section-header:hover,
.nav-section-header:focus-visible {
	background-color: var(--sidebar-hover-bg-color);
	color: var(--hover-text-color);
}

.nav-section-chevron {
	flex-shrink: 0;
	opacity: 0.8;
}

.icon {
	font-size: 1.2em;
	width: 1.5rem;
	text-align: center;
}

.supplemental-links {
	border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
	.sidebar {
		left: -100%;
	}

	.sidebar.shown {
		left: 0;
	}
}
</style>
