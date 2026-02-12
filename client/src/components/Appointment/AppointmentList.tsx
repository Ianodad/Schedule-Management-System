import type { Appointment } from '@/types/appointment'
import AppointmentCard from './AppointmentCard'

interface AppointmentListProps {
  appointments?: Appointment[]
}

function AppointmentList({ appointments = [] }: AppointmentListProps): JSX.Element {
  if (appointments.length === 0) {
    return <p>No appointments yet.</p>
  }

  return (
    <div>
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  )
}

export default AppointmentList
