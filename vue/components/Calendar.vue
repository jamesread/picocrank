<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'

const props = defineProps({
	events: {
		type: Array,
		required: true,
	},
	monthNames: {
		type: Array,
		default: () => [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December',
		],
	},
	dayNames: {
		type: Array,
		default: () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
	},
	loading: {
		type: Boolean,
		default: false,
	},
	error: {
		type: String,
		default: null,
	},
	eventDragEnabled: {
		type: Boolean,
		default: true,
	},
	eventMoveResponseTimeoutMs: {
		type: Number,
		default: 15000,
	},
	getEventDate: {
		type: Function,
		default: null,
	},
	getEventDateRange: {
		type: Function,
		default: null,
	},
	formatEventTime: {
		type: Function,
		default: null,
	},
	showNavigation: {
		type: Boolean,
		default: true,
	},
	shortMonthSuffix: {
		type: Boolean,
		default: false,
	},
	currentMonth: {
		type: Number,
		default: undefined,
	},
	currentYear: {
		type: Number,
		default: undefined,
	},
	viewMode: {
		type: String,
		default: 'month',
		validator: (value) => ['month', 'week', 'day'].includes(value),
	},
	focusDate: {
		type: [Date, String, Number],
		default: null,
	},
})

const emit = defineEmits([
	'event-click',
	'date-click',
	'date-range-select',
	'month-change',
	'event-context-menu',
	'event-move-request',
	'event-moved',
	'event-move-rejected',
	'update:viewMode',
	'update:focusDate',
	'view-change',
])

// Internal calendar state
const internalCurrentDate = ref(new Date())
const currentDate = computed(() => {
  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    return new Date(props.currentYear, props.currentMonth, 1)
  }
  return internalCurrentDate.value
})

const viewMonth = computed(() => currentDate.value.getMonth())
const viewYear = computed(() => currentDate.value.getFullYear())

// Monday-start week containing the given date
function getWeekStart(date) {
  const d = new Date(date)
  const dayOfWeek = (d.getDay() + 6) % 7 // Monday=0
  d.setDate(d.getDate() - dayOfWeek)
  d.setHours(0, 0, 0, 0)
  return d
}

// Compute the first visible day (Monday) for the current month view
function getStartOfGrid(date) {
  return getWeekStart(new Date(date.getFullYear(), date.getMonth(), 1))
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function parseFocusDate(value) {
  if (value == null) {
    return startOfDay(new Date())
  }

  const parsed = value instanceof Date ? new Date(value) : new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return startOfDay(new Date())
  }

  return startOfDay(parsed)
}

function normalizeViewAnchor(mode, focusDateValue) {
  const focus = parseFocusDate(focusDateValue)

  if (mode === 'week') {
    return getWeekStart(focus)
  }
  if (mode === 'day') {
    return focus
  }

  return getStartOfGrid(currentDate.value)
}

// Anchor date for the grid; we will shift this by weeks without re-rendering the grid structure
const gridStartDate = ref(getStartOfGrid(currentDate.value))
// Track if we're actively scrolling to prevent watcher from resetting grid anchor
const isScrolling = ref(false)
const internalViewMode = ref(props.viewMode)
const isCompactView = computed(() => internalViewMode.value !== 'month')

const headerTitle = computed(() => {
  if (internalViewMode.value === 'month') {
    return `${props.monthNames[viewMonth.value]} ${viewYear.value}`
  }

  if (internalViewMode.value === 'day') {
    const day = gridStartDate.value
    return day.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const start = gridStartDate.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startMonth = props.monthNames[start.getMonth()]
  const endMonth = props.monthNames[end.getMonth()]
  const startYear = start.getFullYear()
  const endYear = end.getFullYear()

  if (startYear === endYear && start.getMonth() === end.getMonth()) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${startYear}`
  }
  if (startYear === endYear) {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${startYear}`
  }
  return `${startMonth} ${start.getDate()}, ${startYear} – ${endMonth} ${end.getDate()}, ${endYear}`
})

// Helper function to check if a time is midnight (00:00)
function isMidnight(dateValue) {
  if (!dateValue) return false
  const date = new Date(dateValue)
  return date.getHours() === 0 && date.getMinutes() === 0
}

