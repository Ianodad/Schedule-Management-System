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
  onSelectTimeSlot: (start: Date, end: Date) => void
  onSelectAppointment: (appointment: Appointment) => void
}

interface SlotMeta {
  start: Date
  end: Date
  appointment: Appointment | null
  isPast: boolean
}

interface SlotBlock {
  key: string
  start: Date
  end: Date
  span: number
  appointment: Appointment | null
  isPast: boolean
}

const SLOT_DURATION_MINUTES = 60
const DAY_START_HOUR = 0
const DAY_END_HOUR = 24

function AgendaPanel({
  selectedDate,
  appointments,
  loading,
  error,
  onAdd,
  onSelectTimeSlot,
  onSelectAppointment,
}: AgendaPanelProps) {
  const dayStart = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    0,
    0,
    0,
    0,
  )
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const now = new Date()
  const slotCount = DAY_END_HOUR - DAY_START_HOUR
  const dayAppointments = appointments.filter((item) => {
    const apptStart = toDate(item.startTime)
    const apptEnd = toDate(item.endTime)
    return apptStart < dayEnd && apptEnd > dayStart
  })

  const slots: SlotMeta[] = []
  for (let i = 0; i < slotCount; i += 1) {
    const start = new Date(dayStart)
    start.setHours(DAY_START_HOUR + i, 0, 0, 0)

    const end = new Date(start)
    end.setMinutes(end.getMinutes() + SLOT_DURATION_MINUTES)

    const appointment =
      dayAppointments.find((item) => {
        const apptStart = toDate(item.startTime)
        const apptEnd = toDate(item.endTime)
        return apptStart < end && apptEnd > start
      }) ?? null

    slots.push({
      start,
      end,
      appointment,
      isPast: end <= now,
    })
  }

  const slotBlocks: SlotBlock[] = []
  for (const slot of slots) {
    const previous = slotBlocks[slotBlocks.length - 1]
    const canMergeWithPrevious =
      Boolean(slot.appointment) &&
      Boolean(previous?.appointment) &&
      previous.appointment?.id === slot.appointment?.id

    if (canMergeWithPrevious && previous) {
      previous.end = slot.end
      previous.span += 1
      continue
    }

    slotBlocks.push({
      key: `${slot.start.toISOString()}-${slot.appointment?.id ?? 'empty'}`,
      start: slot.start,
      end: slot.end,
      span: 1,
      appointment: slot.appointment,
      isPast: slot.isPast,
    })
  }

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

      <div className="agenda-list agenda-timeline">
        {slotBlocks.map((slot) => {
          const appointment = slot.appointment
          if (appointment) {
            const appointmentStart = toDate(appointment.startTime)
            const appointmentEnd = toDate(appointment.endTime)

            return (
              <button
                key={slot.key}
                className="agenda-item occupied-slot"
                style={{ minHeight: `${slot.span * 74}px` }}
                onClick={() => onSelectAppointment(appointment)}
                disabled
              >
                <p className="slot-time">
                  {formatTimeRange(appointmentStart, appointmentEnd)}
                </p>
                <h3>{appointment.title}</h3>
                {appointment.location ? <p>{appointment.location}</p> : null}
              </button>
            )
          }

          return (
            <button
              key={slot.key}
              className={[
                'agenda-item',
                'empty-slot',
                slot.isPast ? 'past-slot' : 'open-slot',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectTimeSlot(slot.start, slot.end)}
              disabled={slot.isPast}
            >
              <p className="slot-time">{formatTimeRange(slot.start, slot.end)}</p>
              <p>{slot.isPast ? 'Time passed' : 'Available - click to add appointment'}</p>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default AgendaPanel
