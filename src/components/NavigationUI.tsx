import { useCallback, memo } from 'react'
import { useMapStore } from '../store/useMapStore'
import './NavigationUI.css'

/**
 * 네비게이션 UI 컴포넌트 (최적화 버전)
 * 화면 하단 중앙에 "NAVIGATE" 텍스트 표시
 * 클릭 시 최초 맵 진입과 동일한 뷰·상태로 복귀
 */
const NavigationUI = memo(function NavigationUI() {
  const setResetToFullMap = useMapStore((s) => s.setResetToFullMap)
  const resetMapToInitialInteractionState = useMapStore(
    (s) => s.resetMapToInitialInteractionState,
  )

  const handleClick = useCallback(() => {
    resetMapToInitialInteractionState()
    setResetToFullMap(true)
  }, [setResetToFullMap, resetMapToInitialInteractionState])
  
  return (
    <div className="navigation-ui" onClick={handleClick}>
      <div className="navigate-text">NAVIGATE</div>
    </div>
  )
})

NavigationUI.displayName = 'NavigationUI'

export default NavigationUI
