import type { Appointment } from '../../types/appointment'
import {
  formatMonthLabel,
  toDate,
  toDayKey,
} from './schedulerUtils'

interface CalendarPanelProps {
  currentMonth: Date
  selectedDate: Date
  today: Date
  appointmentsByDay: Map<string, Appointment[]>
  onSelectDate: (day: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarPanel({
  currentMonth,
  selectedDate,
  today,
  appointmentsByDay,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarPanelProps) {
  const selectedDayKey = toDayKey(selectedDate)
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const monthDays: Date[] = []
  const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

  const gridEnd = new Date(lastOfMonth)
  gridEnd.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()))

  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    monthDays.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return (
    <section className="calendar-panel">
      <div className="calendar-toolbar">
        <button className="ghost-btn" onClick={onPrevMonth}>
          Prev
        </button>
        <h2>{formatMonthLabel(currentMonth)}</h2>
        <button className="ghost-btn" onClick={onNextMonth}>
          Next
        </button>
      </div>

      <div className="calendar-grid calendar-weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="weekday-cell">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid calendar-days">
        {monthDays.map((day) => {
          const dayKey = toDayKey(day)
          const dayAppointments = appointmentsByDay.get(dayKey) ?? []
          const isOutsideMonth = day.getMonth() !== currentMonth.getMonth()
          const isSelected = dayKey === selectedDayKey
          const isToday = dayKey === toDayKey(today)
          const isPastDay = day < todayStart

          return (
            <button
              key={dayKey}
              className={[
                'day-cell',
                isOutsideMonth ? 'outside-month' : '',
                isSelected ? 'selected-day' : '',
                isToday ? 'today' : '',
                isPastDay ? 'past-day' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(day)}
              disabled={isPastDay}
              aria-disabled={isPastDay}
            >
              <div className="day-number">{day.getDate()}</div>
              {dayAppointments.slice(0, 2).map((appointment) => (
                <div key={appointment.id} className="day-pill">
                  {toDate(appointment.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  {appointment.title}
                </div>
              ))}
              {dayAppointments.length > 2 ? (
                <div className="day-pill muted">+{dayAppointments.length - 2} more</div>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default CalendarPanel
