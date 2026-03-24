import { useMapStore } from '../store/useMapStore'
import './NavigationUI.css'

/**
 * 네비게이션 UI 컴포넌트
 * 화면 하단 중앙에 "NAVIGATE" 텍스트 표시
 * 클릭 시 맵 전체가 보이도록 줌 아웃
 */
export default function NavigationUI() {
  const setResetToFullMap = useMapStore((state) => state.setResetToFullMap)
  const clearSelectedZone = useMapStore((state) => state.clearSelectedZone)
  const clearSelectedCompany = useMapStore((state) => state.clearSelectedCompany)
  const closeFullscreenCanvas = useMapStore((state) => state.closeFullscreenCanvas)
  const clearCameraTarget = useMapStore((state) => state.clearCameraTarget)
  
  const handleClick = () => {
    console.log('NavigationUI clicked - resetting to full map')
    
    // 열려있는 모든 모달 닫기
    clearSelectedZone() // ZoneInfoPanel 닫기
    clearSelectedCompany() // 업체 선택 해제
    closeFullscreenCanvas() // 전체 화면 모드 닫기
    clearCameraTarget() // 카메라 타겟 초기화
    
    // 맵 전체 보기 모드 활성화
    setResetToFullMap(true)
  }
  
  return (
    <div className="navigation-ui" onClick={handleClick}>
      <div className="navigate-text">NAVIGATE</div>
    </div>
  )
}
