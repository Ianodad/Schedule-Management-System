import type { Appointment } from '../../types/appointment'
import Modal from '../common/Modal'
import {
  formatTimeRange,
  toDate,
} from './schedulerUtils'

interface DetailModalProps {
  appointment: Appointment | null
  loading: boolean
  onClose: () => void
  onEdit: (appointment: Appointment) => void
  onDelete: () => Promise<void>
}

function DetailModal({
  appointment,
  loading,
  onClose,
  onEdit,
  onDelete,
}: DetailModalProps) {
  return (
    <Modal
      isOpen={Boolean(appointment)}
      onClose={onClose}
      title={appointment?.title || 'Appointment Details'}
    >
      {appointment ? (
        <div className="details-content">
          <p>
            <strong>When:</strong>{' '}
            {formatTimeRange(
              toDate(appointment.startTime),
              toDate(appointment.endTime),
            )}
          </p>
          <p>
            <strong>Date:</strong> {toDate(appointment.startTime).toLocaleDateString()}
          </p>
          {appointment.location ? (
            <p>
              <strong>Location:</strong> {appointment.location}
            </p>
          ) : null}
          {appointment.description ? (
            <p>
              <strong>Description:</strong> {appointment.description}
            </p>
          ) : null}
          {appointment.attendees?.length ? (
            <p>
              <strong>Attendees:</strong> {appointment.attendees.join(', ')}
            </p>
          ) : null}

          <div className="modal-actions">
            <button
              className="ghost-btn"
              onClick={() => onEdit(appointment)}
              disabled={loading}
            >
              Edit Appointment
            </button>
            <button className="danger-btn" onClick={() => void onDelete()} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Appointment'}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export default DetailModal
