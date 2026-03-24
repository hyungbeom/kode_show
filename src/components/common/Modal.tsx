import { memo, ReactNode, useEffect, useRef } from 'react'
import { useFadeAnimation } from '../../hooks/useFadeAnimation'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  overlayClassName?: string
  closeOnOverlayClick?: boolean
}

/**
 * 재사용 가능한 Modal 컴포넌트
 */
const Modal = memo(function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  closeOnOverlayClick = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useFadeAnimation(overlayRef, isOpen, {
    duration: 0.3,
  })

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.style.display = 'block'
    } else if (!isOpen && modalRef.current) {
      modalRef.current.style.display = 'none'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay ${overlayClassName}`}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        ref={modalRef}
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
})

Modal.displayName = 'Modal'

export default Modal
