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
  it('renders occupied slots as disabled cards', async () => {
    const appointment = buildAppointment()
    const onSelectAppointment = vi.fn()

    render(
      <AgendaPanel
        selectedDate={new Date('2026-02-13T00:00:00Z')}
        appointments={[appointment]}
        loading={false}
        error={null}
        onAdd={vi.fn()}
        onSelectTimeSlot={vi.fn()}
        onSelectAppointment={onSelectAppointment}
      />,
    )

    const occupiedSlotButton = screen.getByRole('button', { name: /daily standup/i })
    expect(occupiedSlotButton).toBeDisabled()
    await userEvent.click(occupiedSlotButton)

    expect(onSelectAppointment).not.toHaveBeenCalled()
  })

  it('calls onSelectTimeSlot when an available slot is clicked', async () => {
    const onSelectTimeSlot = vi.fn()

    render(
      <AgendaPanel
        selectedDate={new Date('2099-02-13T00:00:00Z')}
        appointments={[]}
        loading={false}
        error={null}
        onAdd={vi.fn()}
        onSelectTimeSlot={onSelectTimeSlot}
        onSelectAppointment={vi.fn()}
      />,
    )

    const availableButtons = screen.getAllByRole('button', {
      name: /available - click to add appointment/i,
    })
    await userEvent.click(availableButtons[0])

    expect(onSelectTimeSlot).toHaveBeenCalledTimes(1)
  })
})
