import { format, addDays, isSameDay } from 'date-fns';
import type { Appointment } from '@/types/appointment';
import './WeekView.css';

interface WeekViewProps {
  date: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

function WeekView({ date, appointments, onAppointmentClick }: WeekViewProps): JSX.Element {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get start of week (Sunday)
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.startTime), day));
  };

  const getAppointmentPosition = (apt: Appointment) => {
    const start = new Date(apt.startTime);
    const end = new Date(apt.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return {
      top: `${startHour * 60}px`,
      height: `${Math.max(duration * 60, 20)}px`,
    };
  };

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="week-view">
      <div className="week-view-header">
        <div className="week-view-corner" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`week-view-day-header ${isToday(day) ? 'today' : ''}`}
          >
            <div className="week-view-day-name">{format(day, 'EEE')}</div>
            <div className="week-view-day-number">{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      <div className="week-view-body">
        <div className="week-view-times">
          {hours.map((hour) => (
            <div key={hour} className="week-view-hour-label">
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
          ))}
        </div>

        {weekDays.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);

          return (
            <div key={day.toISOString()} className="week-view-day-column">
              <div className="week-view-grid">
                {hours.map((hour) => (
                  <div key={hour} className="week-view-hour-slot" />
                ))}
              </div>

              <div className="week-view-appointments">
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="week-view-appointment"
                    style={getAppointmentPosition(apt)}
                    onClick={() => onAppointmentClick?.(apt)}
                    title={`${apt.title}\n${format(new Date(apt.startTime), 'h:mm a')} - ${format(new Date(apt.endTime), 'h:mm a')}`}
                  >
                    <div className="week-view-appointment-time">
                      {format(new Date(apt.startTime), 'h:mm a')}
                    </div>
                    <div className="week-view-appointment-title">{apt.title}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeekView;
