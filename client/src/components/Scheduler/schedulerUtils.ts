import type {
  Appointment,
  RecurrenceRule,
} from '../../types/appointment'
import { RecurrenceFrequency } from '../../types/appointment'
import type { AppointmentFormState } from './formTypes'

function toLocalDateString(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

export function toDayKey(value: Date): string {
  return toLocalDateString(value)
}

export function formatMonthLabel(value: Date): string {
  return value.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${start.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${end.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function createInitialFormState(selectedDate: Date): AppointmentFormState {
  return {
    title: '',
    description: '',
    date: toLocalDateString(selectedDate),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    attendees: '',
    recurrence: 'none',
    recurrenceInterval: '1',
  }
}

export function createFormStateFromAppointment(
  appointment: Appointment,
): AppointmentFormState {
  const start = toDate(appointment.startTime)
  const end = toDate(appointment.endTime)

  let recurrence: AppointmentFormState['recurrence'] = 'none'
  let recurrenceInterval = '1'

  if (appointment.recurrence) {
    recurrenceInterval = String(appointment.recurrence.interval || 1)
    switch (appointment.recurrence.frequency) {
      case RecurrenceFrequency.DAILY:
        recurrence = 'daily'
        break
      case RecurrenceFrequency.WEEKLY:
        recurrence = 'weekly'
        break
      case RecurrenceFrequency.MONTHLY:
        recurrence = 'monthly'
        break
      default:
        recurrence = 'none'
    }
  }

  return {
    title: appointment.title,
    description: appointment.description,
    date: toLocalDateString(start),
    startTime: start.toTimeString().slice(0, 5),
    endTime: end.toTimeString().slice(0, 5),
    location: appointment.location ?? '',
    attendees: (appointment.attendees ?? []).join(', '),
    recurrence,
    recurrenceInterval,
  }
}

export function getMonthDays(monthDate: Date): Date[] {
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

export function getFormDateRange(formState: AppointmentFormState): {
  startDate: Date
  endDate: Date
} {
  const startDate = new Date(`${formState.date}T${formState.startTime}`)
  const endDate = new Date(`${formState.date}T${formState.endTime}`)
  const now = new Date()

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Please provide valid start and end times.')
  }

  if (endDate <= startDate) {
    throw new Error('End time must be after start time.')
  }

  if (startDate <= now) {
    throw new Error('Start time must be in the future.')
  }

  return { startDate, endDate }
}

export function recurrenceFromForm(
  formState: AppointmentFormState,
): RecurrenceRule | undefined {
  if (formState.recurrence === 'none') {
    return undefined
  }

  const parsedInterval = Number.parseInt(formState.recurrenceInterval, 10)
  const interval = Number.isFinite(parsedInterval) && parsedInterval > 0
    ? parsedInterval
    : 1

  let frequency = RecurrenceFrequency.WEEKLY
  if (formState.recurrence === 'daily') {
    frequency = RecurrenceFrequency.DAILY
  } else if (formState.recurrence === 'monthly') {
    frequency = RecurrenceFrequency.MONTHLY
  }

  return {
    frequency,
    interval,
  }
}
