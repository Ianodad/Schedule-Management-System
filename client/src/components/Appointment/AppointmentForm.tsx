import { useState } from 'react'
import type { Appointment } from '@/types/appointment'

interface AppointmentFormProps {
  onSubmit?: (appointment: Appointment) => void
}

function AppointmentForm({ onSubmit }: AppointmentFormProps): JSX.Element {
  const [title, setTitle] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.({
          id: crypto.randomUUID(),
          title,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })
        setTitle('')
      }}
    >
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Appointment title" />
      <button type="submit">Create</button>
    </form>
  )
}

export default AppointmentForm
