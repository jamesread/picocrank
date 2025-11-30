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
					<li v-for="link in navigationLinks" :key="link.name" :title="link.title">
						<!-- Render separator if link is a separator -->
						<div v-if="link.type === 'separator'" class="separator"></div>
						<div v-else-if="link.type === 'callback'">
							<a href="#" @click.prevent="handleLinkClick(() => link.callback())">
								<HugeiconsIcon :icon="link.icon" />
								<span>{{ link.title }}</span>
							</a>
						</div>
						<div v-else-if="link.type === 'html'" v-html="link.html"></div>
					<router-link v-else v-bind="link.props || {}" :to="link.to || link.path" :class="{ active: isActive(link) }" @click="handleLinkClick()">
						<HugeiconsIcon :icon="link.icon" />
						<span>{{ link.title }}</span>
					</router-link>
					</li>
				</ul>
			</nav>
	</aside>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Pin02Icon } from '@hugeicons/core-free-icons'
import { PinIcon } from '@hugeicons/core-free-icons'

const isOpen = ref(false)
const isStuck = ref(false)
const navigationLinks = ref([])
const sidebarRef = ref(null)

const route = useRoute()
const router = useRouter()

/**
 * Add a router link to the sidebar navigation
 * @param {string} link - Route name
 * @param {string|null} altTitle - Optional alternative title
 * @param {object} options - Additional options
 * @param {object} options.params - Route params to pass (e.g., { id: 1 })
 * @param {object} options.props - Props to pass to router-link (e.g., { replace: true, custom: true })
 * @param {object|string} options.to - Override the 'to' prop (if provided, takes precedence over params)
 */
function addRouterLink(link, altTitle = null, options = {}) {
	const foundRoute = router.getRoutes().find(r => r.name === link)

	if (!foundRoute) {
		console.warn(`Route "${link}" not found`)
		return
	}

	const title = altTitle || foundRoute.meta?.title || foundRoute.name

	// Determine the 'to' value: use options.to if provided, otherwise construct from params, or fall back to path
	let toValue = foundRoute.path
	if (options.to) {
		toValue = options.to
	} else if (options.params) {
		toValue = { name: link, params: options.params }
	}

	const routeLink = {
		name: link,
		title: title,
		path: foundRoute.path,
		to: toValue,
		icon: foundRoute.meta?.icon || PinIcon,
		type: 'route',
		props: options.props || {}
	}

	addNavigationLink(routeLink)
}

function addNavigationLink(link) {
  const existingIndex = navigationLinks.value.findIndex(l => l.name === link.name)
  if (existingIndex >= 0) {
	navigationLinks.value[existingIndex] = { ...link }
  } else {
	navigationLinks.value.push({ ...link })
  }
}

function addCallback(title, callback, options = {}) {
  const callbackLink = {
	name: options.name || title.toLowerCase().replace(/\s+/g, '-'),
	type: 'callback',
	icon: options.icon || PinIcon,
	callback: callback || (() => {}),
	title: title
  }

  addNavigationLink(callbackLink)
}

function addSeparator(id) {
  const separator = {
    name: id || `nav-separator-${Date.now()}`,
    type: 'separator',
    title: 'Separator'
  }
  addNavigationLink(separator)
}

function addHtml(html, options = {}) {
  const htmlLink = {
    name: options.name || `html-item-${Date.now()}`,
    type: 'html',
    html: html,
    title: options.title || 'HTML Item'
  }
  addNavigationLink(htmlLink)
}

function removeNavigationLink(linkId) {
  navigationLinks.value = navigationLinks.value.filter(link => link.id !== linkId)
}

function clearNavigationLinks() {
  navigationLinks.value = []
}

function getNavigationLinks() {
  return [...navigationLinks.value]
}

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

function isActive(link) {
  // If link has a 'to' object with a name, compare route name and params
  if (link.to && typeof link.to === 'object' && link.to.name) {
    // Compare route names first
    if (route.name !== link.to.name) {
      return false
    }
    
    // If params are specified in the link, all specified params must match
    if (link.to.params && Object.keys(link.to.params).length > 0) {
      const linkParams = link.to.params
      const routeParams = route.params
      
      // Check if all params in link.to.params match route.params
      for (const key in linkParams) {
        if (String(routeParams[key]) !== String(linkParams[key])) {
          return false
        }
      }
    }
    
    // Route name matches, and either no params specified or all params match
    return true
  }
  
  // Fall back to path comparison for string paths
  const linkPath = typeof link.to === 'string' ? link.to : link.path
  return route.path === linkPath
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
  // Only close if sidebar is open and unpinned
  if (!isOpen.value || isStuck.value) {
    return
  }

  const target = event.target
  
  // Check if click is on the sidebar toggle button or its container
  // These elements should not trigger the close action
  const sidebarButton = document.getElementById('sidebar-button')
  const sidebarTogglerButton = document.getElementById('sidebar-toggler-button')
  
  // Don't close if clicking on toggle button or its parent container
  if (sidebarButton && sidebarButton.contains(target)) {
    return
  }
  
  if (sidebarTogglerButton && sidebarTogglerButton.contains(target)) {
    return
  }

  // Check if click is outside the sidebar element
  if (sidebarRef.value && !sidebarRef.value.contains(target)) {
    close()
  }
}

// Watch for sidebar open/close state to manage event listener
watch([isOpen, isStuck], ([open, stuck]) => {
  nextTick(() => {
    if (open && !stuck) {
      // Add event listener when sidebar is open and unpinned
      document.addEventListener('click', handleClickOutside)
    } else {
      // Remove event listener when sidebar is closed or pinned
      document.removeEventListener('click', handleClickOutside)
    }
  })
}, { immediate: true })

// Clean up event listener on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

defineExpose({
  isOpen,
  navigationLinks,
  stick,
  unstick,
  toggleStick,
  toggle,
  open,
  close,
  isActive,
  addNavigationLink,
  addRouterLink,
  addCallback,
  addSeparator,
  addHtml,
  removeNavigationLink,
  clearNavigationLinks,
  getNavigationLinks,
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

@media (prefers-color-scheme: dark) {
  .navigation-links a {
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
