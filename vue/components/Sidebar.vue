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
import { ref, inject, onUnmounted, watch, nextTick } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Pin02Icon } from '@hugeicons/core-free-icons'
import { PinIcon } from '@hugeicons/core-free-icons'

const isOpen = ref(false)
const isStuck = ref(false)
const sidebarRef = ref(null)

// Get navigation from Navigation component
const navigation = inject('navigation', null)

// Get navigation links and isActive function from navigation
const navigationLinks = navigation ? navigation.navigationLinks : ref([])
const isActive = navigation ? navigation.isActive : (() => false)

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
