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
  
  return (
    <div
      className="navigation-ui"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="navigate-text">
        <img
          src="/navigate.svg"
          alt="Navigate"
          className="navigate-text__img"
          width={232}
          height={78}
          decoding="async"
        />
      </div>
    </div>
  )
}
