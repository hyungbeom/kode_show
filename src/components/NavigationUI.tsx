import { useCallback, memo } from 'react'
import { useNavigationStore } from '../hooks/useMapStore'
import './NavigationUI.css'

/**
 * 네비게이션 UI 컴포넌트 (최적화 버전)
 * 화면 하단 중앙에 "NAVIGATE" 텍스트 표시
 * 클릭 시 맵 전체가 보이도록 줌 아웃
 */
const NavigationUI = memo(function NavigationUI() {
  const {
    setResetToFullMap,
    clearSelectedZone,
    clearSelectedCompany,
    closeFullscreenCanvas,
    clearCameraTarget,
  } = useNavigationStore()
  
  const handleClick = useCallback(() => {
    console.log('NavigationUI clicked - resetting to full map')
    
    // 열려있는 모든 모달 닫기
    clearSelectedZone() // ZoneInfoPanel 닫기
    clearSelectedCompany() // 업체 선택 해제
    closeFullscreenCanvas() // 전체 화면 모드 닫기
    clearCameraTarget() // 카메라 타겟 초기화
    
    // 맵 전체 보기 모드 활성화
    setResetToFullMap(true)
  }, [setResetToFullMap, clearSelectedZone, clearSelectedCompany, closeFullscreenCanvas, clearCameraTarget])
  
  return (
    <div className="navigation-ui" onClick={handleClick}>
      <div className="navigate-text">NAVIGATE</div>
    </div>
  )
})

NavigationUI.displayName = 'NavigationUI'

export default NavigationUI
