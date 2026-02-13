import { useCallback, useEffect, useState } from 'react'
import { appointmentClient } from '../api/grpc/appointmentClient'
import type {
  Appointment,
  CreateAppointmentRequest,
  AppointmentStatus,
} from '../types/appointment'
import toast from 'react-hot-toast'

// Get user ID from environment or use default for demo
const USER_ID = import.meta.env.VITE_USER_ID || 'demo-user'

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load appointments on mount
  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = useCallback(async (status?: AppointmentStatus) => {
    setLoading(true)
    setError(null)
    try {
      const response = await appointmentClient.listAppointments({
        userId: USER_ID,
        status,
        limit: 100,
      })
      setAppointments(response.appointments)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load appointments'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createAppointment = useCallback(async (request: Omit<CreateAppointmentRequest, 'userId'>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await appointmentClient.createAppointment({
        ...request,
        userId: USER_ID,
      })

      if (response.appointment) {
        setAppointments(prev => [...prev, response.appointment!])
        toast.success('Appointment created successfully')
        return response.appointment
      }

      if (response.conflicts) {
        toast.error(response.conflicts.message)
        throw new Error(response.conflicts.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appointment'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAppointment = useCallback(async (appointment: Appointment) => {
    setLoading(true)
    setError(null)
    try {
      const response = await appointmentClient.updateAppointment({
        appointment,
      })

      if (response.appointment) {
        setAppointments(prev =>
          prev.map(a => (a.id === appointment.id ? response.appointment! : a))
        )
        toast.success('Appointment updated successfully')
        return response.appointment
      }

      if (response.conflicts) {
        toast.error(response.conflicts.message)
        throw new Error(response.conflicts.message)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update appointment'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAppointment = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await appointmentClient.deleteAppointment({ id })
      setAppointments(prev => prev.filter(a => a.id !== id))
      toast.success('Appointment deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete appointment'
      setError(message)
      toast.error(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const checkConflicts = useCallback(async (
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ) => {
    try {
      const response = await appointmentClient.checkConflicts({
        userId: USER_ID,
        startTime,
        endTime,
        excludeId,
      })
      return response.conflicts
    } catch (err) {
      console.error('Failed to check conflicts:', err)
      return undefined
    }
  }, [])

  return {
    appointments,
    loading,
    error,
    loadAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    checkConflicts,
  }
}
