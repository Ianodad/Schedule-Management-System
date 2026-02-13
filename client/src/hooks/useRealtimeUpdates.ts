import { useEffect, useRef } from 'react'
import { appointmentClient } from '../api/grpc/appointmentClient'
import type { AppointmentEvent } from '../api/grpc/types'

const RECONNECT_DELAY_MS = 3000

export function useRealtimeUpdates(
  userId: string,
  onEvent: (event: AppointmentEvent) => void,
): void {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!userId) return

    let cancelled = false
    let streamHandle: { cancel: () => void } | null = null

    function connect() {
      if (cancelled) return

      streamHandle = appointmentClient.streamAppointments(
        userId,
        (event) => {
          onEventRef.current(event)
        },
        (err) => {
          console.error('[realtime] stream error:', err.message)
          // Reconnect after a delay unless intentionally cancelled
          if (!cancelled) {
            setTimeout(connect, RECONNECT_DELAY_MS)
          }
        },
        () => {
          // Stream ended by server, reconnect
          if (!cancelled) {
            setTimeout(connect, RECONNECT_DELAY_MS)
          }
        },
      )
    }

    connect()

    return () => {
      cancelled = true
      if (streamHandle) {
        streamHandle.cancel()
      }
    }
  }, [userId])
}
