import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './MapNotificationModal.css'

function MegaphoneIconModal() {
  return (
    <svg
      className="map-notification-modal__icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path fill="currentColor" d="M5 10h2.5v6H5v-6z" />
      <path fill="currentColor" d="M8 9.2V16.8L18 20V4L8 9.2z" />
      <path
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        fill="none"
        d="M19.5 8.5v3M21 7v6M22.5 5.5v9"
      />
    </svg>
  )
}

export type MapNotificationModalProps = {
  open: boolean
  onClose: () => void
  /** 배지 숫자 (알림 버튼과 맞춤) */
  count?: number
}

/**
 * 맵 확성기 알림 — ENVEX 안내 모달 (블러 배경 + 카드)
 */
export function MapNotificationModal({ open, onClose, count = 1 }: MapNotificationModalProps) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onKeyDown])

  if (!open) return null

  const badge = count > 9 ? '9+' : String(count)

  return createPortal(
    <div
      className="map-notification-modal__backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="map-notification-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-notification-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="map-notification-modal__icon-wrap">
          <MegaphoneIconModal />
          {count > 0 ? (
            <span className="map-notification-modal__badge" aria-hidden>
              {badge}
            </span>
          ) : null}
        </div>
        <h2 id="map-notification-modal-title" className="map-notification-modal__title">
          ENVEX에서 알려드립니다~!
        </h2>
        <p className="map-notification-modal__body">
          3:30 분에 중앙 A-30 부스에서 수자원공사의
          <br />
          이벤트 행사가 있을 예정입니다 많은 참여 바랍니다
        </p>
        <button type="button" className="map-notification-modal__close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>,
    document.body,
  )
}
