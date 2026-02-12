import type { Appointment } from '@/types/appointment'

interface AppointmentState {
  appointments: Appointment[]
}

const state: AppointmentState = {
  appointments: [],
}

export function getAppointments(): Appointment[] {
  return state.appointments
}

export function setAppointments(appointments: Appointment[]): void {
  state.appointments = appointments
}
