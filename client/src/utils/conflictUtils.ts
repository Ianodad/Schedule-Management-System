import type { Appointment, AppointmentConflict } from '@/types/appointment'

export function detectConflicts(appointments: Appointment[]): AppointmentConflict[] {
  const conflicts: AppointmentConflict[] = []

  for (let i = 0; i < appointments.length; i += 1) {
    for (let j = i + 1; j < appointments.length; j += 1) {
      const a = appointments[i]
      const b = appointments[j]
      const aStart = new Date(a.startTime).getTime()
      const aEnd = new Date(a.endTime).getTime()
      const bStart = new Date(b.startTime).getTime()
      const bEnd = new Date(b.endTime).getTime()

      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push({ first: a, second: b })
      }
    }
  }

  return conflicts
}
