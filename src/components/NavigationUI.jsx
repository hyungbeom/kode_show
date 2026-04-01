import { useMapStore } from '../store/useMapStore'
import './NavigationUI.css'

/**
 * 네비게이션 UI 컴포넌트
 * 화면 하단 중앙에 "NAVIGATE" 텍스트 표시
 * 클릭 시 맵 전체가 보이도록 줌 아웃
 */
export default function NavigationUI() {
  const setResetToFullMap = useMapStore((state) => state.setResetToFullMap)
  const resetMapToInitialInteractionState = useMapStore(
    (state) => state.resetMapToInitialInteractionState,
  )

  const handleClick = () => {
    // 최초 로딩 직후와 같은 스토어·배치 전제(Zone/추적/팬딩 등 제거)
    resetMapToInitialInteractionState()
    setResetToFullMap(true)
  }
  
  return (
    <div className="navigation-ui" onClick={handleClick}>
      <div className="navigate-text">NAVIGATE</div>
    </div>
  )
}
