import { useEffect, useRef } from 'react'
import { appointmentClient } from '../api/grpc/appointmentClient'
import type { AppointmentEvent } from '../api/grpc/types'

const RECONNECT_DELAY_MS = 3000
const CANCELED_CODE = 1

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
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function clearReconnectTimer() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    function scheduleReconnect() {
      if (cancelled || reconnectTimer) return
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, RECONNECT_DELAY_MS)
    }

    function connect() {
      if (cancelled) return

      // Ensure we never keep multiple active streams.
      if (streamHandle) {
        streamHandle.cancel()
        streamHandle = null
      }

      streamHandle = appointmentClient.streamAppointments(
        userId,
        (event) => {
          onEventRef.current(event)
        },
        (err) => {
          if (cancelled) return

          // Local client cancellation is expected during cleanup/reconnect.
          if (err.code !== CANCELED_CODE) {
            console.error('[realtime] stream error:', err.message)
          }
          scheduleReconnect()
        },
        () => {
          if (!cancelled) scheduleReconnect()
        },
      )
    }

    connect()

    return () => {
      cancelled = true
      clearReconnectTimer()
      if (streamHandle) {
        streamHandle.cancel()
        streamHandle = null
      }
    }
  }, [userId])
}
