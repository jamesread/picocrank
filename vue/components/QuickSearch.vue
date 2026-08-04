<template>
  <div class="quick-search">
    <button
      type="button"
      class="neutral search-trigger"
      :aria-label="buttonLabel"
      :title="buttonTitle"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="open"
    >
      <HugeiconsIcon :icon="SearchIcon" width="1em" height="1em" />
    </button>

    <dialog
      ref="dialogRef"
      class="quick-search-dialog"
      :aria-busy="hasAsyncSearch && isLoading ? 'true' : undefined"
      @close="onDialogClose"
      @click="onDialogBackdropClick"
    >
      <div class="dialog-body" @click.stop>
        <div class="search-container">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="placeholder"
            @input="onSearchInput"
            @keydown="onKeydown"
          />
          <div class="search-icon" aria-hidden="true">
            <HugeiconsIcon
              :icon="hasAsyncSearch && isLoading ? Loading03Icon : SearchIcon"
              width="1em"
              height="1em"
              :class="{ 'is-spinning': hasAsyncSearch && isLoading }"
            />
          </div>
        </div>

        <p
          v-if="hasAsyncSearch && isLoading"
          class="search-status subtle"
          aria-live="polite"
        >
          Searching…
        </p>
        <p
          v-else-if="hasAsyncSearch && searchError"
          class="search-status subtle"
          role="alert"
        >
          {{ searchErrorMessage }}
        </p>

        <div v-if="displayedItems.length > 0" class="search-results" role="listbox">
          <div
            v-for="(item, index) in displayedItems"
            :key="item.id"
            :class="['search-result-item', { active: selectedIndex === index }]"
            role="option"
            :aria-selected="selectedIndex === index"
            @click="selectItem(item)"
            @mouseenter="selectedIndex = index"
          >
            <div v-if="item.icon" class="result-icon">
              <HugeiconsIcon :icon="item.icon" width="1.2em" height="1.2em" />
            </div>
            <div class="result-content">
              <div class="result-title" v-html="highlightText(item.title, searchQuery)"></div>
              <div
                v-if="item.description"
                class="result-description"
                v-html="highlightText(item.description, searchQuery)"
              ></div>
              <div v-if="item.category" class="result-category">{{ item.category }}</div>
            </div>
          </div>
        </div>

        <div
          v-else-if="searchQuery && !(hasAsyncSearch && isLoading)"
          class="no-results"
        >
          <div class="no-results-content">
            <HugeiconsIcon :icon="SearchRemoveIcon" width="2em" height="2em" />
            <p>No results found for "{{ searchQuery }}"</p>
          </div>
        </div>

        <p v-else-if="!searchQuery" class="search-hint subtle">
          Type to search. Use ↑ ↓ and Enter to choose.
        </p>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { HugeiconsIcon } from '@hugeicons/vue'
import { SearchIcon } from '@hugeicons/core-free-icons'
import { SearchRemoveIcon } from '@hugeicons/core-free-icons'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import { ViewIcon } from '@hugeicons/core-free-icons'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search...'
  },
  buttonLabel: {
    type: String,
    default: 'Search',
  },
  buttonTitle: {
    type: String,
    default: 'Search (Ctrl+K)',
  },
  items: {
    type: Array,
    default: () => []
  },
  searchFields: {
    type: Array,
    default: () => ['title', 'description']
  },
  maxResults: {
    type: Number,
    default: 10
  },
  debounceMs: {
    type: Number,
    default: 300
  },
  enableGlobalShortcut: {
    type: Boolean,
    default: true
  },
  autoImportRoutes: {
    type: Boolean,
    default: true
  },
  /**
   * Optional async search provider.
   * When set, QuickSearch shows loading feedback and cancels in-flight requests.
   * Signature: async (query, { signal }) => Item[]
   */
  fetchResults: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits([
  'select',
  'search',
  'search-error',
  'focus',
  'blur',
  'open',
  'close',
])

