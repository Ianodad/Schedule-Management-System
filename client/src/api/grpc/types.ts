// TypeScript types matching the protobuf definitions

export enum AppointmentStatus {
  UNSPECIFIED = 0,
  SCHEDULED = 1,
  CANCELLED = 2,
  COMPLETED = 3,
}

export enum RecurrenceFrequency {
  UNSPECIFIED = 0,
  DAILY = 1,
  WEEKLY = 2,
  MONTHLY = 3,
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  until?: Date
  count?: number
}

export interface Appointment {
  id: string
  userId: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  location: string
  attendees: string[]
  status: AppointmentStatus
  recurrence?: RecurrenceRule
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface ConflictInfo {
  conflictingAppointments: Appointment[]
  message: string
}

export interface CreateAppointmentRequest {
  userId: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  location: string
  attendees: string[]
  recurrence?: RecurrenceRule
}

export interface CreateAppointmentResponse {
  appointment?: Appointment
  conflicts?: ConflictInfo
}

export interface GetAppointmentRequest {
  id: string
}

export interface GetAppointmentResponse {
  appointment: Appointment
}

export interface ListAppointmentsRequest {
  userId: string
  from?: Date
  to?: Date
  status?: AppointmentStatus
  limit?: number
  offset?: number
}

export interface ListAppointmentsResponse {
  appointments: Appointment[]
}

export interface UpdateAppointmentRequest {
  appointment: Appointment
}

export interface UpdateAppointmentResponse {
  appointment: Appointment
  conflicts?: ConflictInfo
}

export interface DeleteAppointmentRequest {
  id: string
}

export interface CheckConflictsRequest {
  userId: string
  startTime: Date
  endTime: Date
  excludeId?: string
}

export interface CheckConflictsResponse {
  conflicts?: ConflictInfo
}

export enum EventType {
  UNSPECIFIED = 0,
  CREATED = 1,
  UPDATED = 2,
  DELETED = 3,
}

export interface AppointmentEvent {
  type: EventType
  appointment: Appointment
}
