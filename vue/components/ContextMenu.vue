<template>
	<Teleport :to="teleportTo">
		<nav
			v-if="open"
			ref="menuRef"
			v-bind="$attrs"
			class="menu context-menu"
			role="menu"
			tabindex="-1"
			:style="style"
			:aria-label="ariaLabel"
			@click.stop
			@contextmenu.prevent
			@keydown="onMenuKeyDown"
		>
			<ul class="noListStyle">
				<li>
					<div>
						<ul>
							<template v-for="(item, index) in items" :key="itemKey(item, index)">
								<li
									v-if="item.divider"
									role="separator"
								/>
								<li v-else>
									<button
										type="button"
										role="menuitem"
										:class="{
											'inline-icon': Boolean(item.icon),
											bad: item.danger,
										}"
										:disabled="item.disabled"
										@click="onSelect(item)"
									>
										<HugeiconsIcon
											v-if="item.icon"
											:icon="item.icon"
											width="1em"
											height="1em"
											:strokeWidth="2.5"
											aria-hidden="true"
										/>
										<span>{{ itemLabel(item) }}</span>
									</button>
								</li>
							</template>
						</ul>
					</div>
				</li>
			</ul>
		</nav>
	</Teleport>
</template>

<script setup>
/**
 * A menu of actions at a point on screen, e.g. where a row or day was right-clicked, or under the
 * button that opened it. Items: { id, label, icon, danger, disabled, divider, showCount }, plus
 * any keys of your own. Picking an item emits `select` with it and closes the menu;
 * Escape, Tab past the ends, a click elsewhere, scrolling or resizing close it. Arrow keys, Home
 * and End move between items. Inside a modal Dialog it is rendered into the dialog.
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useOverlayTarget } from '../composables/overlayTarget.js'
import { HugeiconsIcon } from '@hugeicons/vue'

// Attributes (e.g. a class) go on the menu itself, not the Teleport around it.
defineOptions({ inheritAttrs: false })

const props = defineProps({
	open: {
		type: Boolean,
		default: false,
	},
	items: {
		type: Array,
		default: () => [],
	},
	clientX: {
		type: Number,
		default: 0,
	},
	clientY: {
		type: Number,
		default: 0,
	},
	/** How many things the menu acts on; above 1, labels gain a count, e.g. "Delete (3)". */
	targetCount: {
		type: Number,
		default: 1,
	},
	/** Accessible name of the menu. */
	ariaLabel: {
		type: String,
		default: 'Actions',
	},
})

// Inside a modal Dialog, the menu goes into the dialog so it is not hidden beneath it.
const teleportTo = useOverlayTarget(() => props.open)

const emit = defineEmits(['update:open', 'select', 'cancel'])

const MENU_MARGIN_PX = 8
const menuRef = ref(null)
const style = ref({ top: '0px', left: '0px' })

function itemKey(item, index) {
	if (item.divider) {
		return `divider-${index}`
	}
	return item.id ?? item.label ?? index
}

function itemLabel(item) {
	if (typeof item.label === 'function') {
		return item.label({ count: props.targetCount })
	}
	const label = item.label ?? ''
	if (props.targetCount > 1 && item.showCount !== false) {
		return `${label} (${props.targetCount})`
	}
	return label
}

function positionMenu() {
	const menu = menuRef.value
	if (!menu) {
		return
	}

	const rect = menu.getBoundingClientRect()
	const margin = MENU_MARGIN_PX
	let top = props.clientY
	let left = props.clientX

	if (left + rect.width > window.innerWidth - margin) {
		left = window.innerWidth - rect.width - margin
	}
	if (top + rect.height > window.innerHeight - margin) {
		top = window.innerHeight - rect.height - margin
	}
	if (left < margin) {
		left = margin
	}
	if (top < margin) {
		top = margin
	}

	style.value = {
		top: `${top}px`,
		left: `${left}px`,
	}
}

function close() {
	emit('update:open', false)
	emit('cancel')
}

function onSelect(item) {
	if (item.disabled) {
		return
	}
	emit('select', item)
	emit('update:open', false)
}

function enabledMenuItems() {
	if (!menuRef.value) {
		return []
	}
	return [...menuRef.value.querySelectorAll('[role="menuitem"]:not([disabled])')]
}

function onMenuKeyDown(event) {
	const items = enabledMenuItems()
	const active = document.activeElement
	const currentIndex = items.indexOf(active)
	const focusIsOnMenuShell = active === menuRef.value

	if (event.key === 'Escape') {
		event.preventDefault()
		close()
		return
	}

	if (event.key === 'ArrowDown') {
		event.preventDefault()
		const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length
		items[nextIndex]?.focus()
		return
	}

	if (event.key === 'ArrowUp') {
		event.preventDefault()
		const nextIndex = currentIndex < 0
			? items.length - 1
			: (currentIndex - 1 + items.length) % items.length
		items[nextIndex]?.focus()
		return
	}

	if (event.key === 'Home') {
		event.preventDefault()
		items[0]?.focus()
		return
	}

	if (event.key === 'End') {
		event.preventDefault()
		items[items.length - 1]?.focus()
		return
	}

	if (event.key !== 'Tab' || items.length === 0) {
		return
	}

	// Tab through items; leave (and close) rather than jumping to the rest of the page.
	if (event.shiftKey) {
		if (focusIsOnMenuShell || currentIndex <= 0) {
			event.preventDefault()
			close()
		}
		return
	}

	if (currentIndex === items.length - 1) {
		event.preventDefault()
		close()
	}
}

function onDocumentPointerDown(event) {
	if (!props.open) {
		return
	}
	if (menuRef.value?.contains(event.target)) {
		return
	}
	close()
}

function onDocumentKeyDown(event) {
	if (!props.open) {
		return
	}
	if (event.key === 'Escape') {
		close()
	}
}

// The menu stays where it opened, so it closes when what it points at moves.
function onViewportChange(event) {
	if (props.open && !menuRef.value?.contains(event?.target)) {
		close()
	}
}

function attachListeners() {
	window.addEventListener('pointerdown', onDocumentPointerDown, true)
	window.addEventListener('keydown', onDocumentKeyDown)
	window.addEventListener('scroll', onViewportChange, true)
	window.addEventListener('resize', onViewportChange)
}

function detachListeners() {
	window.removeEventListener('pointerdown', onDocumentPointerDown, true)
	window.removeEventListener('keydown', onDocumentKeyDown)
	window.removeEventListener('scroll', onViewportChange, true)
	window.removeEventListener('resize', onViewportChange)
}

watch(
	() => props.open,
	async (isOpen) => {
		detachListeners()
		if (!isOpen) {
			return
		}
		style.value = {
			top: `${props.clientY}px`,
			left: `${props.clientX}px`,
		}
		await nextTick()
		positionMenu()
		// Focus the menu shell so keyboard users can Tab/arrow into items,
		// without visually selecting the first action on open.
		menuRef.value?.focus({ preventScroll: true })
		attachListeners()
	},
	// A menu mounted already open still positions itself and listens for closing.
	{ immediate: true },
)

onBeforeUnmount(() => {
	detachListeners()
})
</script>
