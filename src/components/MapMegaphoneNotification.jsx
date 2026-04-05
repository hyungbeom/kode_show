import './MapMegaphoneNotification.css'

/** 알림 개수(추후 스토어·API 연동) — 모달 배지와 동일하게 유지 */
export const MAP_NOTIFICATION_BADGE_COUNT = 1

function MegaphoneIcon() {
  return (
    <svg
      className="map-megaphone-notification__icon"
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

/**
 * 맵 화면 왼쪽 하단 알림(확성기) 버튼 — 참고 UI: 짙은 회색 원 + 흰 확성기 + 빨간 배지
 */
export default function MapMegaphoneNotification({ onOpen }) {
  const count = MAP_NOTIFICATION_BADGE_COUNT

  return (
    <button
      type="button"
      className="map-megaphone-notification"
      aria-label={count > 0 ? `알림 ${count}건` : '알림'}
      onClick={() => onOpen?.()}
    >
      <span className="map-megaphone-notification__inner">
        <MegaphoneIcon />
        {count > 0 ? (
          <span className="map-megaphone-notification__badge">{count > 9 ? '9+' : count}</span>
        ) : null}
      </span>
    </button>
  )
}
