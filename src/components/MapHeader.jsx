import './MapHeader.css'

/**
 * 지도 화면 상단 헤더 — ENVEX 로고 + 닫기
 */
export default function MapHeader({ onClose }) {
  return (
    <div className="map-header">
      <div className="map-header-spacer" aria-hidden />
      <div className="header-logo">
        <a href="#" className="logo-link">
          ENVEX
        </a>
      </div>
      
      {/* 오른쪽: 닫기 버튼 */}
      <button className="close-button" onClick={onClose} aria-label="Close map">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
