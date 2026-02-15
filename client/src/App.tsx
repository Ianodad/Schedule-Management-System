import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  AlignLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Moon,
  Plus,
  Search,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { useAppointments } from './hooks/useAppointments'
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates'
import type { Appointment, ConflictInfo } from './types/appointment'
import type { AppointmentEvent } from './api/grpc/types'
import type { AppointmentFormState } from './components/Scheduler/formTypes'
import {
  createFormStateFromAppointment,
  createInitialFormState,
  getFormDateRange,
  recurrenceFromForm,
  toDate,
} from './components/Scheduler/schedulerUtils'
import './App.css'

type ViewMode = 'day' | 'month'

type EventColorClass =
  | 'event-blue'
  | 'event-indigo'
  | 'event-emerald'
  | 'event-amber'
  | 'event-rose'
  | 'event-violet'

const EVENT_COLOR_CLASSES: EventColorClass[] = [
  'event-blue',
  'event-indigo',
  'event-emerald',
  'event-amber',
  'event-rose',
  'event-violet',
]

function getEventColorClass(id: string): EventColorClass {
  const hash = id
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0)
  return EVENT_COLOR_CLASSES[Math.abs(hash) % EVENT_COLOR_CLASSES.length]
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDateInput(value: Date): string {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatTimeInput(value: Date): string {
  const h = String(value.getHours()).padStart(2, '0')
  const m = String(value.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function toDayKey(value: Date): string {
  return formatDateInput(value)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = getDaysInMonth(year, month)
  const days: Date[] = []

  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i -= 1) {
    days.push(new Date(year, month - 1, prevMonthDays - i))
  }

  for (let i = 1; i <= daysInMonth; i += 1) {
    days.push(new Date(year, month, i))
  }

  const remainingCells = 42 - days.length
  for (let i = 1; i <= remainingCells; i += 1) {
    days.push(new Date(year, month + 1, i))
  }

  return days
}

function buildFormStateFromDate(initialDate: Date, initialTitle = ''): AppointmentFormState {
  const end = new Date(initialDate)
  end.setHours(end.getHours() + 1)

  const initial = createInitialFormState(initialDate)
  return {
    ...initial,
    title: initialTitle,
    date: formatDateInput(initialDate),
    startTime: formatTimeInput(initialDate),
    endTime: formatTimeInput(end),
  }
}

interface ConflictFeedbackProps {
  conflicts: ConflictInfo | null
}

function ConflictFeedback({ conflicts }: ConflictFeedbackProps) {
  if (!conflicts) {
    return null
  }

  return (
    <div className="conflict-feedback">
      <div className="conflict-feedback-header">
        <AlertTriangle size={16} />
        <p>{conflicts.message}</p>
      </div>
      {conflicts.conflictingAppointments?.length ? (
        <ul className="conflict-feedback-list">
          {conflicts.conflictingAppointments.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>
                {formatTime(toDate(item.startTime))} - {formatTime(toDate(item.endTime))}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

interface QuickAddPopoverProps {
  isOpen: boolean
  position: { top: number; left: number } | null
  initialDate: Date
  onClose: () => void
  onSave: (title: string, date: Date) => Promise<void>
  onMoreOptions: (title: string, date: Date) => void
}

function QuickAddPopover({
  isOpen,
  position,
  initialDate,
  onClose,
  onSave,
  onMoreOptions,
}: QuickAddPopoverProps) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    setTitle('')
    const timer = window.setTimeout(() => {
      popoverRef.current?.querySelector('input')?.focus()
    }, 50)

    return () => window.clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', onMouseDown)
    }

    return () => {
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !position) {
    return null
  }

  const end = new Date(initialDate)
  end.setHours(end.getHours() + 1)

  const safeTop = Math.min(position.top, window.innerHeight - 280)
  const safeLeft = Math.min(position.left, window.innerWidth - 340)

  const submitQuick = async () => {
    setSaving(true)
    try {
      await onSave(title || '(No Title)', initialDate)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={popoverRef}
      className="quick-add-popover"
      style={{ top: `${safeTop}px`, left: `${safeLeft}px` }}
    >
      <div className="quick-add-header">
        <h3>Quick Add</h3>
        <button type="button" onClick={onClose} aria-label="Close quick add">
          <X size={16} />
        </button>
      </div>

      <div className="quick-add-body">
        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void submitQuick()
            }
            if (event.key === 'Escape') {
              onClose()
            }
          }}
        />

        <p className="quick-add-time">
          <Clock size={14} />
          <span>
            {formatTime(initialDate)} - {formatTime(end)}
          </span>
        </p>
      </div>

      <div className="quick-add-actions">
        <button
          type="button"
          className="text-btn"
          onClick={() => onMoreOptions(title || '(No Title)', initialDate)}
        >
          More options
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={() => void submitQuick()}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

interface EventModalProps {
  isOpen: boolean
  loading: boolean
  editingAppointment: Appointment | null
  formState: AppointmentFormState
  onChange: (next: AppointmentFormState) => void
  onClose: () => void
  onSubmit: () => Promise<void>
  onDelete: () => Promise<void>
  error: string | null
  conflicts: ConflictInfo | null
}

function EventModal({
  isOpen,
  loading,
  editingAppointment,
  formState,
  onChange,
  onClose,
  onSubmit,
  onDelete,
  error,
  conflicts,
}: EventModalProps) {
  if (!isOpen) {
    return null
  }

  const isEditing = Boolean(editingAppointment)

  return (
    <div className="event-modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(event) => event.stopPropagation()}>
        <div className="event-modal-header">
          <h2>{isEditing ? 'Edit Event' : 'New Event'}</h2>
          <button type="button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form
          className="event-modal-form"
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit()
          }}
        >
          <label className="event-title-field">
            <span className="visually-hidden">Title</span>
            <input
              autoFocus
              required
              type="text"
              placeholder="Add title"
              value={formState.title}
              onChange={(event) => onChange({ ...formState, title: event.target.value })}
            />
          </label>

          <div className="event-field-grid">
            <div className="event-field-icon">
              <Clock size={18} />
            </div>
            <div className="event-field-body event-time-row">
              <input
                required
                type="date"
                value={formState.date}
                onChange={(event) => onChange({ ...formState, date: event.target.value })}
              />
              <input
                required
                type="time"
                value={formState.startTime}
                onChange={(event) => onChange({ ...formState, startTime: event.target.value })}
              />
              <span>-</span>
              <input
                required
                type="time"
                value={formState.endTime}
                onChange={(event) => onChange({ ...formState, endTime: event.target.value })}
              />
            </div>
          </div>

          <div className="event-field-grid">
            <div className="event-field-icon" />
            <div className="event-field-body recurrence-row">
              <label>
                Repeat
                <select
                  value={formState.recurrence}
                  onChange={(event) =>
                    onChange({
                      ...formState,
                      recurrence: event.target.value as AppointmentFormState['recurrence'],
                    })
                  }
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label>
                Interval
                <input
                  type="number"
                  min={1}
                  value={formState.recurrenceInterval}
                  onChange={(event) =>
                    onChange({ ...formState, recurrenceInterval: event.target.value })
                  }
                  disabled={formState.recurrence === 'none'}
                />
              </label>
            </div>
          </div>

          <div className="event-field-grid">
            <div className="event-field-icon">
              <MapPin size={18} />
            </div>
            <div className="event-field-body">
              <input
                type="text"
                placeholder="Add location"
                value={formState.location}
                onChange={(event) => onChange({ ...formState, location: event.target.value })}
              />
            </div>
          </div>

          <div className="event-field-grid">
            <div className="event-field-icon">
              <AlignLeft size={18} />
            </div>
            <div className="event-field-body">
              <textarea
                rows={3}
                placeholder="Add description"
                value={formState.description}
                onChange={(event) =>
                  onChange({ ...formState, description: event.target.value })
                }
              />
            </div>
          </div>

          <div className="event-field-grid">
            <div className="event-field-icon">
              <Users size={18} />
            </div>
            <div className="event-field-body">
              <input
                type="text"
                placeholder="Add guests (comma separated emails)"
                value={formState.attendees}
                onChange={(event) => onChange({ ...formState, attendees: event.target.value })}
              />
            </div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          <ConflictFeedback conflicts={conflicts} />

          <div className="event-modal-footer">
            {isEditing ? (
              <button
                type="button"
                className="danger-text-btn"
                onClick={() => void onDelete()}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            ) : (
              <div />
            )}
            <div className="event-modal-footer-right">
              <button type="button" className="ghost-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

interface SidebarProps {
  currentDate: Date
  selectedDate: Date
  searchTerm: string
  onSearchChange: (value: string) => void
  onSelectDate: (value: Date) => void
  onChangeCurrentMonth: (value: Date) => void
  stats: {
    todayCount: number
    weekCount: number
    monthCount: number
  }
}

function Sidebar({
  currentDate,
  selectedDate,
  searchTerm,
  onSearchChange,
  onSelectDate,
  onChangeCurrentMonth,
  stats,
}: SidebarProps) {
  const [miniMonth, setMiniMonth] = useState(new Date(currentDate))

  useEffect(() => {
    setMiniMonth(currentDate)
  }, [currentDate])

  const grid = useMemo(
    () => getMonthGrid(miniMonth.getFullYear(), miniMonth.getMonth()),
    [miniMonth],
  )

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <aside className="scheduler-sidebar">
      <div className="search-field-wrap">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search events"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="mini-month-card">
        <div className="mini-month-header">
          <strong>
            {miniMonth.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </strong>
          <div>
            <button
              type="button"
              className="icon-btn"
              onClick={() =>
                setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1))
              }
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() =>
                setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 1))
              }
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mini-month-weekdays">
          {weekDays.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="mini-month-grid">
          {grid.map((day) => {
            const dayKey = `${toDayKey(day)}-${day.getMonth()}`
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = day.getMonth() === miniMonth.getMonth()

            return (
              <button
                key={dayKey}
                type="button"
                className={[
                  'mini-day-btn',
                  isSelected ? 'is-selected' : '',
                  !isSelected && isToday ? 'is-today' : '',
                  !isCurrentMonth ? 'is-outside-month' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  onSelectDate(day)
                  onChangeCurrentMonth(day)
                }}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      <div className="stats-stack">
        <article>
          <p>Today</p>
          <strong>{stats.todayCount}</strong>
        </article>
        <article>
          <p>Next 7 Days</p>
          <strong>{stats.weekCount}</strong>
        </article>
        <article>
          <p>This Month</p>
          <strong>{stats.monthCount}</strong>
        </article>
      </div>
    </aside>
  )
}

interface DayViewProps {
  date: Date
  appointments: Appointment[]
  onEventClick: (appointment: Appointment) => void
  onSlotClick: (hour: number, minute: number, clientY: number, clientX: number) => void
}

function DayView({ date, appointments, onEventClick, onSlotClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, index) => index)
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const isToday = isSameDay(date, now)

  const nowTop = currentHour * 64 + (currentMinute / 60) * 64

  const dayAppointments = useMemo(
    () => appointments.filter((item) => isSameDay(toDate(item.startTime), date)),
    [appointments, date],
  )

  const getPosition = (time: Date) => time.getHours() * 64 + (time.getMinutes() / 60) * 64

  const getHeight = (start: Date, end: Date) => {
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return Math.max(diffHours * 64, 26)
  }

  return (
    <div className="day-view-scroll">
      <div className="day-view-canvas">
        {isToday ? (
          <div className="now-indicator" style={{ top: `${nowTop}px` }}>
            <div className="now-time">
              {currentHour}:{currentMinute.toString().padStart(2, '0')}
            </div>
            <div className="now-line">
              <span />
            </div>
          </div>
        ) : null}

        {hours.map((hour) => (
          <div key={hour} className="hour-row">
            <div className="hour-label">
              {hour === 0 ? '' : `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`}
            </div>
            {(() => {
              const slotStart = new Date(date)
              slotStart.setHours(hour, 0, 0, 0)
              const slotEnd = new Date(slotStart)
              slotEnd.setHours(slotEnd.getHours() + 1)
              const isPastSlot = slotEnd <= now

              return (
                <button
                  type="button"
                  className={['hour-slot', isPastSlot ? 'is-past' : ''].join(' ')}
                  onClick={(event) => {
                    if (isPastSlot) {
                      return
                    }
                    const rect = event.currentTarget.getBoundingClientRect()
                    const offsetY = event.clientY - rect.top
                    const snappedMinute = offsetY > rect.height / 2 ? 30 : 0
                    onSlotClick(hour, snappedMinute, rect.top, rect.left)
                  }}
                  disabled={isPastSlot}
                  aria-label={`Add event at ${hour.toString().padStart(2, '0')}:00`}
                >
                  <span />
                </button>
              )
            })()}
          </div>
        ))}

        {dayAppointments.map((appointment) => {
          const start = toDate(appointment.startTime)
          const end = toDate(appointment.endTime)
          const top = getPosition(start)
          const height = getHeight(start, end)

          return (
            <button
              key={appointment.id}
              type="button"
              className={['day-event-card', getEventColorClass(appointment.id)].join(' ')}
              style={{ top: `${top}px`, height: `${height}px` }}
              onClick={(event) => {
                event.stopPropagation()
                onEventClick(appointment)
              }}
            >
              <strong>{appointment.title}</strong>
              <span>
                {formatTime(start)} - {formatTime(end)}
              </span>
              {height > 52 && appointment.location ? (
                <em>
                  <MapPin size={10} />
                  {appointment.location}
                </em>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface MonthViewProps {
  currentDate: Date
  appointmentsByDay: Map<string, Appointment[]>
  onDateClick: (date: Date) => void
  onEventClick: (appointment: Appointment) => void
}

function MonthView({ currentDate, appointmentsByDay, onDateClick, onEventClick }: MonthViewProps) {
  const grid = useMemo(
    () => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  )
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="month-view">
      <div className="month-week-header">
        {weekDays.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <div className="month-grid">
        {grid.map((day) => {
          const dayKey = toDayKey(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const dayAppointments = appointmentsByDay.get(dayKey) ?? []

          return (
            <button
              key={`${dayKey}-${day.getMonth()}`}
              type="button"
              className={['month-cell', !isCurrentMonth ? 'outside-month' : ''].join(' ')}
              onClick={() => onDateClick(day)}
            >
              <span className={['month-day-number', isToday ? 'is-today' : ''].join(' ')}>
                {day.getDate()}
              </span>

              <div className="month-events">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <span
                    key={appointment.id}
                    className={['month-event-pill', getEventColorClass(appointment.id)].join(' ')}
                    onClick={(event) => {
                      event.stopPropagation()
                      onEventClick(appointment)
                    }}
                  >
                    {formatTime(toDate(appointment.startTime))} {appointment.title}
                  </span>
                ))}
                {dayAppointments.length > 3 ? (
                  <span className="month-more">+ {dayAppointments.length - 3} more</span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function App() {
  // Data lifecycle remains backed by gRPC hooks (load/create/update/delete/conflicts).
  const {
    appointments,
    loading,
    error,
    loadAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkConflicts,
  } = useAppointments()

  const USER_ID = import.meta.env.VITE_USER_ID || 'demo-user'

  const handleStreamEvent = useCallback(
    (_event: AppointmentEvent) => {
      loadAppointments()
    },
    [loadAppointments],
  )
  useRealtimeUpdates(USER_ID, handleStreamEvent)

  const now = new Date()
  // Main calendar UX state for the redesigned day/month experience.
  const [currentDate, setCurrentDate] = useState(now)
  const [selectedDate, setSelectedDate] = useState(now)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [searchTerm, setSearchTerm] = useState('')

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = window.localStorage.getItem('scheduler.darkMode')
    if (saved != null) {
      return saved === '1'
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  // Full create/edit modal state.
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [modalFormState, setModalFormState] = useState<AppointmentFormState>(() =>
    createInitialFormState(now),
  )
  const [modalError, setModalError] = useState<string | null>(null)
  const [modalConflictInfo, setModalConflictInfo] = useState<ConflictInfo | null>(null)

  // Quick add state for slot-click popover workflow.
  const [quickAddPos, setQuickAddPos] = useState<{ top: number; left: number } | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', isDarkMode)
    window.localStorage.setItem('scheduler.darkMode', isDarkMode ? '1' : '0')
  }, [isDarkMode])

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => toDate(a.startTime).getTime() - toDate(b.startTime).getTime(),
      ),
    [appointments],
  )

  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedAppointments
    }

    const lowered = searchTerm.toLowerCase()
    return sortedAppointments.filter((item) => {
      const attendees = (item.attendees ?? []).join(', ')
      return (
        item.title.toLowerCase().includes(lowered) ||
        item.description.toLowerCase().includes(lowered) ||
        item.location.toLowerCase().includes(lowered) ||
        attendees.toLowerCase().includes(lowered)
      )
    })
  }, [searchTerm, sortedAppointments])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const appointment of filteredAppointments) {
      const key = toDayKey(toDate(appointment.startTime))
      const list = map.get(key) ?? []
      list.push(appointment)
      map.set(key, list)
    }
    return map
  }, [filteredAppointments])

  const stats = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const weekEnd = new Date(todayStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    let todayCount = 0
    let weekCount = 0
    let monthCount = 0

    for (const appointment of appointments) {
      const start = toDate(appointment.startTime)
      if (start >= todayStart && start < todayEnd) {
        todayCount += 1
      }
      if (start >= todayStart && start < weekEnd) {
        weekCount += 1
      }
      if (start >= monthStart && start < monthEnd) {
        monthCount += 1
      }
    }

    return { todayCount, weekCount, monthCount }
  }, [appointments, now])

  const liveConflicts = useMemo<ConflictInfo | null>(() => {
    if (!modalFormState.date || !modalFormState.startTime || !modalFormState.endTime) {
      return null
    }

    const start = new Date(`${modalFormState.date}T${modalFormState.startTime}`)
    const end = new Date(`${modalFormState.date}T${modalFormState.endTime}`)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null
    }

    if (end <= start) {
      return {
        message: 'End time must be after start time.',
        conflictingAppointments: [],
      }
    }

    const overlaps = appointments.filter((appointment) => {
      if (editingAppointment && appointment.id === editingAppointment.id) {
        return false
      }
      const apptStart = toDate(appointment.startTime)
      const apptEnd = toDate(appointment.endTime)
      return start < apptEnd && end > apptStart
    })

    if (!overlaps.length) {
      return null
    }

    return {
      message: `Conflicts with ${overlaps.length} existing event(s).`,
      conflictingAppointments: overlaps,
    }
  }, [appointments, editingAppointment, modalFormState])

  const openCreateModal = useCallback(
    (initialDate?: Date, initialTitle = '') => {
      const date = initialDate ?? selectedDate
      setEditingAppointment(null)
      setModalFormState(buildFormStateFromDate(date, initialTitle))
      setModalError(null)
      setModalConflictInfo(null)
      setIsModalOpen(true)
    },
    [selectedDate],
  )

  const openEditModal = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment)
    setModalFormState(createFormStateFromAppointment(appointment))
    setModalError(null)
    setModalConflictInfo(null)
    setQuickAddPos(null)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setModalError(null)
    setModalConflictInfo(null)
  }, [])

  const saveModal = useCallback(async () => {
    setModalError(null)
    setModalConflictInfo(null)

    try {
      const { startDate, endDate } = getFormDateRange(modalFormState)

      const conflictResponse = await checkConflicts(
        startDate,
        endDate,
        editingAppointment?.id,
      )
      if (conflictResponse) {
        setModalConflictInfo(conflictResponse)
        throw new Error(conflictResponse.message)
      }

      const attendees = modalFormState.attendees
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const recurrence = recurrenceFromForm(modalFormState)

      if (editingAppointment) {
        await updateAppointment({
          ...editingAppointment,
          title: modalFormState.title.trim(),
          description: modalFormState.description.trim(),
          startTime: startDate,
          endTime: endDate,
          location: modalFormState.location.trim(),
          attendees,
          recurrence,
        })
      } else {
        await createAppointment({
          title: modalFormState.title.trim(),
          description: modalFormState.description.trim(),
          startTime: startDate,
          endTime: endDate,
          location: modalFormState.location.trim(),
          attendees,
          recurrence,
        })
      }

      setSelectedDate(startDate)
      setCurrentDate(startDate)
      closeModal()
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : 'Failed to save appointment',
      )
    }
  }, [
    checkConflicts,
    closeModal,
    createAppointment,
    editingAppointment,
    modalFormState,
    updateAppointment,
  ])

  const deleteFromModal = useCallback(async () => {
    if (!editingAppointment) {
      return
    }

    try {
      await deleteAppointment(editingAppointment.id)
      closeModal()
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : 'Failed to delete appointment',
      )
    }
  }, [closeModal, deleteAppointment, editingAppointment])

  const handleSlotClick = useCallback(
    (hour: number, minute: number, clientY: number, clientX: number) => {
      const date = new Date(selectedDate)
      date.setHours(hour, minute, 0, 0)
      setQuickAddDate(date)
      setQuickAddPos({ top: clientY - 40, left: clientX + 12 })
    },
    [selectedDate],
  )

  const handleQuickSave = useCallback(
    async (title: string, date: Date) => {
      const end = new Date(date)
      end.setHours(end.getHours() + 1)

      const conflicts = await checkConflicts(date, end)
      if (conflicts) {
        setQuickAddPos(null)
        openCreateModal(date, title)
        setModalConflictInfo(conflicts)
        return
      }

      await createAppointment({
        title: title.trim(),
        description: '',
        startTime: date,
        endTime: end,
        location: '',
        attendees: [],
      })

      setSelectedDate(date)
      setCurrentDate(date)
      setQuickAddPos(null)
    },
    [checkConflicts, createAppointment, openCreateModal],
  )

  const handleMoreOptions = useCallback(
    (title: string, date: Date) => {
      setQuickAddPos(null)
      openCreateModal(date, title)
    },
    [openCreateModal],
  )

  return (
    <div className="scheduler-app">
      <header className="scheduler-header">
        <div className="scheduler-header-left">
          <div className="brand">
            <CalendarIcon size={30} />
            <div>
              <strong>Schedule Management</strong>
              <p>Plan, organize, and manage your calendar</p>
            </div>
          </div>

          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              const today = new Date()
              setSelectedDate(today)
              setCurrentDate(today)
            }}
          >
            Today
          </button>

          <div className="date-nav">
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                const next = new Date(currentDate)
                if (viewMode === 'month') {
                  next.setMonth(next.getMonth() - 1)
                } else {
                  next.setDate(next.getDate() - 1)
                }
                setCurrentDate(next)
                setSelectedDate(next)
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                const next = new Date(currentDate)
                if (viewMode === 'month') {
                  next.setMonth(next.getMonth() + 1)
                } else {
                  next.setDate(next.getDate() + 1)
                }
                setCurrentDate(next)
                setSelectedDate(next)
              }}
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>

            <h1>
              {viewMode === 'day'
                ? selectedDate.toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : currentDate.toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
            </h1>
          </div>
        </div>

        <div className="scheduler-header-right">
          <div className="view-switcher">
            <button
              type="button"
              className={viewMode === 'day' ? 'is-active' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              type="button"
              className={viewMode === 'month' ? 'is-active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsDarkMode((prev) => !prev)}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              const date = new Date(selectedDate)
              date.setHours(9, 0, 0, 0)
              openCreateModal(date)
            }}
          >
            <Plus size={16} />
            <span>New Event</span>
          </button>
        </div>
      </header>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="scheduler-layout">
        <Sidebar
          currentDate={currentDate}
          selectedDate={selectedDate}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectDate={(date) => {
            setSelectedDate(date)
            setCurrentDate(date)
          }}
          onChangeCurrentMonth={setCurrentDate}
          stats={stats}
        />

        <section className="scheduler-main-panel">
          {viewMode === 'day' ? (
            <>
              <div className="day-panel-header">
                <span>{selectedDate.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                <strong>{selectedDate.getDate()}</strong>
              </div>
              <DayView
                date={selectedDate}
                appointments={filteredAppointments}
                onEventClick={openEditModal}
                onSlotClick={handleSlotClick}
              />
            </>
          ) : (
            <MonthView
              currentDate={currentDate}
              appointmentsByDay={appointmentsByDay}
              onDateClick={(date) => {
                setSelectedDate(date)
                setCurrentDate(date)
                setViewMode('day')
              }}
              onEventClick={openEditModal}
            />
          )}
        </section>
      </div>

      <QuickAddPopover
        isOpen={Boolean(quickAddPos && quickAddDate)}
        position={quickAddPos}
        initialDate={quickAddDate || new Date()}
        onClose={() => setQuickAddPos(null)}
        onSave={handleQuickSave}
        onMoreOptions={handleMoreOptions}
      />

      <EventModal
        isOpen={isModalOpen}
        loading={loading}
        editingAppointment={editingAppointment}
        formState={modalFormState}
        onChange={setModalFormState}
        onClose={closeModal}
        onSubmit={saveModal}
        onDelete={deleteFromModal}
        error={modalError}
        conflicts={modalConflictInfo || liveConflicts}
      />
    </div>
  )
}

export default App
