import { useEffect } from 'react'

export function useRealtimeUpdates(onMessage: (payload: unknown) => void): void {
  useEffect(() => {
    const timer = setInterval(() => {
      onMessage({ type: 'heartbeat', at: Date.now() })
    }, 30_000)

    return () => {
      clearInterval(timer)
    }
  }, [onMessage])
}
