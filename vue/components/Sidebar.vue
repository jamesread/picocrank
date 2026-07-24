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
							:class="{ disabled: item.link.disabled }"
						>
							<div v-if="item.link.type === 'separator'" class="separator"></div>
							<div v-else-if="item.link.type === 'html'" v-html="item.link.html"></div>
							<a
								v-else-if="item.link.type === 'callback' || item.link.disabled"
								href="#"
								:class="{ active: isLinkActive(item.link), disabled: item.link.disabled }"
								:aria-disabled="item.link.disabled || undefined"
								@click.prevent="handleNavItemClick(item.link)"
							>
								<HugeiconsIcon :icon="item.link.icon" />
								<span class="nav-link-title">{{ item.link.title }}</span>
								<span
									v-if="showCount(item.link)"
									class="nav-link-count"
									:aria-label="`${item.link.count} notifications`"
								>{{ formatCount(item.link.count) }}</span>
								<span
									v-else-if="showIndicator(item.link)"
									class="nav-link-indicator"
									aria-label="Requires attention"
								/>
							</a>
							<router-link
								v-else
								v-bind="item.link.props || {}"
								:to="item.link.to || item.link.path"
								:class="{ active: isLinkActive(item.link) }"
								@click="handleLinkClick()"
							>
								<HugeiconsIcon :icon="item.link.icon" />
								<span class="nav-link-title">{{ item.link.title }}</span>
								<span
									v-if="showCount(item.link)"
									class="nav-link-count"
									:aria-label="`${item.link.count} notifications`"
								>{{ formatCount(item.link.count) }}</span>
								<span
									v-else-if="showIndicator(item.link)"
									class="nav-link-indicator"
									aria-label="Requires attention"
								/>
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

function isLinkActive(link) {
  if (link.disabled) {
    return false
  }
  return isActive(link)
}

function showCount(link) {
  return !link.disabled && link.count != null && link.count > 0
}

function showIndicator(link) {
  return link.indicator && !link.disabled && !showCount(link)
}

function formatCount(count) {
  return count > 99 ? '99+' : String(count)
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
	position: relative;
}

.nav-link-title {
	flex: 1;
	min-width: 0;
}

.nav-link-indicator {
	width: 0.5rem;
	height: 0.5rem;
	border-radius: 50%;
	background: var(--indicator-color, #dc3545);
	flex-shrink: 0;
}

.nav-link-count {
	min-width: 1.25rem;
	padding: 0.1rem 0.4rem;
	border-radius: 999px;
	background: var(--indicator-color, #dc3545);
	color: #fff;
	font-size: 0.75em;
	font-weight: 600;
	line-height: 1.2;
	text-align: center;
	flex-shrink: 0;
}

.navigation-links a.disabled,
.navigation-links li.disabled a {
	cursor: not-allowed;
	opacity: 0.55;
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
	border-radius: 0;
	cursor: pointer;
}

.nav-section-header:hover {
	background-color: var(--hover-background-color);
	color: var(--hover-text-color);
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