// Helper function to format time, returning "No time" if midnight
function formatTimeOrNoTime(dateValue) {
  if (!dateValue) return 'No time'
  if (isMidnight(dateValue)) return 'No time'
  const date = new Date(dateValue)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Determine if a date is in the past (before today)
function isPastDay(date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return day.getTime() < today.getTime()
}

// Get event date range
function resolveEventDateRange(event) {
  if (props.getEventDateRange) {
    return props.getEventDateRange(event)
  }
  
  // Default implementation
  let start = null
  let end = null
  
  if (event.startDate) {
    start = new Date(event.startDate)
  } else if (event.date) {
    start = new Date(event.date)
  }
  
  if (event.endDate) {
    end = new Date(event.endDate)
  }
  
  return { start, end }
}

// Get events for a specific date
function getEventsForDate(date) {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  return props.events.filter(event => {
    const { start, end } = resolveEventDateRange(event)
    
    if (!start) return false
    
    const startDateOnly = new Date(start)
    startDateOnly.setHours(0, 0, 0, 0)
    
    if (end) {
      const endDateOnly = new Date(end)
      endDateOnly.setHours(0, 0, 0, 0)
      return targetDate >= startDateOnly && targetDate <= endDateOnly
    } else {
      return targetDate.getTime() === startDateOnly.getTime()
    }
  })
}

// Check if an event is a multi-day event
function isMultiDayEvent(event) {
  const { start, end } = resolveEventDateRange(event)
  
  if (!start || !end) return false

  const startDate = new Date(start)
  const endDate = new Date(end)

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)

  return startDate.getTime() !== endDate.getTime()
}

// Get the position of an event within a multi-day range for a specific date
function getMultiDayPosition(event, date) {
  const { start, end } = resolveEventDateRange(event)
  
  if (!start || !end) return 'single'

  const startDate = new Date(start)
  const endDate = new Date(end)
  const targetDate = new Date(date)

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)

  if (startDate.getTime() === endDate.getTime()) return 'single'
  if (targetDate.getTime() === startDate.getTime()) return 'start'
  if (targetDate.getTime() === endDate.getTime()) return 'end'
  if (targetDate > startDate && targetDate < endDate) return 'middle'

  return 'single'
}

// Format event time based on position in multi-day event
function formatEventTimeDefault(event, date) {
  if (props.formatEventTime) {
    return props.formatEventTime(event, date)
  }
  
  const { start, end } = resolveEventDateRange(event)
  const position = getMultiDayPosition(event, date)

  if (!start || !end) return 'No time'

  if (position === 'start') {
    return formatTimeOrNoTime(start)
  } else if (position === 'end') {
    return formatTimeOrNoTime(end)
  } else if (position === 'middle') {
    return 'All day'
  } else if (position === 'single') {
    return formatTimeOrNoTime(start)
  }

  return 'All day'
}

function getEventStyle(event) {
  const style = {}
  if (event.color) {
    style['--event-color'] = event.color
  }
  if (event.foregroundColor) {
    style['--event-foreground-color'] = event.foregroundColor
  }
  return Object.keys(style).length > 0 ? style : undefined
}

// Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
function getOrdinalSuffix(day) {
  const j = day % 10
  const k = day % 100
  if (j === 1 && k !== 11) {
    return 'st'
  }
  if (j === 2 && k !== 12) {
    return 'nd'
  }
  if (j === 3 && k !== 13) {
    return 'rd'
  }
  return 'th'
}

function calendarDayCount(mode = internalViewMode.value) {
  if (mode === 'week') return 7
  if (mode === 'day') return 1
  return 42
}

function sortedEventsForDay(day) {
  return [...day.events].sort((a, b) => {
    const aMultiDay = isMultiDayEvent(a)
    const bMultiDay = isMultiDayEvent(b)
    if (aMultiDay && !bMultiDay) return -1
    if (!aMultiDay && bMultiDay) return 1
    return 0
  })
}

function visibleEventsForDay(day) {
  const sorted = sortedEventsForDay(day)
  return internalViewMode.value === 'day' ? sorted : sorted.slice(0, 3)
}

// Calendar generation from persistent grid start
const calendarDays = computed(() => {
  const days = []
  const start = gridStartDate.value
  const dayCount = calendarDayCount()
  for (let i = 0; i < dayCount; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date,
      events: getEventsForDate(date)
    })
  }
  return days
})

function commitViewChange(mode, focusDateValue, { emitUpdates = true } = {}) {
  const gridStart = normalizeViewAnchor(mode, focusDateValue)
  internalViewMode.value = mode
  gridStartDate.value = gridStart

  if (mode !== 'month') {
    syncMonthFromGridStart()
  }

  if (emitUpdates) {
    emit('update:viewMode', mode)
    emit('update:focusDate', mode === 'month' ? null : gridStart)
    emit('view-change', { mode, focusDate: mode === 'month' ? null : gridStart })
  }
}

function applyExternalView(mode, focusDateValue) {
  const gridStart = normalizeViewAnchor(mode, focusDateValue)
  if (
    mode === internalViewMode.value
    && toDateKey(gridStartDate.value) === toDateKey(gridStart)
  ) {
    return
  }

  internalViewMode.value = mode
  gridStartDate.value = gridStart
  if (mode !== 'month') {
    syncMonthFromGridStart()
  }
}

watch(
  () => [props.viewMode, props.focusDate],
  ([mode, focusDateValue]) => {
    applyExternalView(mode, focusDateValue)
  },
  { immediate: true },
)

function syncMonthFromGridStart() {
  const { month, year } = getVisibleMonthYear(gridStartDate.value, internalViewMode.value)
  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    if (month !== viewMonth.value || year !== viewYear.value) {
      emit('month-change', month, year)
    }
  } else {
    internalCurrentDate.value = new Date(year, month, 1)
  }
}

