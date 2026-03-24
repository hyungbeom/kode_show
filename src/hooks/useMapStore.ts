import { useMapStore as useBaseMapStore } from '../store/useMapStore'
import { useMemo } from 'react'

/**
 * 최적화된 Zustand 셀렉터 훅들
 * 각 값을 개별적으로 선택하고 useMemo로 그룹화하여 안정적인 참조 유지
 * shallow 비교 문제를 피하기 위해 이 방식을 사용합니다.
 */

// App 컴포넌트용 셀렉터
export function useAppMapStore() {
  const setInitialEntry = useBaseMapStore((state) => state.setInitialEntry)
  const selectedCompanyId = useBaseMapStore((state) => state.selectedCompanyId)
  const selectedCompanyName = useBaseMapStore((state) => state.selectedCompanyName)
  const setSelectedCompany = useBaseMapStore((state) => state.setSelectedCompany)
  const clearSelectedCompany = useBaseMapStore((state) => state.clearSelectedCompany)
  const selectedZone = useBaseMapStore((state) => state.selectedZone)
  const clearSelectedZone = useBaseMapStore((state) => state.clearSelectedZone)

  return useMemo(
    () => ({
      setInitialEntry,
      selectedCompanyId,
      selectedCompanyName,
      setSelectedCompany,
      clearSelectedCompany,
      selectedZone,
      clearSelectedZone,
    }),
    [
      setInitialEntry,
      selectedCompanyId,
      selectedCompanyName,
      setSelectedCompany,
      clearSelectedCompany,
      selectedZone,
      clearSelectedZone,
    ]
  )
}

// Zone 관련 셀렉터
export function useZoneStore() {
  const selectedZone = useBaseMapStore((state) => state.selectedZone)
  const setSelectedZone = useBaseMapStore((state) => state.setSelectedZone)
  const clearSelectedZone = useBaseMapStore((state) => state.clearSelectedZone)
  const isMarkerClick = useBaseMapStore((state) => state.isMarkerClick)
  const closeFullscreenCanvas = useBaseMapStore((state) => state.closeFullscreenCanvas)

  return useMemo(
    () => ({
      selectedZone,
      setSelectedZone,
      clearSelectedZone,
      isMarkerClick,
      closeFullscreenCanvas,
    }),
    [selectedZone, setSelectedZone, clearSelectedZone, isMarkerClick, closeFullscreenCanvas]
  )
}

// 카메라 관련 셀렉터
export function useCameraStore() {
  const cameraTarget = useBaseMapStore((state) => state.cameraTarget)
  const setCameraTarget = useBaseMapStore((state) => state.setCameraTarget)
  const clearCameraTarget = useBaseMapStore((state) => state.clearCameraTarget)
  const resetToFullMap = useBaseMapStore((state) => state.resetToFullMap)
  const setResetToFullMap = useBaseMapStore((state) => state.setResetToFullMap)
  const isFullMapRotating = useBaseMapStore((state) => state.isFullMapRotating)
  const setIsFullMapRotating = useBaseMapStore((state) => state.setIsFullMapRotating)

  return useMemo(
    () => ({
      cameraTarget,
      setCameraTarget,
      clearCameraTarget,
      resetToFullMap,
      setResetToFullMap,
      isFullMapRotating,
      setIsFullMapRotating,
    }),
    [
      cameraTarget,
      setCameraTarget,
      clearCameraTarget,
      resetToFullMap,
      setResetToFullMap,
      isFullMapRotating,
      setIsFullMapRotating,
    ]
  )
}

// 마커 관련 셀렉터
export function useMarkerStore() {
  const markersVisible = useBaseMapStore((state) => state.markersVisible)
  const setMarkersVisible = useBaseMapStore((state) => state.setMarkersVisible)

  return useMemo(
    () => ({
      markersVisible,
      setMarkersVisible,
    }),
    [markersVisible, setMarkersVisible]
  )
}

// 네비게이션 관련 셀렉터
export function useNavigationStore() {
  const setResetToFullMap = useBaseMapStore((state) => state.setResetToFullMap)
  const clearSelectedZone = useBaseMapStore((state) => state.clearSelectedZone)
  const clearSelectedCompany = useBaseMapStore((state) => state.clearSelectedCompany)
  const closeFullscreenCanvas = useBaseMapStore((state) => state.closeFullscreenCanvas)
  const clearCameraTarget = useBaseMapStore((state) => state.clearCameraTarget)

  return useMemo(
    () => ({
      setResetToFullMap,
      clearSelectedZone,
      clearSelectedCompany,
      closeFullscreenCanvas,
      clearCameraTarget,
    }),
    [setResetToFullMap, clearSelectedZone, clearSelectedCompany, closeFullscreenCanvas, clearCameraTarget]
  )
}

// Player 관련 셀렉터
export function usePlayerStore() {
  const physicsBoxPosition = useBaseMapStore((state) => state.physicsBoxPosition)
  const setPhysicsBoxPosition = useBaseMapStore((state) => state.setPhysicsBoxPosition)
  const followPhysicsBox = useBaseMapStore((state) => state.followPhysicsBox)
  const setFollowPhysicsBox = useBaseMapStore((state) => state.setFollowPhysicsBox)
  const cameraTransitionComplete = useBaseMapStore((state) => state.cameraTransitionComplete)
  const setCameraTransitionComplete = useBaseMapStore((state) => state.setCameraTransitionComplete)

  return useMemo(
    () => ({
      physicsBoxPosition,
      setPhysicsBoxPosition,
      followPhysicsBox,
      setFollowPhysicsBox,
      cameraTransitionComplete,
      setCameraTransitionComplete,
    }),
    [
      physicsBoxPosition,
      setPhysicsBoxPosition,
      followPhysicsBox,
      setFollowPhysicsBox,
      cameraTransitionComplete,
      setCameraTransitionComplete,
    ]
  )
}
