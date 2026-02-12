import type { PropsWithChildren } from 'react'

interface ModalProps extends PropsWithChildren {
  isOpen: boolean
  onClose: () => void
  title?: string
}

function Modal({ isOpen, onClose, title, children }: ModalProps): JSX.Element | null {
  if (!isOpen) {
    return null
  }

  return (
    <div role="dialog" aria-modal="true">
      <div>
        {title ? <h2>{title}</h2> : null}
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
      </div>
      <div>{children}</div>
    </div>
  )
}

export default Modal
