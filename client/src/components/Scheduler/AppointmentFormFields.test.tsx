import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AppointmentFormState } from './formTypes'
import AppointmentFormFields from './AppointmentFormFields'

function createFormState(
  recurrence: AppointmentFormState['recurrence'] = 'none',
): AppointmentFormState {
  return {
    title: 'Review',
    description: '',
    date: '2026-02-13',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    attendees: '',
    recurrence,
    recurrenceInterval: '1',
  }
}

describe('AppointmentFormFields', () => {
  it('disables interval input when repeat is none', () => {
    render(
      <AppointmentFormFields
        formState={createFormState('none')}
        onChange={vi.fn()}
      />,
    )

    const intervalInput = screen.getByRole('spinbutton')
    expect(intervalInput).toBeDisabled()
  })

  it('emits changed recurrence value', async () => {
    const onChange = vi.fn()

    render(
      <AppointmentFormFields
        formState={createFormState('none')}
        onChange={onChange}
      />,
    )

    await userEvent.selectOptions(screen.getByRole('combobox'), 'weekly')

    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)?.[0].recurrence).toBe('weekly')
  })
})
