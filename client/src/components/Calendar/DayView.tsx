import { format, isSameDay } from 'date-fns';
import type { Appointment } from '@/types/appointment';
import './DayView.css';

interface DayViewProps {
  date: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

function DayView({ date, appointments, onAppointmentClick }: DayViewProps): JSX.Element {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayAppointments = appointments.filter((apt) =>
    isSameDay(new Date(apt.startTime), date)
  );

  const getAppointmentPosition = (apt: Appointment) => {
    const start = new Date(apt.startTime);
    const end = new Date(apt.endTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    return {
      top: `${startHour * 60}px`,
      height: `${duration * 60}px`,
    };
  };

  return (
    <div className="day-view">
      <div className="day-view-times">
        {hours.map((hour) => (
          <div key={hour} className="day-view-hour-label">
            {format(new Date().setHours(hour, 0), 'h a')}
          </div>
        ))}
      </div>

      <div className="day-view-column">
        <div className="day-view-grid">
          {hours.map((hour) => (
            <div key={hour} className="day-view-hour-slot" />
          ))}
        </div>

        <div className="day-view-appointments">
          {dayAppointments.map((apt) => (
            <div
              key={apt.id}
              className="day-view-appointment"
              style={getAppointmentPosition(apt)}
              onClick={() => onAppointmentClick?.(apt)}
            >
              <div className="day-view-appointment-time">
                {format(new Date(apt.startTime), 'h:mm a')}
              </div>
              <div className="day-view-appointment-title">{apt.title}</div>
              {apt.location && (
                <div className="day-view-appointment-location">📍 {apt.location}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DayView;
