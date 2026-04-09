import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './ProductImageViewerModal.css'

export type ProductImageViewerModalProps = {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  title?: string | null
  imageAlt?: string
}

export function ProductImageViewerModal({
  open,
  imageSrc,
  onClose,
  title = null,
  imageAlt = '',
}: ProductImageViewerModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !imageSrc) return null

  const titleTrimmed = typeof title === 'string' ? title.trim() : ''
  const ariaLabel = titleTrimmed.length > 0 ? `${titleTrimmed} 이미지` : '제품 이미지'

  return createPortal(
    <div
      className="product-image-viewer-modal"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {titleTrimmed.length > 0 ? (
        <p className="product-image-viewer-modal__title">{titleTrimmed}</p>
      ) : null}
      <button
        type="button"
        className="product-image-viewer-modal__close"
        onClick={onClose}
        aria-label="이미지 닫기"
      >
        닫기
      </button>
      <div className="product-image-viewer-modal__backdrop" aria-hidden />
      <div className="product-image-viewer-modal__stage">
        <img
          src={imageSrc}
          alt={imageAlt || (titleTrimmed ? `${titleTrimmed} 대표 이미지` : '제품 이미지')}
          className="product-image-viewer-modal__img"
          draggable={false}
        />
      </div>
      <p className="product-image-viewer-modal__hint">ESC 또는 닫기로 나가기</p>
    </div>,
    document.body,
  )
}
