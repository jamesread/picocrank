<template>
	<Section
		title="Example Calendar"
		subtitle="Open with ?view=week&date=2026-09-08 or ?view=day&date=2026-09-13 to load a specific week or day."
		:icon="Calendar01Icon"
		:padding="sectionPadding"
	>
        <template #toolbar>
            <label class="calendar-example-toggle">
                <input type="checkbox" v-model="sectionPadding" />
                Section padding
            </label>
            <label class="calendar-example-toggle">
                <input type="checkbox" v-model="shortMonthSuffix" />
                Short month suffix
            </label>
            <button @click="goToToday">Today</button>
            <button @click="previousMonth">‹</button>
            <div class="date-picker-container">
                <input 
                    id="goto-date"
                    type="month" 
                    v-model="selectedDate"
                    @change="goToSelectedDate"
                    class="date-picker-input"
                />
            </div>
            <button @click="nextMonth">›</button>
        </template>
		<Calendar
			:events="events"
			:loading="loading"
			:error="error"
			:show-navigation="false"
			:short-month-suffix="shortMonthSuffix"
			:current-month="currentMonthIndex"
			:current-year="currentYear"
			v-model:view-mode="calendarViewMode"
			v-model:focus-date="calendarFocusDate"
			@event-click="handleEventClick"
			@date-click="handleDateClick"
			@date-range-select="handleDateRangeSelect"
			@event-move-request="handleEventMoveRequest"
			@event-moved="handleEventMoved"
			@event-move-rejected="handleEventMoveRejected"
			@month-change="handleMonthChange"
			@view-change="handleViewChange"
		/>
	</Section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Calendar from '../components/Calendar.vue'
import Section from '../components/Section.vue'
import {
	BeachIcon,
	Calendar01Icon,
	MeetingRoomIcon,
	PartyIcon,
	AlertCircleIcon,
} from '@hugeicons/core-free-icons'

/** Static event palette — background + accessible dark foreground for light pastels in any theme. */
const EVENT_COLORS = {
	weekend: { color: '#e8d5f5', foregroundColor: '#4a2d6b' },
	teamMeeting: { color: '#d1fae5', foregroundColor: '#14532d' },
	clientCall: { color: '#e0f2fe', foregroundColor: '#075985' },
	projectReview: { color: '#ede9fe', foregroundColor: '#5b21b6' },
	lunchBreak: { color: '#ffedd5', foregroundColor: '#9a3412' },
	codeReview: { color: '#ccfbf1', foregroundColor: '#115e59' },
	conference: { color: '#d6e8ff', foregroundColor: '#1e40af' },
	vacation: { color: '#fff0d6', foregroundColor: '#92400e' },
	holiday: { color: '#ffe0e0', foregroundColor: '#991b1b' },
	deadline: { color: '#fde8e8', foregroundColor: '#7f1d1d' },
}

const route = useRoute()
const router = useRouter()

const VALID_VIEW_MODES = new Set(['month', 'week', 'day'])

function parseRouteViewMode() {
	const view = route.query.view
	return typeof view === 'string' && VALID_VIEW_MODES.has(view) ? view : 'month'
}

