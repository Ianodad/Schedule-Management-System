import Modal from '@/components/common/Modal'

interface ConflictModalProps {
  isOpen: boolean
  message: string
  onClose: () => void
}

function ConflictModal({ isOpen, message, onClose }: ConflictModalProps): JSX.Element {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scheduling conflict">
      <p>{message}</p>
    </Modal>
  )
}

export default ConflictModal
