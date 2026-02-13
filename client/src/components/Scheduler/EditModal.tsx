import Modal from '../common/Modal'
import type { AppointmentFormState } from './formTypes'
import AppointmentFormFields from './AppointmentFormFields'
import ConflictFeedback from './ConflictFeedback'
import type { ConflictInfo } from '../../types/appointment'

interface EditModalProps {
  isOpen: boolean
  formState: AppointmentFormState
  onChange: (next: AppointmentFormState) => void
  submitting: boolean
  error: string | null
  conflicts: ConflictInfo | null
  onClose: () => void
  onSubmit: () => Promise<void>
}

function EditModal({
  isOpen,
  formState,
  onChange,
  submitting,
  error,
  conflicts,
  onClose,
  onSubmit,
}: EditModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Appointment">
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit()
        }}
      >
        <AppointmentFormFields formState={formState} onChange={onChange} />
        {error ? <p className="error-text">{error}</p> : null}
        <ConflictFeedback conflicts={conflicts} />
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? 'Saving...' : 'Update Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditModal
