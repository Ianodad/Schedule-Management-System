import { useMemo, useState } from 'react'
import type {
  Appointment,
  ConflictInfo,
} from './types/appointment'
import { useAppointments } from './hooks/useAppointments'
import CalendarPanel from './components/Scheduler/CalendarPanel'
import AgendaPanel from './components/Scheduler/AgendaPanel'
import CreateModal from './components/Scheduler/CreateModal'
import EditModal from './components/Scheduler/EditModal'
import DetailModal from './components/Scheduler/DetailModal'
import type { AppointmentFormState } from './components/Scheduler/formTypes'
import {
  createFormStateFromAppointment,
  createInitialFormState,
  getFormDateRange,
  recurrenceFromForm,
  toDate,
  toDayKey,
} from './components/Scheduler/schedulerUtils'
import './App.css'

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
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null)

  const [createFormState, setCreateFormState] = useState<AppointmentFormState>(
    () => createInitialFormState(today),
  )
  const [editFormState, setEditFormState] = useState<AppointmentFormState>(() =>
    createInitialFormState(today),
  )

  const [submitting, setSubmitting] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [createConflictInfo, setCreateConflictInfo] = useState<ConflictInfo | null>(
    null,
  )
  const [editConflictInfo, setEditConflictInfo] = useState<ConflictInfo | null>(null)

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => toDate(a.startTime).getTime() - toDate(b.startTime).getTime(),
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

  const selectedDayAppointments =
    appointmentsByDay.get(toDayKey(selectedDate)) ?? []

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
    setCreateFormState(createInitialFormState(selectedDate))
    setFormError(null)
    setCreateConflictInfo(null)
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setFormError(null)
    setCreateConflictInfo(null)
  }

  const openEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setEditFormState(createFormStateFromAppointment(appointment))
    setEditFormError(null)
    setEditConflictInfo(null)
    setSelectedAppointment(null)
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingAppointment(null)
    setEditFormError(null)
    setEditConflictInfo(null)
  }

  const handleCreateAppointment = async () => {
    setSubmitting(true)
    setFormError(null)
    setCreateConflictInfo(null)

    try {
      const { startDate, endDate } = getFormDateRange(createFormState)

      const conflicts = await checkConflicts(startDate, endDate)
      if (conflicts) {
        setCreateConflictInfo(conflicts)
        throw new Error(conflicts.message || 'Selected time conflicts with another appointment.')
      }

      await createAppointment({
        title: createFormState.title.trim(),
        description: createFormState.description.trim(),
        startTime: startDate,
        endTime: endDate,
        location: createFormState.location.trim(),
        attendees: createFormState.attendees
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
        recurrence: recurrenceFromForm(createFormState),
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

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) {
      return
    }

    setEditSubmitting(true)
    setEditFormError(null)
    setEditConflictInfo(null)

    try {
      const { startDate, endDate } = getFormDateRange(editFormState)

      const conflicts = await checkConflicts(startDate, endDate, editingAppointment.id)
      if (conflicts) {
        setEditConflictInfo(conflicts)
        throw new Error(conflicts.message || 'Selected time conflicts with another appointment.')
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
        recurrence: recurrenceFromForm(editFormState),
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
        <CalendarPanel
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          today={today}
          appointmentsByDay={appointmentsByDay}
          onSelectDate={setSelectedDate}
          onPrevMonth={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
            )
          }
          onNextMonth={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
            )
          }
        />

        <AgendaPanel
          selectedDate={selectedDate}
          appointments={selectedDayAppointments}
          loading={loading}
          error={error}
          onAdd={openCreateModal}
          onSelectAppointment={setSelectedAppointment}
        />
      </main>

      <CreateModal
        isOpen={isCreateModalOpen}
        formState={createFormState}
        onChange={setCreateFormState}
        submitting={submitting}
        error={formError}
        conflicts={createConflictInfo}
        onClose={closeCreateModal}
        onSubmit={handleCreateAppointment}
      />

      <DetailModal
        appointment={selectedAppointment}
        loading={loading}
        onClose={() => setSelectedAppointment(null)}
        onEdit={openEditModal}
        onDelete={handleDeleteSelected}
      />

      <EditModal
        isOpen={isEditModalOpen}
        formState={editFormState}
        onChange={setEditFormState}
        submitting={editSubmitting}
        error={editFormError}
        conflicts={editConflictInfo}
        onClose={closeEditModal}
        onSubmit={handleUpdateAppointment}
      />
    </div>
  )
}

export default App
