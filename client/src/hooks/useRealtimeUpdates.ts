import { useEffect, useRef } from 'react';
import { streamAppointments } from '@/api/grpc/appointment.client';
import type { AppointmentEvent } from '@/types/appointment';

interface UseRealtimeUpdatesOptions {
  userId: string;
  onEvent: (event: AppointmentEvent) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export function useRealtimeUpdates({
  userId,
  onEvent,
  onError,
  enabled = true,
}: UseRealtimeUpdatesOptions): void {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    console.log('Setting up real-time updates for user:', userId);

    const cleanup = streamAppointments(
      { userId },
      (event) => {
        console.log('Received appointment event:', event);
        onEvent(event);
      },
      (error) => {
        console.error('Stream error:', error);
        onError?.(error);
      }
    );

    cleanupRef.current = cleanup;

    return () => {
      console.log('Cleaning up real-time updates');
      cleanup();
      cleanupRef.current = null;
    };
  }, [userId, enabled, onEvent, onError]);
}
