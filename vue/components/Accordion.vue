<template>
	<div class="accordion">
		<slot />
	</div>
</template>

<script setup>
import { provide, ref, watch } from 'vue'
import { accordionContextKey } from './accordionContext.js'

const props = defineProps({
	/** Panel ids that start expanded. */
	defaultOpenIds: {
		type: Array,
		default: () => [],
	},
})

const openIds = ref(new Set())

function syncDefaultOpen() {
	openIds.value = new Set(props.defaultOpenIds.filter(Boolean))
}

watch(() => props.defaultOpenIds, syncDefaultOpen, { immediate: true, deep: true })

function isOpen(id) {
	return openIds.value.has(id)
}

function setOpen(id, isOpenNow) {
	const currently = openIds.value.has(id)
	if (currently === isOpenNow) {
		return
	}
	const next = new Set(openIds.value)
	if (isOpenNow) {
		next.add(id)
	} else {
		next.delete(id)
	}
	openIds.value = next
}

provide(accordionContextKey, { isOpen, setOpen })
</script>
