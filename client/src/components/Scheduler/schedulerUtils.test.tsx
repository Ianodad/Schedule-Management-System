import { getFormDateRange } from './schedulerUtils'
import type { AppointmentFormState } from './formTypes'

function buildFormState(date: string, startTime: string, endTime: string): AppointmentFormState {
  return {
    title: 'Review',
    description: '',
    date,
    startTime,
    endTime,
    location: '',
    attendees: '',
    recurrence: 'none',
    recurrenceInterval: '1',
  }
}

describe('getFormDateRange', () => {
  it('rejects past start times', () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    const formState = buildFormState(`${y}-${m}-${d}`, '00:00', '00:30')

    expect(() => getFormDateRange(formState)).toThrow('Start time must be in the future.')
  })

  it('accepts future start times', () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const y = tomorrow.getFullYear()
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const d = String(tomorrow.getDate()).padStart(2, '0')
    const formState = buildFormState(`${y}-${m}-${d}`, '09:00', '10:00')

    const range = getFormDateRange(formState)

    expect(range.startDate.getTime()).toBeGreaterThan(now.getTime())
    expect(range.endDate.getTime()).toBeGreaterThan(range.startDate.getTime())
  })
})
