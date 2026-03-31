import './RoomCarouselIntro.css'

/**
 * /room/1 캐러셀 최초 진입 시 — 투명 배경 영역 + 왼쪽 상단 카피 + EXPLORER
 */
export default function RoomCarouselIntro({ onExplore }) {
  return (
    <div className="room-carousel-intro">
      <h2 className="room-carousel-intro__title">프로지스트 회사</h2>
      <p className="room-carousel-intro__desc">
        저희 프로지스트는 2년차 webgl 회사이며 앞으로도 성장을 멈추지 않습니다
      </p>
      <button type="button" className="room-carousel-intro__explorer" onClick={onExplore}>
        EXPLORER
      </button>
    </div>
  )
}
