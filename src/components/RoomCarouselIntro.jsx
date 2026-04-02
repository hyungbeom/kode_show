import './RoomCarouselIntro.css'

const LEEBIO_HOMEPAGE_URL = 'https://leebio.co.kr/'

/**
 * /room/1 캐러셀 최초 진입 시 — 투명 배경 영역 + 왼쪽 상단 카피 + HOMEPAGE
 */
export default function RoomCarouselIntro({ onExplore }) {
  const handleHomepageClick = () => {
    window.open(LEEBIO_HOMEPAGE_URL, '_blank', 'noopener,noreferrer')
    onExplore?.()
  }

  return (
    <div className="room-carousel-intro">
      <h2 className="room-carousel-intro__title">LEEBIO</h2>
      <p className="room-carousel-intro__desc">
        LEEBIO는 체외진단 기술을 기반으로 수질 및 환경 분석 분야로 확장한 워터테크 기업입니다. 현장에서 즉시
        수질을 측정하고 데이터를 디지털로 관리할 수 있는 솔루션을 개발하여, 공공시설, 수영장, 스마트팜 등 반복적인
        수질 관리가 필요한 환경에서 활용되고 있습니다. 주요 제품인 AQUAL 시리즈는 광학 및 전기화학 센서를 기반으로
        다양한 수질 지표를 신속하게 측정하며, 운영자의 의사결정을 지원합니다. 당사는 2025년 대한민국 물산업
        혁신창업대전 장려상 및 2026년 CES 혁신상을 수상하며 기술력과 시장성을 인정받았습니다.
      </p>
      <button type="button" className="room-carousel-intro__explorer" onClick={handleHomepageClick}>
        HOMEPAGE
      </button>
    </div>
  )
}
