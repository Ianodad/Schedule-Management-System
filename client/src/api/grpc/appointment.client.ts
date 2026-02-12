import type { Appointment } from '@/types/appointment'

const mockAppointments: Appointment[] = []

export async function listAppointments(): Promise<Appointment[]> {
  return Promise.resolve([...mockAppointments])
}

export async function createAppointment(appointment: Appointment): Promise<Appointment> {
  mockAppointments.push(appointment)
  return Promise.resolve(appointment)
}
