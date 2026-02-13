import { render, screen } from '@testing-library/react'
import type { Appointment, ConflictInfo } from '../../types/appointment'
import { AppointmentStatus } from '../../types/appointment'
import ConflictFeedback from './ConflictFeedback'

function buildAppointment(): Appointment {
  const now = new Date('2026-02-13T10:00:00Z')
  const later = new Date('2026-02-13T11:00:00Z')

  return {
    id: 'apt-1',
    userId: 'demo-user',
    title: 'Planning session',
    description: 'Roadmap planning',
    startTime: now,
    endTime: later,
    location: 'Room A',
    attendees: ['alice@example.com'],
    status: AppointmentStatus.SCHEDULED,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }
}

describe('ConflictFeedback', () => {
  it('renders conflict details and conflicting appointments', () => {
    const conflicts: ConflictInfo = {
      message: 'Time overlaps with another event',
      conflictingAppointments: [buildAppointment()],
    }

    render(<ConflictFeedback conflicts={conflicts} />)

    expect(screen.getByText('Conflict detected')).toBeInTheDocument()
    expect(
      screen.getByText('Time overlaps with another event'),
    ).toBeInTheDocument()
    expect(screen.getByText('Planning session')).toBeInTheDocument()
  })
})
