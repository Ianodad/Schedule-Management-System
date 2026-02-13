import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Appointment } from '../../types/appointment'
import { AppointmentStatus } from '../../types/appointment'
import AgendaPanel from './AgendaPanel'

function buildAppointment(): Appointment {
  const now = new Date('2026-02-13T10:00:00Z')
  const later = new Date('2026-02-13T11:00:00Z')

  return {
    id: 'apt-2',
    userId: 'demo-user',
    title: 'Daily standup',
    description: 'Team sync',
    startTime: now,
    endTime: later,
    location: 'Zoom',
    attendees: [],
    status: AppointmentStatus.SCHEDULED,
    createdAt: now,
    updatedAt: now,
    version: 1,
  }
}

describe('AgendaPanel', () => {
  it('calls onSelectAppointment when an agenda item is clicked', async () => {
    const appointment = buildAppointment()
    const onSelectAppointment = vi.fn()

    render(
      <AgendaPanel
        selectedDate={new Date('2026-02-13T00:00:00Z')}
        appointments={[appointment]}
        loading={false}
        error={null}
        onAdd={vi.fn()}
        onSelectAppointment={onSelectAppointment}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /daily standup/i }))

    expect(onSelectAppointment).toHaveBeenCalledTimes(1)
    expect(onSelectAppointment).toHaveBeenCalledWith(appointment)
  })
})
