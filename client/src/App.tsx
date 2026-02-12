import Calendar from '@/components/Calendar/Calendar'
import AppointmentForm from '@/components/Appointment/AppointmentForm'
import AppointmentList from '@/components/Appointment/AppointmentList'
import { useAppointments } from '@/hooks/useAppointments'

function App(): JSX.Element {
  const { appointments, addAppointment } = useAppointments()

  return (
    <main>
      <h1>Schedule Management</h1>
      <AppointmentForm onSubmit={addAppointment} />
      <Calendar />
      <AppointmentList appointments={appointments} />
    </main>
  )
}

export default App
