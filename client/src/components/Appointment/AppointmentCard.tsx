import type { Appointment } from '@/types/appointment'

interface AppointmentCardProps {
  appointment: Appointment
}

function AppointmentCard({ appointment }: AppointmentCardProps): JSX.Element {
  return (
    <article>
      <h3>{appointment.title}</h3>
      <p>{appointment.startTime}</p>
      <p>{appointment.endTime}</p>
    </article>
  )
}

export default AppointmentCard