// Navigation functions
function previousMonth() {
  if (internalViewMode.value === 'week') {
    adjustByWeeks(-1)
    return
  }
  if (internalViewMode.value === 'day') {
    adjustByDays(-1)
    return
  }

  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    const newMonth = viewMonth.value === 0 ? 11 : viewMonth.value - 1
    const newYear = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value
    emit('month-change', newMonth, newYear)
    // Optimistically update grid anchor for smooth transition
    gridStartDate.value = getStartOfGrid(new Date(newYear, newMonth, 1))
  } else {
    internalCurrentDate.value = new Date(viewYear.value, viewMonth.value - 1, 1)
    gridStartDate.value = getStartOfGrid(internalCurrentDate.value)
  }
}

function nextMonth() {
  if (internalViewMode.value === 'week') {
    adjustByWeeks(1)
    return
  }
  if (internalViewMode.value === 'day') {
    adjustByDays(1)
    return
  }

  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    const newMonth = viewMonth.value === 11 ? 0 : viewMonth.value + 1
    const newYear = viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value
    emit('month-change', newMonth, newYear)
    gridStartDate.value = getStartOfGrid(new Date(newYear, newMonth, 1))
  } else {
    internalCurrentDate.value = new Date(viewYear.value, viewMonth.value + 1, 1)
    gridStartDate.value = getStartOfGrid(internalCurrentDate.value)
  }
}

function goToToday() {
  const today = new Date()
  if (internalViewMode.value === 'week') {
    commitViewChange('week', today)
    return
  }
  if (internalViewMode.value === 'day') {
    commitViewChange('day', today)
    return
  }

  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    emit('month-change', today.getMonth(), today.getFullYear())
    gridStartDate.value = getStartOfGrid(today)
  } else {
    internalCurrentDate.value = new Date()
    gridStartDate.value = getStartOfGrid(internalCurrentDate.value)
  }
}

// Week navigation (mouse wheel)
const lastWheelAt = ref(0)
const wheelThrottleMs = 180
function getVisibleMonthYear(start, mode = internalViewMode.value) {
  if (mode === 'day') {
    return { month: start.getMonth(), year: start.getFullYear() }
  }

  const mid = new Date(start)
  mid.setDate(start.getDate() + (mode === 'week' ? 3 : 21))
  return { month: mid.getMonth(), year: mid.getFullYear() }
}

function syncNavigationMonth(newStart) {
  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    const { month, year } = getVisibleMonthYear(newStart)
    if (month !== viewMonth.value || year !== viewYear.value) {
      emit('month-change', month, year)
      isScrolling.value = true
      setTimeout(() => { isScrolling.value = false }, 100)
    }
  } else {
    const { month, year } = getVisibleMonthYear(newStart)
    internalCurrentDate.value = new Date(year, month, 1)
  }
}

function adjustByWeeks(weeks) {
  const newStart = new Date(gridStartDate.value)
  newStart.setDate(newStart.getDate() + weeks * 7)

  if (internalViewMode.value === 'month') {
    gridStartDate.value = newStart
    syncNavigationMonth(newStart)
    return
  }

  commitViewChange(internalViewMode.value, newStart)
}

function adjustByDays(days) {
  const newStart = new Date(gridStartDate.value)
  newStart.setDate(newStart.getDate() + days)
  commitViewChange('day', newStart)
}

function handleWheel(event) {
  // Prevent page scrolling while using calendar scroll
  event.preventDefault()
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  if (now - lastWheelAt.value < wheelThrottleMs) return
  lastWheelAt.value = now
  const direction = event.deltaY > 0 ? 1 : -1
  if (internalViewMode.value === 'day') {
    adjustByDays(direction)
    return
  }
  adjustByWeeks(direction)
}

// Event handlers
function handleEventClick(event) {
  emit('event-click', event)
}

function handleContextMenu(event, mouseEvent) {
  mouseEvent.preventDefault()
  mouseEvent.stopPropagation()
  emit('event-context-menu', event, mouseEvent)
}

// --- Day context menu ---

const DAY_CONTEXT_MENU_MARGIN_PX = 8
const dayContextMenuOpen = ref(false)
const dayContextMenuStyle = ref({ top: '0px', left: '0px' })
const dayContextMenuDate = ref(null)
const dayContextMenuRef = ref(null)

function positionDayContextMenu(clientX, clientY) {
  const menu = dayContextMenuRef.value
  if (!menu) return

  const rect = menu.getBoundingClientRect()
  const margin = DAY_CONTEXT_MENU_MARGIN_PX
  let top = clientY
  let left = clientX

  if (left + rect.width > window.innerWidth - margin) {
    left = window.innerWidth - rect.width - margin
  }
  if (top + rect.height > window.innerHeight - margin) {
    top = window.innerHeight - rect.height - margin
  }
  if (left < margin) left = margin
  if (top < margin) top = margin

  dayContextMenuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  }
}

