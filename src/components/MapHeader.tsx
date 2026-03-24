import './MapHeader.css'

interface MapHeaderProps {
  onClose: () => void
  onBackToClub: () => void
}

/**
 * 지도 화면 상단 헤더 컴포넌트
 * KODE 로고와 닫기 버튼을 포함합니다.
 */
export default function MapHeader({ onClose, onBackToClub }: MapHeaderProps) {
  return (
    <div className="map-header">
      {/* 왼쪽: Back to the Club 버튼 */}
      <button className="back-button" onClick={onBackToClub}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L2 10L10 18M2 10H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Back to the Club</span>
      </button>
      
      {/* 중앙: KODE 로고 */}
      <div className="header-logo">
        <a href="#" className="logo-link">Kode</a>
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