const router = useRouter()
const dialogRef = ref(null)
const searchInput = ref(null)
const searchQuery = ref('')
const isOpen = ref(false)
const selectedIndex = ref(-1)
const items = ref([...props.items])
const remoteItems = ref([])
const isLoading = ref(false)
const searchError = ref(null)
const debounceTimer = ref(null)
let abortController = null

const hasAsyncSearch = computed(() => typeof props.fetchResults === 'function')

const searchErrorMessage = computed(() => {
  if (!searchError.value) {
    return ''
  }
  if (typeof searchError.value === 'string') {
    return searchError.value
  }
  return searchError.value.message || 'Search failed. Try again.'
})

function importRoutesFromRouter() {
  const routeItems = router.getRoutes()
    .filter(route => route.name)
    .map(route => ({
      id: `route-${route.name}`,
      title: route.meta.title || route.name,
      description: `Navigate to ${route.path}`,
      category: 'Navigation',
      path: route.path,
      icon: route.meta.icon || ViewIcon,
      type: 'route'
    }))

  routeItems.forEach(item => addItem(item))
}

const localFilteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }

  const query = searchQuery.value.toLowerCase()
  return items.value.filter(item => {
    return props.searchFields.some(field => {
      const value = item[field]
      return value && value.toString().toLowerCase().includes(query)
    })
  })
})

const displayedItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }

  const seen = new Set()
  const merged = []

  for (const item of [...localFilteredItems.value, ...remoteItems.value]) {
    if (!item || item.id == null || seen.has(item.id)) {
      continue
    }
    seen.add(item.id)
    merged.push(item)
    if (merged.length >= props.maxResults) {
      break
    }
  }

  return merged
})

function handleGlobalKeydown(event) {
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault()

    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return
    }

    open()
  }
}

function cancelSearch() {
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  isLoading.value = false
}

function clearRemoteResults() {
  remoteItems.value = []
  searchError.value = null
}

async function runSearch(query) {
  selectedIndex.value = -1

  if (!hasAsyncSearch.value) {
    emit('search', query)
    return
  }

  cancelSearch()

  if (!query.trim()) {
    clearRemoteResults()
    emit('search', query, { signal: null })
    return
  }

  abortController = new AbortController()
  const { signal } = abortController

  isLoading.value = true
  searchError.value = null
  emit('search', query, { signal })

  try {
    const results = await props.fetchResults(query, { signal })
    if (signal.aborted) {
      return
    }
    remoteItems.value = Array.isArray(results) ? results : []
  } catch (error) {
    if (error?.name === 'AbortError' || signal.aborted) {
      return
    }
    searchError.value = error
    remoteItems.value = []
    emit('search-error', error)
  } finally {
    if (!signal.aborted) {
      isLoading.value = false
    }
  }
}

function onSearchInput() {
  clearTimeout(debounceTimer.value)
  debounceTimer.value = setTimeout(() => {
    runSearch(searchQuery.value)
  }, props.debounceMs)
}

function onKeydown(event) {
  if (displayedItems.value.length === 0) {
    if (event.key === 'Escape') {
      close()
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, displayedItems.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectItem(displayedItems.value[selectedIndex.value])
      }
      break
    case 'Escape':
      close()
      break
  }
}

function selectItem(item) {
  switch (item.type) {
    case 'route':
      router.push({ path: item.path })
      break
    case 'callback':
      item.callback()
      break
    default:
      emit('select', item)
  }

  clear()
  close()
}