function closeDayContextMenu() {
  dayContextMenuOpen.value = false
  dayContextMenuDate.value = null
}

function onDocumentPointerDownForDayMenu(event) {
  if (!dayContextMenuOpen.value) return
  if (dayContextMenuRef.value?.contains(event.target)) return
  closeDayContextMenu()
}

function onDocumentKeyDownForDayMenu(event) {
  if (!dayContextMenuOpen.value) return
  if (event.key === 'Escape') {
    closeDayContextMenu()
  }
}

function attachDayContextMenuListeners() {
  window.addEventListener('pointerdown', onDocumentPointerDownForDayMenu, true)
  window.addEventListener('keydown', onDocumentKeyDownForDayMenu)
}

function detachDayContextMenuListeners() {
  window.removeEventListener('pointerdown', onDocumentPointerDownForDayMenu, true)
  window.removeEventListener('keydown', onDocumentKeyDownForDayMenu)
}

function onDayContextMenu(date, mouseEvent) {
  if (isEventTarget(mouseEvent)) return

  mouseEvent.preventDefault()
  mouseEvent.stopPropagation()

  dayContextMenuDate.value = startOfDay(date)
  dayContextMenuOpen.value = true
  dayContextMenuStyle.value = {
    top: `${mouseEvent.clientY}px`,
    left: `${mouseEvent.clientX}px`,
  }

  nextTick(() => {
    positionDayContextMenu(mouseEvent.clientX, mouseEvent.clientY)
    dayContextMenuRef.value?.querySelector('button')?.focus()
  })
}

function showOnlyThisWeek() {
  const date = dayContextMenuDate.value
  if (!date) return

  commitViewChange('week', date)
  closeDayContextMenu()
}

function showOnlyThisDay() {
  const date = dayContextMenuDate.value
  if (!date) return

  commitViewChange('day', date)
  closeDayContextMenu()
}

function showFullMonth() {
  commitViewChange('month', currentDate.value)
  closeDayContextMenu()
}

function showWeekViewFromDay() {
  commitViewChange('week', gridStartDate.value)
}

function setView({ mode, focusDate: nextFocusDate } = {}) {
  const nextMode = mode ?? internalViewMode.value
  const anchor = nextFocusDate ?? (nextMode === 'month' ? currentDate.value : gridStartDate.value)
  commitViewChange(nextMode, anchor)
}

defineExpose({
  setView,
  showMonthView: () => commitViewChange('month', currentDate.value),
  showWeekView: (date) => commitViewChange('week', date ?? gridStartDate.value),
  showDayView: (date) => commitViewChange('day', date ?? gridStartDate.value),
})

watch(dayContextMenuOpen, (open) => {
  if (open) {
    attachDayContextMenuListeners()
  } else {
    detachDayContextMenuListeners()
  }
})

// --- Date range selection (click / drag) ---

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateFromKey(key) {
  const [y, m, day] = key.split('-').map(Number)
  return startOfDay(new Date(y, m - 1, day))
}

const isDraggingRange = ref(false)
const rangeDragAnchor = ref(null)
const rangeDragEnd = ref(null)
const selectedRangeStart = ref(null)
const selectedRangeEnd = ref(null)

function isEventTarget(ev) {
  const t = ev.target
  if (!(t instanceof Node)) return false
  return Boolean(t.closest?.('.calendar-event'))
}

function getRangeBounds() {
  const a = rangeDragAnchor.value
  const b = rangeDragEnd.value
  if (!a || !b) return null
  const sa = startOfDay(a).getTime()
  const sb = startOfDay(b).getTime()
  if (sa <= sb) return { lo: startOfDay(a), hi: startOfDay(b) }
  return { lo: startOfDay(b), hi: startOfDay(a) }
}

function rangeHighlightForDate(date) {
  const bounds = isDraggingRange.value
    ? getRangeBounds()
    : selectedRangeStart.value && selectedRangeEnd.value
      ? (() => {
          const rangeStart = selectedRangeStart.value
          const rangeEnd = selectedRangeEnd.value
          const sa = startOfDay(rangeStart).getTime()
          const sb = startOfDay(rangeEnd).getTime()
          const lo = sa <= sb ? startOfDay(rangeStart) : startOfDay(rangeEnd)
          const hi = sa <= sb ? startOfDay(rangeEnd) : startOfDay(rangeStart)
          return { lo, hi }
        })()
      : null
  if (!bounds) return 'none'
  const t = startOfDay(date).getTime()
  if (t < bounds.lo.getTime() || t > bounds.hi.getTime()) return 'none'
  if (bounds.lo.getTime() === bounds.hi.getTime()) return 'single'
  if (t === bounds.lo.getTime()) return 'start'
  if (t === bounds.hi.getTime()) return 'end'
  return 'middle'
}

function onWindowTouchMove(ev) {
  if (!isDraggingRange.value || ev.touches.length === 0) return
  const { clientX, clientY } = ev.touches[0]
  const el = document.elementFromPoint(clientX, clientY)
  if (!el) return
  const cell = el.closest?.('[data-calendar-date]')
  const key = cell?.dataset?.calendarDate
  if (!key) return
  rangeDragEnd.value = dateFromKey(key)
}

