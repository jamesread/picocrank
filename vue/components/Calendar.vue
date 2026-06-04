<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

export interface CalendarEvent {
  id: string | number
  title: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  date?: Date | string | null
  [key: string]: any
}

/** Payload for `event-move-request`: call `respond(true)` after a successful commit, or `respond(false)` to decline (e.g. failed server update). */
export interface CalendarEventMoveRequest {
  event: CalendarEvent
  /** Calendar cell where the drag started (for multi-day events, the visible segment day). */
  sourceDate: Date
  /** Calendar cell where the event was dropped. */
  targetDate: Date
  /** Invoke exactly once with the outcome. If omitted until timeout, the move is treated as rejected. */
  respond: (accepted: boolean) => void
}

export interface CalendarProps {
  events: CalendarEvent[]
  monthNames?: string[]
  dayNames?: string[]
  loading?: boolean
  error?: string | null
  /** When true, events can be dragged to another day. */
  eventDragEnabled?: boolean
  /**
   * Max time (ms) to wait for `respond()` on `event-move-request`.
   * If `respond` is not called in time, the move is rejected and a warning is logged.
   * Set to `0` to disable the timeout (not recommended if listeners may omit `respond`).
   */
  eventMoveResponseTimeoutMs?: number
  // Formatter functions
  getEventDate?: (event: CalendarEvent) => Date | null
  getEventDateRange?: (event: CalendarEvent) => { start: Date | null; end: Date | null }
  formatEventTime?: (event: CalendarEvent, date: Date) => string
  // Customization
  showNavigation?: boolean
  currentMonth?: number
  currentYear?: number
}

const props = withDefaults(defineProps<CalendarProps>(), {
  section: false,
  monthNames: () => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  dayNames: () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  loading: false,
  error: null,
  eventDragEnabled: true,
  eventMoveResponseTimeoutMs: 15000,
  showNavigation: true,
})

const emit = defineEmits<{
  'event-click': [event: CalendarEvent]
  'date-click': [date: Date]
  'date-range-select': [start: Date, end: Date]
  'month-change': [month: number, year: number]
  'event-context-menu': [event: CalendarEvent, mouseEvent: MouseEvent]
  'event-move-request': [payload: CalendarEventMoveRequest]
  'event-moved': [payload: { event: CalendarEvent; sourceDate: Date; targetDate: Date }]
  'event-move-rejected': [payload: { event: CalendarEvent; sourceDate: Date; targetDate: Date }]
}>()

// Internal calendar state
const internalCurrentDate = ref(new Date())
const currentDate = computed(() => {
  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    return new Date(props.currentYear, props.currentMonth, 1)
  }
  return internalCurrentDate.value
})

const currentMonth = computed(() => currentDate.value.getMonth())
const currentYear = computed(() => currentDate.value.getFullYear())

// Compute the first visible day (Monday) for the current month view
function getStartOfGrid(date: Date): Date {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayOfWeek = (firstOfMonth.getDay() + 6) % 7 // Monday=0
  const start = new Date(firstOfMonth)
  start.setDate(firstOfMonth.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)
  return start
}

// Anchor date for the 6x7 grid; we will shift this by weeks without re-rendering the grid structure
const gridStartDate = ref<Date>(getStartOfGrid(currentDate.value))
// Track if we're actively scrolling to prevent watcher from resetting grid anchor
const isScrolling = ref(false)

// Helper function to check if a time is midnight (00:00)
function isMidnight(dateValue: any): boolean {
  if (!dateValue) return false
  const date = new Date(dateValue)
  return date.getHours() === 0 && date.getMinutes() === 0
}

