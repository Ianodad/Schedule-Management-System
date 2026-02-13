import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import type { Appointment } from '@/types/appointment';
import './CalendarGrid.css';

interface CalendarGridProps {
  date: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

function CalendarGrid({ date, appointments, onAppointmentClick }: CalendarGridProps): JSX.Element {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.startTime), day));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-grid">
      <div className="calendar-grid-header">
        {weekDays.map((day) => (
          <div key={day} className="calendar-grid-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid-body">
        {days.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, date);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`calendar-grid-day ${!isCurrentMonth ? 'other-month' : ''} ${
                isTodayDate ? 'today' : ''
              }`}
            >
              <div className="calendar-grid-day-number">{format(day, 'd')}</div>

              <div className="calendar-grid-appointments">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="calendar-grid-appointment"
                    onClick={() => onAppointmentClick?.(apt)}
                    title={`${apt.title}\n${format(new Date(apt.startTime), 'h:mm a')} - ${format(new Date(apt.endTime), 'h:mm a')}`}
                  >
                    <span className="calendar-grid-appointment-time">
                      {format(new Date(apt.startTime), 'h:mm a')}
                    </span>
                    <span className="calendar-grid-appointment-title">{apt.title}</span>
                  </div>
                ))}

                {dayAppointments.length > 3 && (
                  <div className="calendar-grid-more">+{dayAppointments.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarGrid;