function detachRangePointerListeners() {
  window.removeEventListener('mouseup', endRangeSelectionFromPointer)
  window.removeEventListener('blur', endRangeSelectionFromPointer)
  window.removeEventListener('touchmove', onWindowTouchMove)
  window.removeEventListener('touchend', endRangeSelectionFromPointer)
  window.removeEventListener('touchcancel', endRangeSelectionFromPointer)
}

function endRangeSelectionFromPointer() {
  if (!isDraggingRange.value) return
  const bounds = getRangeBounds()
  isDraggingRange.value = false
  rangeDragAnchor.value = null
  rangeDragEnd.value = null
  detachRangePointerListeners()

  if (!bounds) return

  selectedRangeStart.value = new Date(bounds.lo)
  selectedRangeEnd.value = new Date(bounds.hi)
  emit('date-range-select', new Date(bounds.lo), new Date(bounds.hi))

  if (bounds.lo.getTime() === bounds.hi.getTime()) {
    emit('date-click', new Date(bounds.lo))
  }
}

function onDayPointerDown(date, ev) {
  if (isEventTarget(ev)) return
  if (ev instanceof MouseEvent && ev.button !== 0) return

  const d = startOfDay(date)
  isDraggingRange.value = true
  rangeDragAnchor.value = new Date(d)
  rangeDragEnd.value = new Date(d)
  window.addEventListener('mouseup', endRangeSelectionFromPointer)
  window.addEventListener('blur', endRangeSelectionFromPointer)
  window.addEventListener('touchmove', onWindowTouchMove, { passive: true })
  window.addEventListener('touchend', endRangeSelectionFromPointer)
  window.addEventListener('touchcancel', endRangeSelectionFromPointer)
  if (ev instanceof MouseEvent) {
    ev.preventDefault()
  }
}

function onDayPointerEnter(date) {
  if (!isDraggingRange.value) return
  rangeDragEnd.value = startOfDay(date)
}

onUnmounted(() => {
  detachRangePointerListeners()
  detachDayContextMenuListeners()
})

// --- Calendar event drag and drop (HTML5) ---

const CALENDAR_EVENT_DRAG_MIME = 'application/x-picocrank-calendar-event-id'

const draggingEventId = ref(null)
const draggingSourceDate = ref(null)
const dragOverTargetDate = ref(null)
const eventMoveLocked = ref(false)

