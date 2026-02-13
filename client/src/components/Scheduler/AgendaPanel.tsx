import type { Appointment } from '../../types/appointment'
import {
  formatTimeRange,
  toDate,
} from './schedulerUtils'

interface AgendaPanelProps {
  selectedDate: Date
  appointments: Appointment[]
  loading: boolean
  error: string | null
  onAdd: () => void
  onSelectAppointment: (appointment: Appointment) => void
}

function AgendaPanel({
  selectedDate,
  appointments,
  loading,
  error,
  onAdd,
  onSelectAppointment,
}: AgendaPanelProps) {
  return (
    <aside className="agenda-panel">
      <div className="agenda-header">
        <h2>
          Agenda:{' '}
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </h2>
        <button className="ghost-btn" onClick={onAdd}>
          Add
        </button>
      </div>

      {loading ? <p className="status-text">Loading appointments...</p> : null}
      {error ? <p className="status-text error-text">{error}</p> : null}

      {!loading && appointments.length === 0 ? (
        <p className="status-text">No appointments on this day.</p>
      ) : null}

      <div className="agenda-list">
        {appointments.map((appointment) => {
          const start = toDate(appointment.startTime)
          const end = toDate(appointment.endTime)

          return (
            <button
              key={appointment.id}
              className="agenda-item"
              onClick={() => onSelectAppointment(appointment)}
            >
              <h3>{appointment.title}</h3>
              <p>{formatTimeRange(start, end)}</p>
              {appointment.location ? <p>{appointment.location}</p> : null}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default AgendaPanel
