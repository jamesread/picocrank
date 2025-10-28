<script setup lang="ts">
import { ref, computed } from 'vue'

export interface CalendarEvent {
  id: string | number
  title: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  date?: Date | string | null
  [key: string]: any
}

export interface CalendarProps {
  events: CalendarEvent[]
  monthNames?: string[]
  dayNames?: string[]
  loading?: boolean
  error?: string | null
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
  showNavigation: true,
})

const emit = defineEmits<{
  'event-click': [event: CalendarEvent]
  'date-click': [date: Date]
  'month-change': [month: number, year: number]
  'event-context-menu': [event: CalendarEvent, mouseEvent: MouseEvent]
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

function handleDateClick(date: Date) {
  emit('date-click', date)
}

function handleContextMenu(event: CalendarEvent, mouseEvent: MouseEvent) {
  mouseEvent.preventDefault()
  mouseEvent.stopPropagation()
  emit('event-context-menu', event, mouseEvent)
}
import { watch } from 'vue'

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
      <div class="calendar-grid" @wheel.prevent="handleWheel">
        <!-- Day headers -->
        <div v-for="day in dayNames" :key="day" class="day-header">{{ day }}</div>

        <!-- Calendar days -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{
            'today': day && day.date.toDateString() === new Date().toDateString(),
            'weekend': day && (day.date.getDay() === 0 || day.date.getDay() === 6),
            'prev-month': day && day.date.getMonth() !== currentMonth && day.date.getMonth() !== (currentMonth + 1) % 12,
            'next-month': day && day.date.getMonth() !== currentMonth && day.date.getMonth() === (currentMonth + 1) % 12,
            'past': day && isPastDay(day.date)
          }"
        >
          <div v-if="day" class="day-content" @click="handleDateClick(day.date)">
            <div class="day-number clickable">
              {{ day.date.getDate() }}
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
                  'multi-day-end': isMultiDayEvent(event) && getMultiDayPosition(event, day.date) === 'end'
                }"
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
    height: 80px;
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

  .calendar-day {
    height: 60px;
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

  .calendar-day.past {
    opacity: 0.6;
  }

  .calendar-day.past:hover {
    opacity: 0.8;
  }
}
</style>
