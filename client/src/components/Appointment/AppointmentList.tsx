import type { Appointment } from '@/types/appointment';
import AppointmentCard from './AppointmentCard';
import './AppointmentList.css';

interface AppointmentListProps {
  appointments?: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
}

function AppointmentList({
  appointments = [],
  onEdit,
  onDelete,
}: AppointmentListProps): JSX.Element {
  if (appointments.length === 0) {
    return (
      <div className="appointment-list-empty">
        <p>No appointments scheduled.</p>
      </div>
    );
  }

  return (
    <div className="appointment-list">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default AppointmentList;
