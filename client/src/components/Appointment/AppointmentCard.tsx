import { format } from 'date-fns';
import Button from '@/components/common/Button';
import type { Appointment, AppointmentStatus } from '@/types/appointment';
import './AppointmentCard.css';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
}

const getStatusLabel = (status: AppointmentStatus): string => {
  switch (status) {
    case 1:
      return 'Scheduled';
    case 2:
      return 'Cancelled';
    case 3:
      return 'Completed';
    default:
      return 'Unknown';
  }
};

const getStatusClass = (status: AppointmentStatus): string => {
  switch (status) {
    case 1:
      return 'status-scheduled';
    case 2:
      return 'status-cancelled';
    case 3:
      return 'status-completed';
    default:
      return '';
  }
};

function AppointmentCard({ appointment, onEdit, onDelete }: AppointmentCardProps): JSX.Element {
  return (
    <article className="appointment-card">
      <div className="appointment-card-header">
        <h3 className="appointment-card-title">{appointment.title}</h3>
        <span className={`appointment-card-status ${getStatusClass(appointment.status)}`}>
          {getStatusLabel(appointment.status)}
        </span>
      </div>

      <div className="appointment-card-body">
        <div className="appointment-card-time">
          <span className="appointment-card-icon">🕒</span>
          {format(new Date(appointment.startTime), 'MMM d, yyyy h:mm a')} -{' '}
          {format(new Date(appointment.endTime), 'h:mm a')}
        </div>

        {appointment.location && (
          <div className="appointment-card-location">
            <span className="appointment-card-icon">📍</span>
            {appointment.location}
          </div>
        )}

        {appointment.description && (
          <p className="appointment-card-description">{appointment.description}</p>
        )}

        {appointment.attendees && appointment.attendees.length > 0 && (
          <div className="appointment-card-attendees">
            <span className="appointment-card-icon">👥</span>
            {appointment.attendees.join(', ')}
          </div>
        )}

        {appointment.recurrence && (
          <div className="appointment-card-recurrence">
            <span className="appointment-card-icon">🔄</span>
            Recurring appointment
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="appointment-card-actions">
          {onEdit && (
            <Button onClick={() => onEdit(appointment)} className="btn-edit">
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={() => {
                if (confirm('Are you sure you want to delete this appointment?')) {
                  onDelete(appointment.id);
                }
              }}
              className="btn-delete"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export default AppointmentCard;