function sameCalendarDay(a, b) {
  if (!a || !b) return false
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function onEventDragStart(event, sourceCellDate, dragEvent) {
  if (!props.eventDragEnabled) {
    dragEvent.preventDefault()
    return
  }
  draggingEventId.value = event.id
  draggingSourceDate.value = startOfDay(sourceCellDate)
  dragEvent.dataTransfer?.setData(CALENDAR_EVENT_DRAG_MIME, String(event.id))
  dragEvent.dataTransfer?.setData('text/plain', event.title)
  if (dragEvent.dataTransfer) {
    dragEvent.dataTransfer.effectAllowed = 'move'
  }
}

function onEventDragEnd() {
  draggingEventId.value = null
  draggingSourceDate.value = null
  dragOverTargetDate.value = null
}

function onDayDragOver(dayDate, ev) {
  if (!props.eventDragEnabled || draggingEventId.value === null) return
  ev.preventDefault()
  if (ev.dataTransfer) {
    ev.dataTransfer.dropEffect = 'move'
  }
  dragOverTargetDate.value = startOfDay(dayDate)
}

function onDayDrop(dayDate, ev) {
  ev.preventDefault()
  dragOverTargetDate.value = null
  if (!props.eventDragEnabled) return

  const idStr = ev.dataTransfer?.getData(CALENDAR_EVENT_DRAG_MIME)
  if (!idStr) return

  const moved = props.events.find(e => String(e.id) === idStr)
  if (!moved) return

  const sourceRaw = draggingSourceDate.value
  if (!sourceRaw) return

  const targetDate = startOfDay(dayDate)
  const sourceDate = startOfDay(sourceRaw)
  if (targetDate.getTime() === sourceDate.getTime()) return
  if (eventMoveLocked.value) return
  eventMoveLocked.value = true

  const sourceClone = new Date(sourceDate)
  const targetClone = new Date(targetDate)

  let settled = false
  let watchdog

  function respond(accepted) {
    if (settled) return
    settled = true
    if (watchdog !== undefined) {
      clearTimeout(watchdog)
    }
    eventMoveLocked.value = false
    if (accepted) {
      emit('event-moved', { event: moved, sourceDate: sourceClone, targetDate: targetClone })
    } else {
      emit('event-move-rejected', { event: moved, sourceDate: sourceClone, targetDate: targetClone })
    }
  }

  emit('event-move-request', {
    event: moved,
    sourceDate: sourceClone,
    targetDate: targetClone,
    respond,
  })

  const timeoutMs = props.eventMoveResponseTimeoutMs
  if (timeoutMs > 0) {
    watchdog = setTimeout(() => {
      if (!settled) {
        console.warn(
          '[Calendar] event-move-request: respond() was not called before timeout; treating as rejected.'
        )
        respond(false)
      }
    }, timeoutMs)
  }
}

// Sync grid start when controlled month/year props change (but not during scrolling)
watch([viewMonth, viewYear], () => {
  if (isScrolling.value || internalViewMode.value !== 'month') return
  const anchor = new Date(viewYear.value, viewMonth.value, 1)
  gridStartDate.value = getStartOfGrid(anchor)
})

</script>

<template>
  <div class="calendar-wrapper">
    <div v-if="showNavigation" class="calendar-header-nav">
      <h2 class="calendar-title">{{ headerTitle }}</h2>
      <div class="calendar-nav-buttons">
        <slot name="nav-buttons">
          <button @click="previousMonth" class="button neutral">‹</button>
          <button @click="goToToday" class="button neutral">Today</button>
          <button @click="nextMonth" class="button neutral">›</button>
        </slot>
      </div>
    </div>

    <div class="calendar-container">
      <div v-if="isCompactView" class="calendar-compact-view-bar">
        <button
          v-if="internalViewMode === 'day'"
          type="button"
          class="button neutral"
          @click="showWeekViewFromDay"
        >
          ‹ Week view
        </button>
        <button type="button" class="button neutral" @click="showFullMonth">
          ‹ Month view
        </button>
      </div>
      <div v-if="error" class="calendar-error">{{ error }}</div>
      <div v-if="loading" class="calendar-loading-overlay">Loading…</div>
      <div
        class="calendar-grid"
        :class="{
          'is-dragging-range': isDraggingRange,
          'is-dragging-event': draggingEventId !== null,
          'week-only': internalViewMode === 'week',
          'day-only': internalViewMode === 'day'
        }"
        @wheel.prevent="handleWheel"
      >
        <!-- Day headers -->
        <div
          v-for="day in dayNames"
          v-show="internalViewMode !== 'day'"
          :key="day"
          class="day-header"
        >
          {{ day }}
        </div>

        <!-- Calendar days -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :data-calendar-date="toDateKey(day.date)"
          @mousedown="onDayPointerDown(day.date, $event)"
          @touchstart.passive="onDayPointerDown(day.date, $event)"
          @contextmenu="onDayContextMenu(day.date, $event)"
          @mouseenter="onDayPointerEnter(day.date)"
          @dragover="onDayDragOver(day.date, $event)"
          @drop="onDayDrop(day.date, $event)"
          :class="{
            'today': day.date.toDateString() === new Date().toDateString(),
            'weekend': day.date.getDay() === 0 || day.date.getDay() === 6,
            'prev-month': day.date.getMonth() !== viewMonth && day.date.getMonth() !== (viewMonth + 1) % 12,
            'next-month': day.date.getMonth() !== viewMonth && day.date.getMonth() === (viewMonth + 1) % 12,
            'past': isPastDay(day.date),
            'range-single': rangeHighlightForDate(day.date) === 'single',
            'range-start': rangeHighlightForDate(day.date) === 'start',
            'range-end': rangeHighlightForDate(day.date) === 'end',
            'range-middle': rangeHighlightForDate(day.date) === 'middle',
            'drag-over-target': eventDragEnabled && sameCalendarDay(dragOverTargetDate, day.date)
          }"
        >
          <div class="day-content">
            <div
              class="day-number clickable"
              :class="{ 'with-month-suffix': shortMonthSuffix }"
            >
              <template v-if="shortMonthSuffix">
                {{ day.date.getDate() }}{{ getOrdinalSuffix(day.date.getDate()) }} {{ monthNames[day.date.getMonth()] }}
              </template>
              <template v-else>
                {{ day.date.getDate() }}<span class="day-month">{{ getOrdinalSuffix(day.date.getDate()) }} {{ monthNames[day.date.getMonth()].substring(0, 3) }}</span>
              </template>
            </div>
            <div class="day-events">
              <div
                v-for="event in visibleEventsForDay(day)"
                :key="event.id"
                class="calendar-event"
                :class="{
                  'multi-day': isMultiDayEvent(event),
                  'multi-day-start': isMultiDayEvent(event) && getMultiDayPosition(event, day.date) === 'start',
                  'multi-day-middle': isMultiDayEvent(event) && getMultiDayPosition(event, day.date) === 'middle',
                  'multi-day-end': isMultiDayEvent(event) && getMultiDayPosition(event, day.date) === 'end',
                  'drag-source': draggingEventId === event.id,
                  'has-custom-color': Boolean(event.color)
                }"
                :style="getEventStyle(event)"
                :draggable="eventDragEnabled"
                @dragstart.stop="onEventDragStart(event, day.date, $event)"
                @dragend.stop="onEventDragEnd"
                @click.stop="handleEventClick(event)"
                @contextmenu.stop="handleContextMenu(event, $event)"
              >
                <slot name="event" :event="event" :date="day.date" :position="getMultiDayPosition(event, day.date)">
                  <div class="event-content">
                    <div class="event-title">
                      <HugeiconsIcon
                        v-if="event.icon"
                        :icon="event.icon"
                        class="event-icon"
                        width="0.9em"
                        height="0.9em"
                      />
                      {{ event.title }}
                      <span v-if="isMultiDayEvent(event)" class="multi-day-indicator">
                        {{ getMultiDayPosition(event, day.date) === 'start' ? '▶' :
                           getMultiDayPosition(event, day.date) === 'end' ? '◀' :
                           getMultiDayPosition(event, day.date) === 'middle' ? '▬' : '' }}
                      </span>
                    </div>
                    <div class="event-time">
                      {{ formatEventTimeDefault(event, day.date) }}
                    </div>
                  </div>
                </slot>
              </div>
              <div
                v-if="internalViewMode !== 'day' && day.events.length > 3"
                class="more-events"
              >
                +{{ day.events.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="dayContextMenuOpen"
        ref="dayContextMenuRef"
        class="calendar-day-context-menu"
        role="menu"
        :style="dayContextMenuStyle"
        @click.stop
        @contextmenu.prevent
      >
        <button
          v-if="internalViewMode !== 'day'"
          type="button"
          role="menuitem"
          class="calendar-day-context-menu-item"
          @click="showOnlyThisDay"
        >
          Show only this day
        </button>
        <button
          v-if="internalViewMode !== 'week'"
          type="button"
          role="menuitem"
          class="calendar-day-context-menu-item"
          @click="showOnlyThisWeek"
        >
          Show only this week
        </button>
        <button
          v-if="internalViewMode !== 'month'"
          type="button"
          role="menuitem"
          class="calendar-day-context-menu-item"
          @click="showFullMonth"
        >
          Show full month
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.calendar-wrapper {
  width: 100%;
}

.calendar-header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--calendar-chrome-bg);
  border-radius: 8px;
}