function parseRouteFocusDate() {
	const date = route.query.date
	if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return null
	}

	const parsed = new Date(`${date}T00:00:00`)
	return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatFocusDateQuery(dateValue) {
	const date = new Date(dateValue)
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const events = ref([])
const loading = ref(false)
const error = ref(null)
const sectionPadding = ref(true)
const shortMonthSuffix = ref(false)
const calendarViewMode = ref(parseRouteViewMode())
const calendarFocusDate = ref(parseRouteFocusDate())
const currentMonth = ref('?')
const currentMonthIndex = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

// Cache events by month/year key (e.g., "2024-10")
const eventsCache = new Map()

// Date picker state - using native HTML5 month input
const selectedDate = ref('')

// Simple seeded random number generator for consistent event generation
function seededRandom(seed) {
	let value = seed
	return function() {
		value = (value * 9301 + 49297) % 233280
		return value / 233280
	}
}

// Generate dummy events for a specific month
function generateDummyEventsForMonth(monthIndex, year) {
	// Get the number of days in the month
	const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
	
	const dummyEvents = []
	
	// Create a seeded random generator for consistent events per month
	const random = seededRandom(year * 12 + monthIndex)
	
	// Add some recurring events
	for (let day = 1; day <= daysInMonth; day++) {
		const date = new Date(year, monthIndex, day)
		const dayOfWeek = date.getDay()
		
		// Add weekend events (Saturday and Sunday)
		if (dayOfWeek === 0 || dayOfWeek === 6) {
			dummyEvents.push({
				id: `weekend-${year}-${monthIndex}-${day}`,
				title: 'Weekend Activity',
				date: new Date(year, monthIndex, day, 10, 0),
				description: 'Relaxing weekend activity',
				icon: PartyIcon,
				...EVENT_COLORS.weekend,
			})
		}
		
		// Add some random events
		if (random() > 0.7) {
			const eventTypes = [
				{ title: 'Team Meeting', time: [9, 0], duration: 1, ...EVENT_COLORS.teamMeeting },
				{ title: 'Client Call', time: [14, 30], duration: 0.5, ...EVENT_COLORS.clientCall },
				{ title: 'Project Review', time: [16, 0], duration: 2, ...EVENT_COLORS.projectReview },
				{ title: 'Lunch Break', time: [12, 0], duration: 1, ...EVENT_COLORS.lunchBreak },
				{ title: 'Code Review', time: [10, 0], duration: 1.5, ...EVENT_COLORS.codeReview },
			]
			
			const eventType = eventTypes[Math.floor(random() * eventTypes.length)]
			const { title, time, color, foregroundColor } = eventType
			const [hours, minutes] = time
			
			dummyEvents.push({
				id: `event-${year}-${monthIndex}-${day}-${Math.random().toString(36).substr(2, 9)}`,
				title,
				date: new Date(year, monthIndex, day, hours, minutes),
				description: `Scheduled ${title.toLowerCase()}`,
				icon: title === 'Team Meeting' ? MeetingRoomIcon : undefined,
				color,
				foregroundColor,
			})
		}
	}
	
	// Add some multi-day events
	dummyEvents.push({
		id: `conference-${year}-${monthIndex}`,
		title: 'Tech Conference',
		startDate: new Date(year, monthIndex, 5, 9, 0),
		endDate: new Date(year, monthIndex, 7, 17, 0),
		description: 'Annual technology conference',
		icon: Calendar01Icon,
		...EVENT_COLORS.conference,
	})
	
	dummyEvents.push({
		id: `vacation-${year}-${monthIndex}`,
		title: 'Vacation',
		startDate: new Date(year, monthIndex, 15, 0, 0),
		endDate: new Date(year, monthIndex, 18, 23, 59),
		description: 'Family vacation time',
		icon: BeachIcon,
		...EVENT_COLORS.vacation,
	})
	
	// Add some all-day events
	dummyEvents.push({
		id: `holiday-${year}-${monthIndex}`,
		title: 'Public Holiday',
		date: new Date(year, monthIndex, 1, 0, 0),
		description: 'National holiday - office closed',
		icon: PartyIcon,
		...EVENT_COLORS.holiday,
	})
	
	if (daysInMonth >= 25) {
		dummyEvents.push({
			id: `deadline-${year}-${monthIndex}`,
			title: 'Project Deadline',
			date: new Date(year, monthIndex, 25, 0, 0),
			description: 'Important project deadline',
			icon: AlertCircleIcon,
			...EVENT_COLORS.deadline,
		})
	}
	
	return dummyEvents
}

// Get or generate events for a specific month/year
function getEventsForMonth(monthIndex, year) {
	const cacheKey = `${year}-${monthIndex}`
	
	// Return cached events if available
	if (eventsCache.has(cacheKey)) {
		return eventsCache.get(cacheKey)
	}
	
	// Generate new events for this month
	const dummyEvents = generateDummyEventsForMonth(monthIndex, year)
	
	// Cache the events
	eventsCache.set(cacheKey, dummyEvents)
	
	return dummyEvents
}

// Merge events for previous, current, and next months so overflow days show events
function getEventsForSurroundingMonths(monthIndex, year) {
	const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1
	const prevYear = monthIndex === 0 ? year - 1 : year
	const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1
	const nextYear = monthIndex === 11 ? year + 1 : year

	return [
		...getEventsForMonth(prevMonthIndex, prevYear),
		...getEventsForMonth(monthIndex, year),
		...getEventsForMonth(nextMonthIndex, nextYear)
	]
}

function handleEventClick(event) {
    console.log('Event clicked:', event)
    alert(`Event: ${event.title}\nDescription: ${event.description || 'No description'}`)
}

function handleDateClick(date) {
	// Single-day picks also emit `date-range-select`; keep this for integrations that only listen for `date-click`.
	console.log('Date clicked:', date)
}

function handleDateRangeSelect(start, end) {
	const same = start.getTime() === end.getTime()
	const label = same
		? start.toLocaleDateString()
		: `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`
	console.log('Date range:', start, end)
	alert(`Range selected: ${label}`)
}

function handleEventMoveRequest({ respond, event, sourceDate, targetDate }) {
	window.setTimeout(() => {
		const ok = window.confirm(
			`Move "${event.title}" from ${sourceDate.toLocaleDateString()} to ${targetDate.toLocaleDateString()}? (Cancel = decline)`
		)
		respond(ok)
	}, 50)
}

function applyEventDateShift(event, deltaMs) {
	const i = events.value.findIndex(e => String(e.id) === String(event.id))
	if (i === -1) return
	const ev = events.value[i]
	const next = { ...ev }
	if (next.startDate != null && next.endDate != null) {
		next.startDate = new Date(new Date(next.startDate).getTime() + deltaMs)
		next.endDate = new Date(new Date(next.endDate).getTime() + deltaMs)
	} else if (next.date != null) {
		next.date = new Date(new Date(next.date).getTime() + deltaMs)
	}
	const copy = [...events.value]
	copy[i] = next
	events.value = copy
}

function handleEventMoved({ event, sourceDate, targetDate }) {
	const deltaMs = targetDate.getTime() - sourceDate.getTime()
	applyEventDateShift(event, deltaMs)
}

function handleEventMoveRejected(payload) {
	console.log('event-move-rejected', payload)
}

// Helper function to update the date picker value
function updateDatePicker(monthIndex, year) {
	const month = String(monthIndex + 1).padStart(2, '0')
	selectedDate.value = `${year}-${month}`
}

// Navigation functions - using the same fast path as internal calendar navigation
function previousMonth() {
	const newMonth = currentMonthIndex.value === 0 ? 11 : currentMonthIndex.value - 1
	const newYear = currentMonthIndex.value === 0 ? currentYear.value - 1 : currentYear.value
	
	// Update state directly (fast path)
	currentMonthIndex.value = newMonth
	currentYear.value = newYear
	
	// Update title
	const date = new Date(newYear, newMonth, 1)
	currentMonth.value = date.toLocaleDateString('en-US', { 
		month: 'long', 
		year: 'numeric' 
	})
	
	// Update date picker
	updateDatePicker(newMonth, newYear)

	// Update events for surrounding months
	events.value = getEventsForSurroundingMonths(newMonth, newYear)
}

function nextMonth() {
	const newMonth = currentMonthIndex.value === 11 ? 0 : currentMonthIndex.value + 1
	const newYear = currentMonthIndex.value === 11 ? currentYear.value + 1 : currentYear.value
	
	// Update state directly (fast path)
	currentMonthIndex.value = newMonth
	currentYear.value = newYear
	
	// Update title
	const date = new Date(newYear, newMonth, 1)
	currentMonth.value = date.toLocaleDateString('en-US', { 
		month: 'long', 
		year: 'numeric' 
	})
	
	// Update date picker
	updateDatePicker(newMonth, newYear)

	// Update events for surrounding months
	events.value = getEventsForSurroundingMonths(newMonth, newYear)
}

function goToToday() {
	const now = new Date()
	const newMonth = now.getMonth()
	const newYear = now.getFullYear()
	
	// Update state directly (fast path)
	currentMonthIndex.value = newMonth
	currentYear.value = newYear
	
	// Update title
	currentMonth.value = now.toLocaleDateString('en-US', { 
		month: 'long', 
		year: 'numeric' 
	})
	
	// Update date picker
	updateDatePicker(newMonth, newYear)

	// Update events for surrounding months
	events.value = getEventsForSurroundingMonths(newMonth, newYear)
}

function goToSelectedDate() {
	if (!selectedDate.value) return
	
	// Parse the YYYY-MM format from the native date picker
	const [year, month] = selectedDate.value.split('-').map(Number)
	const monthIndex = month - 1 // Convert to 0-based month index
	
	// Update state directly (fast path)
	currentMonthIndex.value = monthIndex
	currentYear.value = year
	
	// Update title
	const date = new Date(year, monthIndex, 1)
	currentMonth.value = date.toLocaleDateString('en-US', { 
		month: 'long', 
		year: 'numeric' 
	})

	// Update events for surrounding months
	events.value = getEventsForSurroundingMonths(monthIndex, year)
}

function handleViewChange({ mode, focusDate }) {
	const query = { ...route.query }

	if (mode === 'month') {
		delete query.view
		delete query.date
	} else {
		query.view = mode
		if (focusDate) {
			query.date = formatFocusDateQuery(focusDate)
		}
	}

	router.replace({ query })
}

function handleMonthChange(month, year) {
	console.log('Month changed:', month, year)
	// In a real app, you might fetch events for the new month
	loading.value = true
	
	// Update current month and year state
	currentMonthIndex.value = month
	currentYear.value = year
	
	// Use native JavaScript to format month and year
	const date = new Date(year, month, 1)
	currentMonth.value = date.toLocaleDateString('en-US', { 
		month: 'long', 
		year: 'numeric' 
	})
	
	// Update date picker to reflect the new month
	updateDatePicker(month, year)
	
	setTimeout(() => {
		// Load events for surrounding months (will use cache if available)
		events.value = getEventsForSurroundingMonths(month, year)
		loading.value = false
	}, 500)
}

onMounted(() => {
	const initialAnchor = calendarFocusDate.value ?? new Date()
	const initMonth = initialAnchor.getMonth()
	const initYear = initialAnchor.getFullYear()

	events.value = getEventsForSurroundingMonths(initMonth, initYear)
	currentMonthIndex.value = initMonth
	currentYear.value = initYear
	currentMonth.value = initialAnchor.toLocaleDateString('en-US', {
		month: 'long',
		year: 'numeric',
	})

	updateDatePicker(initMonth, initYear)
})
</script>

<style scoped>
.calendar-example-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  cursor: pointer;
  user-select: none;
}

.date-picker-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-picker-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.date-picker-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.date-picker-input:hover {
  border-color: #9ca3af;
}

.date-picker-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Dark theme support */
html[data-theme="dark"] {
  .date-picker-label {
    color: #d1d5db;
  }
  
  .date-picker-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .date-picker-input:hover {
    border-color: #6b7280;
  }
  
  .date-picker-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
}
</style>
