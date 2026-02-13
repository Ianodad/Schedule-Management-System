import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createAppointment,
  listAppointments,
  updateAppointment,
  deleteAppointment,
  GrpcError,
} from '@/api/grpc/appointment.client';
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentStatus,
} from '@/types/appointment';

interface UseAppointmentsOptions {
  userId: string;
  from?: string;
  to?: string;
  status?: AppointmentStatus;
}

export function useAppointments(options: UseAppointmentsOptions) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listAppointments({
        userId: options.userId,
        from: options.from,
        to: options.to,
        status: options.status,
      });
      setAppointments(response.appointments);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch appointments');
      setError(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [options.userId, options.from, options.to, options.status]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = useCallback(
    async (request: CreateAppointmentRequest) => {
      try {
        const response = await createAppointment(request);

        if (response.conflicts && response.conflicts.conflictingAppointments.length > 0) {
          toast.error('Appointment conflicts with existing appointments');
          return { appointment: response.appointment, conflicts: response.conflicts };
        }

        setAppointments((prev) => [...prev, response.appointment]);
        toast.success('Appointment created successfully');
        return { appointment: response.appointment };
      } catch (err) {
        if (err instanceof GrpcError) {
          if (err.code === 'ALREADY_EXISTS') {
            toast.error('Time slot is no longer available');
            return { error: err, conflicts: err.details?.conflicts };
          }
          toast.error(err.message);
        } else {
          toast.error('Failed to create appointment');
        }
        throw err;
      }
    },
    []
  );

  const modifyAppointment = useCallback(
    async (request: UpdateAppointmentRequest) => {
      try {
        const response = await updateAppointment(request);

        setAppointments((prev) =>
          prev.map((apt) => (apt.id === response.appointment.id ? response.appointment : apt))
        );
        toast.success('Appointment updated successfully');
        return { appointment: response.appointment };
      } catch (err) {
        if (err instanceof GrpcError) {
          if (err.code === 'ABORTED') {
            toast.error('Appointment was modified by another user. Please refresh and try again.');
          } else {
            toast.error(err.message);
          }
        } else {
          toast.error('Failed to update appointment');
        }
        throw err;
      }
    },
    []
  );

  const removeAppointment = useCallback(async (id: string) => {
    try {
      await deleteAppointment({ id });
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      toast.success('Appointment deleted successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete appointment');
      toast.error(error.message);
      throw err;
    }
  }, []);

  return {
    appointments,
    loading,
    error,
    addAppointment,
    modifyAppointment,
    removeAppointment,
    refetchAppointments: fetchAppointments,
  };
}
