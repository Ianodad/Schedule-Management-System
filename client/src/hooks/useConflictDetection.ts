import { useMemo } from 'react'
import type { Appointment } from '@/types/appointment'
import { detectConflicts } from '@/utils/conflictUtils'

export function useConflictDetection(appointments: Appointment[]) {
  return useMemo(() => detectConflicts(appointments), [appointments])
}