.calendar-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.calendar-nav-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calendar-error {
  color: var(--calendar-error-fg);
  padding: 1rem;
}

.calendar-loading {
  padding: 1rem;
  text-align: center;
}

.calendar-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--calendar-loading-overlay-bg);
  z-index: 1;
  font-weight: 600;
}

.calendar-container {
  background: var(--calendar-surface-bg);
  border: 1px solid var(--calendar-border);
  overflow: hidden;
  border-radius: 8px;
  position: relative;
}

.calendar-compact-view-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--calendar-border);
  background: var(--calendar-chrome-bg);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  min-height: 400px;
}

.calendar-grid.week-only {
  min-height: min(72vh, 760px);
  grid-template-rows: auto 1fr;
}

.calendar-grid.week-only .calendar-day {
  height: auto;
  min-height: min(68vh, 720px);
}

.calendar-grid.day-only {
  grid-template-columns: minmax(0, 1fr);
  min-height: min(72vh, 760px);
}

.calendar-grid.day-only .calendar-day {
  height: auto;
  min-height: min(68vh, 720px);
  border-right: none;
}

.calendar-grid.is-dragging-range,
.calendar-grid.is-dragging-event {
  user-select: none;
}

.calendar-day.range-single {
  background-color: var(--calendar-range-bg-strong) !important;
  box-shadow: inset 0 0 0 2px var(--calendar-range-accent);
}

.calendar-day.range-start {
  background-color: var(--calendar-range-bg) !important;
  box-shadow:
    inset 2px 0 0 0 var(--calendar-range-accent),
    inset 0 2px 0 0 var(--calendar-range-accent),
    inset 0 -2px 0 0 var(--calendar-range-accent);
}

.calendar-day.range-end {
  background-color: var(--calendar-range-bg) !important;
  box-shadow:
    inset -2px 0 0 0 var(--calendar-range-accent),
    inset 0 2px 0 0 var(--calendar-range-accent),
    inset 0 -2px 0 0 var(--calendar-range-accent);
}

.calendar-day.range-middle {
  background-color: var(--calendar-range-bg) !important;
  box-shadow:
    inset 0 2px 0 0 var(--calendar-range-accent),
    inset 0 -2px 0 0 var(--calendar-range-accent);
}

.calendar-day.drag-over-target {
  background-color: var(--calendar-range-bg-subtle) !important;
  outline: 2px dashed var(--calendar-range-accent);
  outline-offset: -3px;
}

.day-header {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: var(--calendar-muted-fg);
  border-right: 1px solid var(--calendar-border);
  border-bottom: 1px solid var(--calendar-border);
  background: var(--calendar-chrome-bg);
}

.day-header:last-child {
  border-right: none;
}

.calendar-day {
  border-right: 1px solid var(--calendar-border);
  border-bottom: 1px solid var(--calendar-border);
  height: 160px;
  position: relative;
  transition: background-color 0.2s ease;
  cursor: pointer;
  overflow: hidden;
}

