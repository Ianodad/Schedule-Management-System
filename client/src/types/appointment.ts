export interface Appointment {
  id: string
  title: string
  startTime: string
  endTime: string
  description?: string
}

export interface AppointmentConflict {
  first: Appointment
  second: Appointment
}
