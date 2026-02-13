import { PropsWithChildren } from 'react'

interface ModalProps extends PropsWithChildren {
  isOpen: boolean
  onClose: () => void
  title?: string
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          {title ? <h2>{title}</h2> : null}
          <button className="ghost-btn" onClick={onClose} aria-label="Close modal">
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
