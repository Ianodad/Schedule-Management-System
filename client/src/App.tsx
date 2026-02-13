import { FormEvent, useMemo, useState } from 'react'
import type { Appointment } from './types/appointment'
import { useAppointments } from './hooks/useAppointments'
import Modal from './components/common/Modal'
import './App.css'

interface AppointmentFormState {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  attendees: string
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

function toDayKey(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function formatMonthLabel(value: Date): string {
  return value.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

function formatTimeRange(start: Date, end: Date): string {
  return `${start.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function createInitialFormState(selectedDate: Date): AppointmentFormState {
  return {
    title: '',
    description: '',
    date: selectedDate.toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    attendees: '',
  }
}

function createFormStateFromAppointment(appointment: Appointment): AppointmentFormState {
  const start = toDate(appointment.startTime)
  const end = toDate(appointment.endTime)

  return {
    title: appointment.title,
    description: appointment.description,
    date: start.toISOString().slice(0, 10),
    startTime: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    location: appointment.location ?? '',
    attendees: (appointment.attendees ?? []).join(', '),
  }
}

function getFormDateRange(formState: AppointmentFormState): { startDate: Date; endDate: Date } {
  const startDate = new Date(`${formState.date}T${formState.startTime}`)
  const endDate = new Date(`${formState.date}T${formState.endTime}`)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Please provide valid start and end times.')
  }

  if (endDate <= startDate) {
    throw new Error('End time must be after start time.')
  }

  return { startDate, endDate }
}

function getMonthDays(monthDate: Date): Date[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const lastOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)

  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

  const gridEnd = new Date(lastOfMonth)
  gridEnd.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()))

  const days: Date[] = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function App() {
  const {
    appointments,
    loading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkConflicts,
  } = useAppointments()

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(today)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(
    null,
  )
  const [formState, setFormState] = useState<AppointmentFormState>(() =>
    createInitialFormState(today),
  )
  const [editFormState, setEditFormState] = useState<AppointmentFormState>(() =>
    createInitialFormState(today),
  )
  const [submitting, setSubmitting] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editFormError, setEditFormError] = useState<string | null>(null)

  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth])

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          toDate(a.startTime).getTime() - toDate(b.startTime).getTime(),
      ),
    [appointments],
  )

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()

    for (const appointment of sortedAppointments) {
      const key = toDayKey(toDate(appointment.startTime))
      const dayAppointments = map.get(key) ?? []
      dayAppointments.push(appointment)
      map.set(key, dayAppointments)
    }

    return map
  }, [sortedAppointments])

  const selectedDayKey = toDayKey(selectedDate)
  const selectedDayAppointments = appointmentsByDay.get(selectedDayKey) ?? []

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const weekEnd = new Date(todayStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  const stats = useMemo(() => {
    let todayCount = 0
    let weekCount = 0
    let monthCount = 0

    for (const appointment of sortedAppointments) {
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
  }, [sortedAppointments])

  const openCreateModal = () => {
    setFormState(createInitialFormState(selectedDate))
    setFormError(null)
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setFormError(null)
  }

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setEditFormState(createFormStateFromAppointment(appointment))
    setEditFormError(null)
    setSelectedAppointment(null)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingAppointment(null)
    setEditFormError(null)
  }

  const handleCreateAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const { startDate, endDate } = getFormDateRange(formState)

      const conflicts = await checkConflicts(startDate, endDate)
      if (conflicts?.message) {
        throw new Error(conflicts.message)
      }

      await createAppointment({
        title: formState.title.trim(),
        description: formState.description.trim(),
        startTime: startDate,
        endTime: endDate,
        location: formState.location.trim(),
        attendees: formState.attendees
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
      })

      setSelectedDate(startDate)
      setCurrentMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1))
      closeCreateModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appointment'
      setFormError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateAppointment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingAppointment) {
      return
    }

    setEditSubmitting(true)
    setEditFormError(null)

    try {
      const { startDate, endDate } = getFormDateRange(editFormState)

      const conflicts = await checkConflicts(startDate, endDate, editingAppointment.id)
      if (conflicts?.message) {
        throw new Error(conflicts.message)
      }

      await updateAppointment({
        ...editingAppointment,
        title: editFormState.title.trim(),
        description: editFormState.description.trim(),
        startTime: startDate,
        endTime: endDate,
        location: editFormState.location.trim(),
        attendees: editFormState.attendees
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
      })

      setSelectedDate(startDate)
      setCurrentMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1))
      closeEditModal()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update appointment'
      setEditFormError(message)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedAppointment) {
      return
    }

    await deleteAppointment(selectedAppointment.id)
    setSelectedAppointment(null)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Fullstack Technical Assessment</p>
          <h1>Schedule Management System</h1>
          <p className="subtitle">
            Book, review, and manage appointments without conflicts.
          </p>
        </div>
        <button className="primary-btn" onClick={openCreateModal}>
          New Appointment
        </button>
      </header>

      <section className="stats-row">
        <article className="stat-card">
          <p>Today</p>
          <strong>{stats.todayCount}</strong>
        </article>
        <article className="stat-card">
          <p>Next 7 Days</p>
          <strong>{stats.weekCount}</strong>
        </article>
        <article className="stat-card">
          <p>This Month</p>
          <strong>{stats.monthCount}</strong>
        </article>
      </section>

      <main className="main-grid">
        <section className="calendar-panel">
          <div className="calendar-toolbar">
            <button
              className="ghost-btn"
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                )
              }
            >
              Prev
            </button>
            <h2>{formatMonthLabel(currentMonth)}</h2>
            <button
              className="ghost-btn"
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                )
              }
            >
              Next
            </button>
          </div>

          <div className="calendar-grid calendar-weekdays">
            {WEEKDAY_LABELS.map(label => (
              <div key={label} className="weekday-cell">
                {label}
              </div>
            ))}
          </div>

          <div className="calendar-grid calendar-days">
            {monthDays.map(day => {
              const dayKey = toDayKey(day)
              const dayAppointments = appointmentsByDay.get(dayKey) ?? []
              const isOutsideMonth = day.getMonth() !== currentMonth.getMonth()
              const isSelected = dayKey === selectedDayKey
              const isToday = dayKey === toDayKey(today)

              return (
                <button
                  key={dayKey}
                  className={[
                    'day-cell',
                    isOutsideMonth ? 'outside-month' : '',
                    isSelected ? 'selected-day' : '',
                    isToday ? 'today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="day-number">{day.getDate()}</div>
                  {dayAppointments.slice(0, 2).map(appointment => (
                    <div key={appointment.id} className="day-pill">
                      {toDate(appointment.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      {appointment.title}
                    </div>
                  ))}
                  {dayAppointments.length > 2 ? (
                    <div className="day-pill muted">+{dayAppointments.length - 2} more</div>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>

        <aside className="agenda-panel">
          <div className="agenda-header">
            <h2>
              Agenda: {selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </h2>
            <button className="ghost-btn" onClick={openCreateModal}>
              Add
            </button>
          </div>

          {loading ? <p className="status-text">Loading appointments...</p> : null}
          {error ? <p className="status-text error-text">{error}</p> : null}

          {!loading && selectedDayAppointments.length === 0 ? (
            <p className="status-text">No appointments on this day.</p>
          ) : null}

          <div className="agenda-list">
            {selectedDayAppointments.map(appointment => {
              const start = toDate(appointment.startTime)
              const end = toDate(appointment.endTime)

              return (
                <button
                  key={appointment.id}
                  className="agenda-item"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <h3>{appointment.title}</h3>
                  <p>{formatTimeRange(start, end)}</p>
                  {appointment.location ? <p>{appointment.location}</p> : null}
                </button>
              )
            })}
          </div>
        </aside>
      </main>

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Create Appointment">
        <form className="modal-form" onSubmit={handleCreateAppointment}>
          <label>
            Title
            <input
              required
              value={formState.title}
              onChange={event =>
                setFormState(prev => ({ ...prev, title: event.target.value }))
              }
              placeholder="Client check-in"
            />
          </label>

          <label>
            Description
            <textarea
              value={formState.description}
              onChange={event =>
                setFormState(prev => ({ ...prev, description: event.target.value }))
              }
              placeholder="Agenda, notes, expectations"
            />
          </label>

          <div className="form-row">
            <label>
              Date
              <input
                required
                type="date"
                value={formState.date}
                onChange={event =>
                  setFormState(prev => ({ ...prev, date: event.target.value }))
                }
              />
            </label>
            <label>
              Start
              <input
                required
                type="time"
                value={formState.startTime}
                onChange={event =>
                  setFormState(prev => ({ ...prev, startTime: event.target.value }))
                }
              />
            </label>
            <label>
              End
              <input
                required
                type="time"
                value={formState.endTime}
                onChange={event =>
                  setFormState(prev => ({ ...prev, endTime: event.target.value }))
                }
              />
            </label>
          </div>

          <label>
            Location
            <input
              value={formState.location}
              onChange={event =>
                setFormState(prev => ({ ...prev, location: event.target.value }))
              }
              placeholder="Board room A / Zoom"
            />
          </label>

          <label>
            Attendees (comma separated)
            <input
              value={formState.attendees}
              onChange={event =>
                setFormState(prev => ({ ...prev, attendees: event.target.value }))
              }
              placeholder="alice@company.com, bob@company.com"
            />
          </label>

          {formError ? <p className="error-text">{formError}</p> : null}

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={closeCreateModal}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        title={selectedAppointment?.title || 'Appointment Details'}
      >
        {selectedAppointment ? (
          <div className="details-content">
            <p>
              <strong>When:</strong>{' '}
              {formatTimeRange(
                toDate(selectedAppointment.startTime),
                toDate(selectedAppointment.endTime),
              )}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {toDate(selectedAppointment.startTime).toLocaleDateString()}
            </p>
            {selectedAppointment.location ? (
              <p>
                <strong>Location:</strong> {selectedAppointment.location}
              </p>
            ) : null}
            {selectedAppointment.description ? (
              <p>
                <strong>Description:</strong> {selectedAppointment.description}
              </p>
            ) : null}
            {selectedAppointment.attendees?.length ? (
              <p>
                <strong>Attendees:</strong> {selectedAppointment.attendees.join(', ')}
              </p>
            ) : null}

            <div className="modal-actions">
              <button
                className="ghost-btn"
                onClick={() => openEditModal(selectedAppointment)}
                disabled={loading}
              >
                Edit Appointment
              </button>
              <button
                className="danger-btn"
                onClick={handleDeleteSelected}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Appointment'}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Appointment">
        <form className="modal-form" onSubmit={handleUpdateAppointment}>
          <label>
            Title
            <input
              required
              value={editFormState.title}
              onChange={event =>
                setEditFormState(prev => ({ ...prev, title: event.target.value }))
              }
              placeholder="Client check-in"
            />
          </label>

          <label>
            Description
            <textarea
              value={editFormState.description}
              onChange={event =>
                setEditFormState(prev => ({ ...prev, description: event.target.value }))
              }
              placeholder="Agenda, notes, expectations"
            />
          </label>

          <div className="form-row">
            <label>
              Date
              <input
                required
                type="date"
                value={editFormState.date}
                onChange={event =>
                  setEditFormState(prev => ({ ...prev, date: event.target.value }))
                }
              />
            </label>
            <label>
              Start
              <input
                required
                type="time"
                value={editFormState.startTime}
                onChange={event =>
                  setEditFormState(prev => ({ ...prev, startTime: event.target.value }))
                }
              />
            </label>
            <label>
              End
              <input
                required
                type="time"
                value={editFormState.endTime}
                onChange={event =>
                  setEditFormState(prev => ({ ...prev, endTime: event.target.value }))
                }
              />
            </label>
          </div>

          <label>
            Location
            <input
              value={editFormState.location}
              onChange={event =>
                setEditFormState(prev => ({ ...prev, location: event.target.value }))
              }
              placeholder="Board room A / Zoom"
            />
          </label>

          <label>
            Attendees (comma separated)
            <input
              value={editFormState.attendees}
              onChange={event =>
                setEditFormState(prev => ({ ...prev, attendees: event.target.value }))
              }
              placeholder="alice@company.com, bob@company.com"
            />
          </label>

          {editFormError ? <p className="error-text">{editFormError}</p> : null}

          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={closeEditModal}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={editSubmitting}>
              {editSubmitting ? 'Saving...' : 'Update Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default App
