<template>
	<aside ref="sidebarRef" :class="{ 'shown': isOpen, 'stuck': isStuck }" class="sidebar">
		<div class = "flex-row">
			<h2>Navigation</h2>
			<div class = "fg1" />
				<button class="stick-toggle" :aria-pressed="isStuck" :title="isStuck ? 'Unstick sidebar' : 'Stick sidebar'"	@click="toggleStick">
					<span v-if="isStuck">
						<HugeiconsIcon :icon="Pin02Icon" width = "1em" height = "1em" :strokeWidth = 3 />
					</span>
					<span v-else>
						<HugeiconsIcon :icon="PinIcon" width = "1em" height = "1em" :strokeWidth = 3 />
					</span>
				</button>
			</div>

			<nav class="mainnav">
				<ul class="navigation-links">
					<template v-for="item in visibleNavItems" :key="item.key">
						<li v-if="item.kind === 'section-header'" class="nav-section-header-item">
							<button
								type="button"
								class="nav-section-header"
								:aria-expanded="!item.collapsed"
								:aria-controls="`nav-section-${item.section.id}`"
								@click="toggleSection(item.section.id)"
							>
								<span>{{ item.section.title }}</span>
								<HugeiconsIcon
									:icon="item.collapsed ? ArrowRight01Icon : ArrowDown01Icon"
									width="0.85em"
									height="0.85em"
									class="nav-section-chevron"
								/>
							</button>
						</li>

						<li
							v-else
							:title="item.link.title"
						>
							<div v-if="item.link.type === 'separator'" class="separator"></div>
							<div v-else-if="item.link.type === 'callback'">
								<a href="#" @click.prevent="handleLinkClick(() => item.link.callback())">
									<HugeiconsIcon :icon="item.link.icon" />
									<span>{{ item.link.title }}</span>
								</a>
							</div>
							<div v-else-if="item.link.type === 'html'" v-html="item.link.html"></div>
							<router-link
								v-else
								v-bind="item.link.props || {}"
								:to="item.link.to || item.link.path"
								:class="{ active: isActive(item.link) }"
								@click="handleLinkClick()"
							>
								<HugeiconsIcon :icon="item.link.icon" />
								<span>{{ item.link.title }}</span>
							</router-link>
						</li>
					</template>
				</ul>
			</nav>
	</aside>
</template>

<script setup>
import { ref, inject, onUnmounted, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Pin02Icon, PinIcon, ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

const STORAGE_KEY = 'picocrank-nav-sections-collapsed'

const isOpen = ref(false)
const isStuck = ref(false)
const sidebarRef = ref(null)
const route = useRoute()

const navigation = inject('navigation', null)

const navigationLinks = navigation ? navigation.navigationLinks : ref([])
const isActive = navigation ? navigation.isActive : (() => false)

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
	const sections = []
	let currentSection = null

	for (const link of navigationLinks.value) {
		if (link.type === 'section') {
			currentSection = { id: link.name, title: link.title, items: [] }
			sections.push(currentSection)
			continue
		}

		if (link.type === 'separator') {
			continue
		}

		if (currentSection) {
			currentSection.items.push(link)
		} else {
			ungrouped.push(link)
		}
	}

	return { ungrouped, sections }
})

const visibleNavItems = computed(() => {
	const items = []

	for (const link of navigationGroups.value.ungrouped) {
		items.push({ key: link.name, kind: 'link', link })
	}

	for (const section of navigationGroups.value.sections) {
		const collapsed = isSectionCollapsed(section.id)
		items.push({
			key: section.id,
			kind: 'section-header',
			section,
			collapsed,
		})

		if (!collapsed) {
			for (const link of section.items) {
				items.push({
					key: link.name,
					kind: 'link',
					link,
				})
			}
		}
	}

	return items
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

function handleLinkClick(callback = null) {
  if (callback) {
    callback()
  }
  if (!isStuck.value) {
    close()
  }
}

function handleClickOutside(event) {
  if (!isOpen.value || isStuck.value) {
    return
  }

  const target = event.target
  
  const sidebarButton = document.getElementById('sidebar-button')
  const sidebarTogglerButton = document.getElementById('sidebar-toggler-button')
  
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

watch([isOpen, isStuck], ([open, stuck]) => {
  nextTick(() => {
    if (open && !stuck) {
      document.addEventListener('click', handleClickOutside)
    } else {
      document.removeEventListener('click', handleClickOutside)
    }
  })
}, { immediate: true })

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({
  isOpen,
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

.active {
	text-decoration: underline;
}

li {
	margin: 0;
	padding: 0;
}

button {
	border: 0;
}

.navigation-links a {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: .75em;
	border-radius: 0;
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
	color: inherit;
	background: transparent;
	cursor: pointer;
}

.nav-section-header:hover {
	background-color: var(--hover-background-color);
	color: white;
}

.nav-section-chevron {
	flex-shrink: 0;
	opacity: 0.8;
}

.separator {
	height: 1px;
	background-color: #eee;
	margin: 0.5rem 0.75rem;
}

.icon {
	font-size: 1.2em;
	width: 1.5rem;
	text-align: center;
}

html[data-theme="dark"] {
  .navigation-links a {
	color: #f8f9fa;
  }

  .nav-section-header {
	color: #f8f9fa;
  }

  .separator {
	background-color: #444;
  }

  .supplemental-links {
	border-top: 1px solid #444;
  }
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
