export type RecurrenceOption = 'none' | 'daily' | 'weekly' | 'monthly'

export interface AppointmentFormState {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  attendees: string
  recurrence: RecurrenceOption
  recurrenceInterval: string
  recurrenceCount: string
  recurrenceUntil: string
}
