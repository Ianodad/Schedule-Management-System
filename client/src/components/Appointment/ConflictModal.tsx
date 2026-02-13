import { format } from 'date-fns';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import type { ConflictInfo } from '@/types/appointment';
import './ConflictModal.css';

interface ConflictModalProps {
  conflicts: ConflictInfo;
  onOverride: () => void;
  onCancel: () => void;
}

function ConflictModal({ conflicts, onOverride, onCancel }: ConflictModalProps): JSX.Element {
  return (
    <Modal isOpen={true} onClose={onCancel} title="Scheduling Conflict">
      <div className="conflict-modal-content">
        <p className="conflict-message">{conflicts.message || 'This appointment conflicts with existing appointments:'}</p>

        <div className="conflict-list">
          {conflicts.conflictingAppointments.map((apt) => (
            <div key={apt.id} className="conflict-item">
              <h4>{apt.title}</h4>
              <div className="conflict-details">
                <span className="conflict-time">
                  {format(new Date(apt.startTime), 'MMM d, yyyy h:mm a')} -{' '}
                  {format(new Date(apt.endTime), 'h:mm a')}
                </span>
                {apt.location && <span className="conflict-location">📍 {apt.location}</span>}
              </div>
              {apt.description && <p className="conflict-description">{apt.description}</p>}
            </div>
          ))}
        </div>

        <div className="conflict-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onOverride} className="btn-warning">
            Book Anyway
          </Button>
        </div>

        <p className="conflict-warning">
          ⚠️ Booking anyway may result in scheduling conflicts
        </p>
      </div>
    </Modal>
  );
}

export default ConflictModal;