// Helper function to format time, returning "No time" if midnight
function formatTimeOrNoTime(dateValue: any): string {
  if (!dateValue) return 'No time'
  if (isMidnight(dateValue)) return 'No time'
  const date = new Date(dateValue)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Determine if a date is in the past (before today)
function isPastDay(date: Date): boolean {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return day.getTime() < today.getTime()
}

// Get event date range
function getEventDateRange(event: CalendarEvent): { start: Date | null; end: Date | null } {
  if (props.getEventDateRange) {
    return props.getEventDateRange(event)
  }
  
  // Default implementation
  let start: Date | null = null
  let end: Date | null = null
  
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
function getEventsForDate(date: Date): CalendarEvent[] {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  return props.events.filter(event => {
    const { start, end } = getEventDateRange(event)
    
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
function isMultiDayEvent(event: CalendarEvent): boolean {
  const { start, end } = getEventDateRange(event)
  
  if (!start || !end) return false

  const startDate = new Date(start)
  const endDate = new Date(end)

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)

  return startDate.getTime() !== endDate.getTime()
}

// Get the position of an event within a multi-day range for a specific date
function getMultiDayPosition(event: CalendarEvent, date: Date): 'start' | 'middle' | 'end' | 'single' {
  const { start, end } = getEventDateRange(event)
  
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
function formatEventTimeDefault(event: CalendarEvent, date: Date): string {
  if (props.formatEventTime) {
    return props.formatEventTime(event, date)
  }
  
  const { start, end } = getEventDateRange(event)
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

// Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
function getOrdinalSuffix(day: number): string {
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

// Calendar generation from persistent grid start
const calendarDays = computed(() => {
  const days = [] as { date: Date; events: CalendarEvent[] }[]
  const start = gridStartDate.value
  for (let i = 0; i < 42; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date,
      events: getEventsForDate(date)
    })
  }
  return days
})

// Navigation functions
function previousMonth() {
  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    const newMonth = currentMonth.value === 0 ? 11 : currentMonth.value - 1
    const newYear = currentMonth.value === 0 ? currentYear.value - 1 : currentYear.value
    emit('month-change', newMonth, newYear)
    // Optimistically update grid anchor for smooth transition
    gridStartDate.value = getStartOfGrid(new Date(newYear, newMonth, 1))
  } else {
    internalCurrentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
    gridStartDate.value = getStartOfGrid(internalCurrentDate.value)
  }
}

function nextMonth() {
  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    const newMonth = currentMonth.value === 11 ? 0 : currentMonth.value + 1
    const newYear = currentMonth.value === 11 ? currentYear.value + 1 : currentYear.value
    emit('month-change', newMonth, newYear)
    gridStartDate.value = getStartOfGrid(new Date(newYear, newMonth, 1))
  } else {
    internalCurrentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
    gridStartDate.value = getStartOfGrid(internalCurrentDate.value)
  }
}

function goToToday() {
  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    const today = new Date()
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
function getVisibleMonthYear(start: Date): { month: number; year: number } {
  const mid = new Date(start)
  mid.setDate(start.getDate() + 21) // middle of 6x7 grid
  return { month: mid.getMonth(), year: mid.getFullYear() }
}

function adjustByWeeks(weeks: number): void {
  const newStart = new Date(gridStartDate.value)
  newStart.setDate(newStart.getDate() + weeks * 7)
  gridStartDate.value = newStart

  if (props.currentMonth !== undefined && props.currentYear !== undefined) {
    const { month, year } = getVisibleMonthYear(newStart)
    if (month !== currentMonth.value || year !== currentYear.value) {
      emit('month-change', month, year)
      // Set flag to prevent watcher from resetting our scroll position
      isScrolling.value = true
      // Clear the flag after a short delay to allow future prop-driven updates
      setTimeout(() => { isScrolling.value = false }, 100)
    }
  } else {
    // Keep internal anchor and current date roughly aligned (set to first of visible month)
    const { month, year } = getVisibleMonthYear(newStart)
    internalCurrentDate.value = new Date(year, month, 1)
  }
}

function handleWheel(event: WheelEvent): void {
  // Prevent page scrolling while using calendar scroll
  event.preventDefault()
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  if (now - lastWheelAt.value < wheelThrottleMs) return
  lastWheelAt.value = now
  const direction = event.deltaY > 0 ? 1 : -1
  adjustByWeeks(direction)
}

// Event handlers
function handleEventClick(event: CalendarEvent) {
  emit('event-click', event)
}

function handleContextMenu(event: CalendarEvent, mouseEvent: MouseEvent) {
  mouseEvent.preventDefault()
  mouseEvent.stopPropagation()
  emit('event-context-menu', event, mouseEvent)
}

// --- Date range selection (click / drag) ---

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateFromKey(key: string): Date {
  const [y, m, day] = key.split('-').map(Number)
  return startOfDay(new Date(y, m - 1, day))
}

const isDraggingRange = ref(false)
const rangeDragAnchor = ref<Date | null>(null)
const rangeDragEnd = ref<Date | null>(null)
const selectedRangeStart = ref<Date | null>(null)
const selectedRangeEnd = ref<Date | null>(null)

function isEventTarget(ev: Event): boolean {
  const t = ev.target
  if (!(t instanceof Node)) return false
  return Boolean((t as HTMLElement).closest?.('.calendar-event'))
}

function getRangeBounds(): { lo: Date; hi: Date } | null {
  const a = rangeDragAnchor.value
  const b = rangeDragEnd.value
  if (!a || !b) return null
  const sa = startOfDay(a).getTime()
  const sb = startOfDay(b).getTime()
  if (sa <= sb) return { lo: startOfDay(a), hi: startOfDay(b) }
  return { lo: startOfDay(b), hi: startOfDay(a) }
}

function rangeHighlightForDate(date: Date): 'none' | 'single' | 'start' | 'end' | 'middle' {
  const bounds = isDraggingRange.value
    ? getRangeBounds()
    : selectedRangeStart.value && selectedRangeEnd.value
      ? (() => {
          const sa = startOfDay(selectedRangeStart.value!).getTime()
          const sb = startOfDay(selectedRangeEnd.value!).getTime()
          const lo = sa <= sb ? startOfDay(selectedRangeStart.value!) : startOfDay(selectedRangeEnd.value!)
          const hi = sa <= sb ? startOfDay(selectedRangeEnd.value!) : startOfDay(selectedRangeStart.value!)
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

function onWindowTouchMove(ev: TouchEvent): void {
  if (!isDraggingRange.value || ev.touches.length === 0) return
  const { clientX, clientY } = ev.touches[0]
  const el = document.elementFromPoint(clientX, clientY)
  if (!el) return
  const cell = (el as HTMLElement).closest?.('[data-calendar-date]')
  const key = cell?.dataset?.calendarDate
  if (!key) return
  rangeDragEnd.value = dateFromKey(key)
}

function detachRangePointerListeners(): void {
  window.removeEventListener('mouseup', endRangeSelectionFromPointer)
  window.removeEventListener('blur', endRangeSelectionFromPointer)
  window.removeEventListener('touchmove', onWindowTouchMove)
  window.removeEventListener('touchend', endRangeSelectionFromPointer)
  window.removeEventListener('touchcancel', endRangeSelectionFromPointer)
}

function endRangeSelectionFromPointer(): void {
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

function onDayPointerDown(date: Date, ev: MouseEvent | TouchEvent): void {
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

function onDayPointerEnter(date: Date): void {
  if (!isDraggingRange.value) return
  rangeDragEnd.value = startOfDay(date)
}

onUnmounted(() => {
  detachRangePointerListeners()
})

// --- Calendar event drag and drop (HTML5) ---

const CALENDAR_EVENT_DRAG_MIME = 'application/x-picocrank-calendar-event-id'

const draggingEventId = ref<string | number | null>(null)
const draggingSourceDate = ref<Date | null>(null)
const dragOverTargetDate = ref<Date | null>(null)
const eventMoveLocked = ref(false)

function sameCalendarDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function onEventDragStart(event: CalendarEvent, sourceCellDate: Date, dragEvent: DragEvent): void {
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

function onEventDragEnd(): void {
  draggingEventId.value = null
  draggingSourceDate.value = null
  dragOverTargetDate.value = null
}

function onDayDragOver(dayDate: Date, ev: DragEvent): void {
  if (!props.eventDragEnabled || draggingEventId.value === null) return
  ev.preventDefault()
  if (ev.dataTransfer) {
    ev.dataTransfer.dropEffect = 'move'
  }
  dragOverTargetDate.value = startOfDay(dayDate)
}

function onDayDrop(dayDate: Date, ev: DragEvent): void {
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
  let watchdog: ReturnType<typeof setTimeout> | undefined

  function respond(accepted: boolean): void {
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
watch([currentMonth, currentYear], () => {
  if (isScrolling.value) return
  const anchor = new Date(currentYear.value, currentMonth.value, 1)
  gridStartDate.value = getStartOfGrid(anchor)
})

</script>

<template>
  <div class="calendar-wrapper">
    <div v-if="showNavigation" class="calendar-header-nav">
      <h2 class="calendar-title">{{ monthNames[currentMonth] }} {{ currentYear }}</h2>
      <div class="calendar-nav-buttons">
        <slot name="nav-buttons">
          <button @click="previousMonth" class="button neutral">‹</button>
          <button @click="goToToday" class="button neutral">Today</button>
          <button @click="nextMonth" class="button neutral">›</button>
        </slot>
      </div>
    </div>

    <div class="calendar-container">
      <div v-if="error" class="calendar-error">{{ error }}</div>
      <div v-if="loading" class="calendar-loading-overlay">Loading…</div>
      <div
        class="calendar-grid"
        :class="{
          'is-dragging-range': isDraggingRange,
          'is-dragging-event': draggingEventId !== null
        }"
        @wheel.prevent="handleWheel"
      >
        <!-- Day headers -->
        <div v-for="day in dayNames" :key="day" class="day-header">{{ day }}</div>

        <!-- Calendar days -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :data-calendar-date="toDateKey(day.date)"
          @mousedown="onDayPointerDown(day.date, $event)"
          @touchstart.passive="onDayPointerDown(day.date, $event)"
          @mouseenter="onDayPointerEnter(day.date)"
          @dragover="onDayDragOver(day.date, $event)"
          @drop="onDayDrop(day.date, $event)"
          :class="{
            'today': day.date.toDateString() === new Date().toDateString(),
            'weekend': day.date.getDay() === 0 || day.date.getDay() === 6,
            'prev-month': day.date.getMonth() !== currentMonth && day.date.getMonth() !== (currentMonth + 1) % 12,
            'next-month': day.date.getMonth() !== currentMonth && day.date.getMonth() === (currentMonth + 1) % 12,
            'past': isPastDay(day.date),
            'range-single': rangeHighlightForDate(day.date) === 'single',
            'range-start': rangeHighlightForDate(day.date) === 'start',
            'range-end': rangeHighlightForDate(day.date) === 'end',
            'range-middle': rangeHighlightForDate(day.date) === 'middle',
            'drag-over-target': eventDragEnabled && sameCalendarDay(dragOverTargetDate, day.date)
          }"
        >
          <div class="day-content">
            <div class="day-number clickable">
              {{ day.date.getDate() }}<span class="day-month">{{ getOrdinalSuffix(day.date.getDate()) }} {{ monthNames[day.date.getMonth()].substring(0, 3) }}</span>
            </div>
            <div class="day-events">
              <div
                v-for="event in day.events.sort((a, b) => {
                  const aMultiDay = isMultiDayEvent(a);
                  const bMultiDay = isMultiDayEvent(b);
                  if (aMultiDay && !bMultiDay) return -1;
                  if (!aMultiDay && bMultiDay) return 1;
                  return 0;
                }).slice(0, 3)"
                :key="event.id"
                class="calendar-event"
                :class="{
                  'multi-day': isMultiDayEvent(event),
                  'multi-day-start': isMultiDayEvent(event) && getMultiDayPosition(event, day.date) === 'start',
                  'multi-day-middle': isMultiDayEvent(event) && getMultiDayPosition(event, day.date) === 'middle',
                  'multi-day-end': isMultiDayEvent(event) && getMultiDayPosition(event, day.date) === 'end',
                  'drag-source': draggingEventId === event.id
                }"
                :draggable="eventDragEnabled"
                @dragstart.stop="onEventDragStart(event, day.date, $event)"
                @dragend.stop="onEventDragEnd"
                @click.stop="handleEventClick(event)"
                @contextmenu.stop="handleContextMenu(event, $event)"
              >
                <slot name="event" :event="event" :date="day.date" :position="getMultiDayPosition(event, day.date)">
                  <div class="event-content">
                    <div class="event-title">
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
              <div v-if="day.events.length > 3" class="more-events">
                +{{ day.events.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  background: #f8f9fa;
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
  color: #b00020;
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
  background: rgba(255, 255, 255, 0.6);
  z-index: 1;
  font-weight: 600;
}

.calendar-container {
  background: white;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  border-radius: 8px;
  position: relative;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  min-height: 400px;
}

.calendar-grid.is-dragging-range,
.calendar-grid.is-dragging-event {
  user-select: none;
}

.calendar-day.range-single {
  background-color: rgba(0, 123, 255, 0.22) !important;
  box-shadow: inset 0 0 0 2px #007bff;
}

.calendar-day.range-start {
  background-color: rgba(0, 123, 255, 0.14) !important;
  box-shadow:
    inset 2px 0 0 0 #007bff,
    inset 0 2px 0 0 #007bff,
    inset 0 -2px 0 0 #007bff;
}

.calendar-day.range-end {
  background-color: rgba(0, 123, 255, 0.14) !important;
  box-shadow:
    inset -2px 0 0 0 #007bff,
    inset 0 2px 0 0 #007bff,
    inset 0 -2px 0 0 #007bff;
}

.calendar-day.range-middle {
  background-color: rgba(0, 123, 255, 0.14) !important;
  box-shadow:
    inset 0 2px 0 0 #007bff,
    inset 0 -2px 0 0 #007bff;
}

.calendar-day.drag-over-target {
  background-color: rgba(0, 123, 255, 0.1) !important;
  outline: 2px dashed #007bff;
  outline-offset: -3px;
}

.day-header {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #666;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.day-header:last-child {
  border-right: none;
}

.calendar-day {
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  height: 160px;
  position: relative;
  transition: background-color 0.2s ease;
  cursor: pointer;
  overflow: hidden;
}

.calendar-day:hover {
  background-color: #f0f8ff;
}

.calendar-day:hover .day-number .day-month {
  display: inline;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day.weekend {
  background: #f8f9fa;
}

.calendar-day.weekend:hover {
  background: #e9ecef;
}

.calendar-day.next-month,
.calendar-day.prev-month {
  background: #f8f9fa;
}

.calendar-day.next-month:hover,
.calendar-day.prev-month:hover {
  background: #e9ecef;
}

.calendar-day.past {
  opacity: 0.6;
}

.calendar-day.past:hover {
  opacity: 0.8;
}

.calendar-day.today {
  background: #f7f8d7;
  font-weight: bold;
}

.calendar-day.today:hover {
  background: #bbdefb;
}


.day-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.day-number {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #333;
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

.day-content:hover .day-number.clickable {
  color: #007bff;
}

.day-events {
  flex: 1;
  overflow: auto;
}

.calendar-event {
  background: #d6f1aa;
  border: 1px solid #c4db96;
  margin-bottom: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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
  background: #b3de6e;
  border-color: #c4db96;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
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
  color: #333;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.multi-day-indicator {
  font-size: 0.7rem;
  color: #007bff;
  font-weight: bold;
}

.event-time {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.125rem;
}

.more-events {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  padding: 0.25rem;
  background: #f8f9fa;
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

@media (prefers-color-scheme: dark) {
  .calendar-container {
    background: #565656;
    border-color: #374151;
    border: 1px solid #565656;
  }

  .calendar-day.today {
    background: #646c70;
  }

  .calendar-day.weekend {
    background: #444;
  }

  .calendar-day.weekend:hover {
    background: #1a1a1a;
  }

  .calendar-day.next-month,
  .calendar-day.prev-month {
    background: #1a1a1a !important;
  }
  
  .calendar-day.next-month:hover,
  .calendar-day.prev-month:hover {
    background: #374151;
  }

  .calendar-day.today:hover {
    background: #374151;
  }

  .calendar-day {
    border: 1px solid #3b3b3b;
  }

  .day-number {
    color: #f9fafb;
  }

  .day-header {
    color: #f9fafb;
    background: #444 !important;
    border: 1px solid #374151;
    border-color: #374151;
  }

  .day-content:hover .day-number.clickable {
    color: #f9fafb;
  }

  .calendar-day:hover {
    background-color: #374151;
  }

  .calendar-day.today:hover {
    background: #374151;
  }

  .calendar-day.weekend:hover {
    background: #374151;
  }

  .calendar-day.range-single {
    background-color: rgba(96, 165, 250, 0.28) !important;
    box-shadow: inset 0 0 0 2px #60a5fa;
  }

  .calendar-day.range-start {
    background-color: rgba(96, 165, 250, 0.18) !important;
    box-shadow:
      inset 2px 0 0 0 #60a5fa,
      inset 0 2px 0 0 #60a5fa,
      inset 0 -2px 0 0 #60a5fa;
  }

  .calendar-day.range-end {
    background-color: rgba(96, 165, 250, 0.18) !important;
    box-shadow:
      inset -2px 0 0 0 #60a5fa,
      inset 0 2px 0 0 #60a5fa,
      inset 0 -2px 0 0 #60a5fa;
  }

  .calendar-day.range-middle {
    background-color: rgba(96, 165, 250, 0.18) !important;
    box-shadow:
      inset 0 2px 0 0 #60a5fa,
      inset 0 -2px 0 0 #60a5fa;
  }

  .calendar-day.drag-over-target {
    background-color: rgba(96, 165, 250, 0.12) !important;
    outline: 2px dashed #60a5fa;
    outline-offset: -3px;
  }

  .calendar-day.past {
    opacity: 0.6;
  }

  .calendar-day.past:hover {
    opacity: 0.8;
  }
}
</style>
