<template>
	<!-- Navigation component has no visual output, it only manages navigation state -->
	<slot />
</template>

<script setup>
import { ref, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PinIcon } from '@hugeicons/core-free-icons'

const navigationLinks = ref([])
const route = useRoute()
const router = useRouter()

/**
 * Add a router link to the navigation
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
		props: options.props || {},
		description: options.description || foundRoute.meta?.description || null
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
	title: title,
	description: options.description || null
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

// Provide navigation API for child components
provide('navigation', {
  navigationLinks,
  addRouterLink,
  addNavigationLink,
  addCallback,
  addSeparator,
  addHtml,
  removeNavigationLink,
  clearNavigationLinks,
  getNavigationLinks,
  isActive
})

// Expose API for direct ref access
defineExpose({
  navigationLinks,
  addRouterLink,
  addNavigationLink,
  addCallback,
  addSeparator,
  addHtml,
  removeNavigationLink,
  clearNavigationLinks,
  getNavigationLinks,
  isActive
})
</script>

