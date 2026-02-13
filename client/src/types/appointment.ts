// Re-export gRPC types as the primary appointment types
export type {
  Appointment,
  AppointmentStatus,
  RecurrenceFrequency,
  RecurrenceRule,
  ConflictInfo,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  GetAppointmentRequest,
  GetAppointmentResponse,
  ListAppointmentsRequest,
  ListAppointmentsResponse,
  UpdateAppointmentRequest,
  UpdateAppointmentResponse,
  DeleteAppointmentRequest,
  CheckConflictsRequest,
  CheckConflictsResponse,
  AppointmentEvent,
  EventType,
} from '@/api/grpc/types'

export { AppointmentStatus, RecurrenceFrequency, EventType } from '@/api/grpc/types'

// UI-specific types
export interface AppointmentFormData {
  title: string
  description: string
  startTime: Date
  endTime: Date
  location: string
  attendees: string[]
  recurrence?: {
    frequency: string
    interval: number
    until?: Date
    count?: number
  }
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
}
