import { useMapStore } from '../store/useMapStore'
import './NavigationUI.css'

/**
 * 네비게이션 UI 컴포넌트
 * 화면 하단 중앙에 Navigate 아이콘(SVG) 표시
 * 클릭 시 인트로 없이 카메라·구도만 기본 위치로 복귀
 */
export default function NavigationUI() {
  const setResetToFullMap = useMapStore((state) => state.setResetToFullMap)
  const resetMapToInitialInteractionState = useMapStore(
    (state) => state.resetMapToInitialInteractionState,
  )

  const handleClick = () => {
    // 존/마커/추적 등만 초기화 — 인트로(mapHeroCopyDismissed)는 유지
    resetMapToInitialInteractionState()
    setResetToFullMap(true)
  }
  
  const marqueeSegment = (
    <>
      <span className="navigation-ui__dot" aria-hidden />
      <span className="navigation-ui__marquee-text">수자원공사 미래아리수</span>
      <span className="navigation-ui__sep">·</span>
      <span className="navigation-ui__marquee-text">컨퍼런스룸 302호</span>
      <span className="navigation-ui__sep">·</span>
      <span className="navigation-ui__marquee-text">15:30 ~ 18:00</span>
      <span className="navigation-ui__sep">·</span>
    </>
  )

  return (
    <div
      className="navigation-ui"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Navigate — 맵 전체 보기로 초기화"
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="navigation-ui__desktop">
        <div className="navigate-text">
          <img
            src="/navigate.svg"
            alt=""
            className="navigate-text__img"
            width={232}
            height={78}
            decoding="async"
            aria-hidden
          />
        </div>
      </div>

      <div className="navigation-ui__ticker" aria-hidden>
        <div className="navigation-ui__marquee-track">
          <div className="navigation-ui__marquee-group">{marqueeSegment}</div>
          {/*<div className="navigation-ui__marquee-group">{marqueeSegment}</div>*/}
        </div>
      </div>
    </div>
  )
}