.calendar-day:hover {
  background-color: var(--calendar-day-hover-bg);
}

.calendar-day:hover .day-number .day-month {
  display: inline;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day.weekend {
  background: var(--calendar-day-muted-bg);
}

.calendar-day.weekend:hover {
  background: var(--calendar-day-muted-hover-bg);
}

.calendar-day.next-month,
.calendar-day.prev-month {
  background: var(--calendar-day-muted-bg);
}

.calendar-day.next-month:hover,
.calendar-day.prev-month:hover {
  background: var(--calendar-day-muted-hover-bg);
}

.calendar-day.past {
  opacity: 0.6;
}

.calendar-day.past:hover {
  opacity: 0.8;
}

.calendar-day.today {
  background: var(--calendar-today-bg);
  font-weight: bold;
}

.calendar-day.today:hover {
  background: var(--calendar-today-hover-bg);
}


.day-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.day-number {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: var(--calendar-day-fg);
  text-decoration: none;
  display: inline-block;
  padding: 0.1rem;
  border-radius: 4px;
  transition: all 0.2s;
  min-width: 1.5rem;
  text-align: center;
}

.day-number.clickable {
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.day-number.clickable .day-month {
  display: none;
  font-size: small;
}

.day-number.with-month-suffix {
  min-width: auto;
  text-align: center;
  font-size: 0.8rem;
  white-space: nowrap;
}

.day-content:hover .day-number.clickable {
  color: var(--calendar-accent-fg);
}

.day-events {
  flex: 1;
  overflow: auto;
}

.calendar-event {
  background: var(--calendar-event-bg);
  border: 1px solid var(--calendar-event-border);
  margin-bottom: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--calendar-event-shadow);
  padding: 0.1rem 0.1rem;
}

.calendar-event[draggable='true'] {
  cursor: grab;
}

.calendar-event.drag-source {
  opacity: 0.55;
}

.calendar-event[draggable='true']:active {
  cursor: grabbing;
}

.calendar-event:hover {
  background: var(--calendar-event-hover-bg);
  border-color: var(--calendar-event-border);
  transform: translateY(-1px);
  box-shadow: var(--calendar-event-hover-shadow);
}

.calendar-event.has-custom-color {
  background: var(--event-color);
  border-color: color-mix(in srgb, var(--event-color) 75%, var(--calendar-event-custom-border-mix));
}

.calendar-event.has-custom-color:hover {
  background: var(--event-color);
  border-color: color-mix(in srgb, var(--event-color) 75%, var(--calendar-event-custom-border-mix));
  filter: brightness(0.92);
}

.calendar-event.has-custom-color .event-title {
  color: var(--event-foreground-color, var(--calendar-event-title-fg));
}

.calendar-event.has-custom-color .event-time {
  color: var(--event-foreground-color, var(--calendar-muted-fg));
}

.calendar-event.has-custom-color .multi-day-indicator {
  color: var(--event-foreground-color, var(--calendar-accent-fg));
}

.event-icon {
  flex-shrink: 0;
}

.calendar-event.multi-day-start {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.calendar-event.multi-day-middle {
  border-radius: 0;
}

.calendar-event.multi-day-end {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.event-content {
  cursor: pointer;
}

.event-title {
  font-weight: bold;
  font-size: 0.85rem;
  color: var(--calendar-event-title-fg);
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.multi-day-indicator {
  font-size: 0.7rem;
  color: var(--calendar-accent-fg);
  font-weight: bold;
}

.event-time {
  font-size: 0.75rem;
  color: var(--calendar-muted-fg);
  margin-top: 0.125rem;
}

.more-events {
  font-size: 0.75rem;
  color: var(--calendar-muted-fg);
  text-align: center;
  padding: 0.25rem;
  background: var(--calendar-more-bg);
  border-radius: 4px;
  margin-top: 0.25rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .calendar-header-nav {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .calendar-title {
    font-size: 1.2rem;
  }

  .calendar-day {
    height: 110px;
  }

  .calendar-grid.week-only .calendar-day,
  .calendar-grid.day-only .calendar-day {
    height: auto;
    min-height: min(52vh, 420px);
  }

  .day-number {
    font-size: 1rem;
  }

  .event-title {
    font-size: 0.8rem;
  }

  .event-time {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .calendar-grid {
    min-height: 300px;
  }

  .day-header {
    padding: 0.5rem 0.25rem;
    font-size: 0.8rem;
  }
}

@media (min-width: 768px) {
  .day-content {
    padding: 0.45rem;
  }

  .calendar-event {
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
  }
}
</style>

<style>
.calendar-day-context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 12rem;
  padding: 0.35rem;
  border: 1px solid var(--table-popover-border);
  border-radius: 8px;
  background: var(--table-popover-bg);
  box-shadow: var(--table-popover-shadow);
}

.calendar-day-context-menu-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--table-popover-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.calendar-day-context-menu-item:hover,
.calendar-day-context-menu-item:focus-visible {
  background: var(--table-popover-item-bg);
  outline: none;
}
</style>