function highlightText(text, query) {
  if (!query || !text) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

function addItem(item) {
  const existingIndex = items.value.findIndex(i => i.id === item.id)
  if (existingIndex >= 0) {
    items.value[existingIndex] = { ...item }
  } else {
    items.value.push({ ...item })
  }
}

function removeItem(itemId) {
  items.value = items.value.filter(item => item.id !== itemId)
}

function clearItems() {
  items.value = []
}

function getItems() {
  return [...items.value]
}

function setItems(newItems) {
  items.value = [...newItems]
}

function setRemoteItems(newItems) {
  remoteItems.value = Array.isArray(newItems) ? [...newItems] : []
  isLoading.value = false
}

async function open() {
  if (!dialogRef.value) {
    return
  }

  if (!dialogRef.value.open) {
    dialogRef.value.showModal()
  }

  isOpen.value = true
  emit('open')
  emit('focus')

  await nextTick()
  searchInput.value?.focus()
}

function close() {
  if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
}

function onDialogClose() {
  cancelSearch()
  clearTimeout(debounceTimer.value)
  isOpen.value = false
  selectedIndex.value = -1
  emit('close')
  emit('blur')
}

function onDialogBackdropClick(event) {
  if (event.target === dialogRef.value) {
    close()
  }
}

function focus() {
  open()
}

function blur() {
  close()
}

function clear() {
  searchQuery.value = ''
  selectedIndex.value = -1
  clearRemoteResults()
  cancelSearch()
}

function refreshRoutes() {
  if (props.autoImportRoutes) {
    importRoutesFromRouter()
  }
}

onMounted(() => {
  if (props.enableGlobalShortcut) {
    document.addEventListener('keydown', handleGlobalKeydown)
  }

  if (props.autoImportRoutes) {
    importRoutesFromRouter()
  }
})

onUnmounted(() => {
  if (props.enableGlobalShortcut) {
    document.removeEventListener('keydown', handleGlobalKeydown)
  }
  clearTimeout(debounceTimer.value)
  cancelSearch()
})

watch(() => props.items, (newItems) => {
  items.value = [...newItems]
}, { deep: true })

defineExpose({
  addItem,
  removeItem,
  clearItems,
  getItems,
  setItems,
  setRemoteItems,
  cancelSearch,
  focus,
  blur,
  open,
  close,
  clear,
  refreshRoutes,
  searchQuery,
  filteredItems: displayedItems,
  displayedItems,
  remoteItems,
  isLoading,
  searchError,
  hasAsyncSearch,
  isOpen,
  showResults: isOpen,
})
</script>

<style scoped>
.quick-search {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.search-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.quick-search-dialog {
  width: min(32rem, calc(100vw - 2rem));
  max-width: 32rem;
  padding: 0;
  border: 1px solid var(--border-color, #d7d7d7);
  background: var(--standout-bg-color, #fff);
  /* Dialog is rendered under <header>, so do not inherit header's white text */
  color: var(--text-color, #334155);
}

.quick-search-dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 0.75em 2.25em 0.75em 0.75em;
  border: 1px solid var(--border-color, #d7d7d7);
  border-radius: 0.4em;
  font-size: 1rem;
  outline: none;
  background-color: #fff;
  color: var(--text-color, #334155);
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  color: #6b7280;
  pointer-events: none;
  display: inline-flex;
}

.search-icon .is-spinning {
  animation: quick-search-spin 0.8s linear infinite;
}

@keyframes quick-search-spin {
  to {
    transform: rotate(360deg);
  }
}

.search-status {
  margin: 0;
}

.search-results {
  max-height: min(20rem, 50vh);
  overflow-y: auto;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 0.4em;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color, #f3f4f6);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item.active {
  background-color: var(--hover-background-color);
  color: var(--hover-text-color);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.result-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.result-category {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-icon {
  margin-right: 0.75rem;
  color: #6b7280;
  flex-shrink: 0;
  display: inline-flex;
}

.no-results-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  color: #6b7280;
  text-align: center;
}

.no-results-content p {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
}

.search-hint {
  margin: 0;
}

mark {
  background-color: var(--karma-important, #fef3c7);
  color: inherit;
  padding: 0;
  border-radius: 2px;
}

html[data-theme="dark"] {
  .quick-search-dialog {
    color: #f9fafb;
  }

  .search-input {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }

  .search-icon,
  .result-description,
  .result-category,
  .result-icon,
  .no-results-content,
  .search-status {
    color: #9ca3af;
  }

  .search-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
}
</style>
