import { useCallback, useEffect, useState } from 'react'
import { createAppointment, listAppointments } from '@/api/grpc/appointment.client'
import type { Appointment } from '@/types/appointment'

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    listAppointments().then(setAppointments)
  }, [])

  const addAppointment = useCallback(async (appointment: Appointment) => {
    const created = await createAppointment(appointment)
    setAppointments((prev) => [...prev, created])
  }, [])

  return {
    appointments,
    addAppointment,
  }
}
