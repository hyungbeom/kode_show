import { useShallow } from 'zustand/react/shallow'
import { useMapStore as useBaseMapStore } from '../store/useMapStore'

/**
 * 최적화된 Zustand 셀렉터 훅
 * useShallow로 객체 셀렉터 참조 안정화 → 불필요한 리렌더 감소
 */

export function useAppMapStore() {
  return useBaseMapStore(
    useShallow((state) => ({
      setInitialEntry: state.setInitialEntry,
      selectedCompanyId: state.selectedCompanyId,
      selectedCompanyName: state.selectedCompanyName,
      setSelectedCompany: state.setSelectedCompany,
      clearSelectedCompany: state.clearSelectedCompany,
      selectedZone: state.selectedZone,
      clearSelectedZone: state.clearSelectedZone,
      mapHeroCopyDismissed: state.mapHeroCopyDismissed,
    }))
  )
}

export function useZoneStore() {
  return useBaseMapStore(
    useShallow((state) => ({
      selectedZone: state.selectedZone,
      setSelectedZone: state.setSelectedZone,
      clearSelectedZone: state.clearSelectedZone,
      isMarkerClick: state.isMarkerClick,
      closeFullscreenCanvas: state.closeFullscreenCanvas,
    }))
  )
}

export function useCameraStore() {
  return useBaseMapStore(
    useShallow((state) => ({
      cameraTarget: state.cameraTarget,
      setCameraTarget: state.setCameraTarget,
      clearCameraTarget: state.clearCameraTarget,
      resetToFullMap: state.resetToFullMap,
      setResetToFullMap: state.setResetToFullMap,
      isFullMapRotating: state.isFullMapRotating,
      setIsFullMapRotating: state.setIsFullMapRotating,
    }))
  )
}

export function useMarkerStore() {
  return useBaseMapStore(
    useShallow((state) => ({
      markersVisible: state.markersVisible,
      setMarkersVisible: state.setMarkersVisible,
    }))
  )
}

export function useNavigationStore() {
  return useBaseMapStore(
    useShallow((state) => ({
      setResetToFullMap: state.setResetToFullMap,
      clearSelectedZone: state.clearSelectedZone,
      clearSelectedCompany: state.clearSelectedCompany,
      closeFullscreenCanvas: state.closeFullscreenCanvas,
      clearCameraTarget: state.clearCameraTarget,
    }))
  )
}

export function usePlayerStore() {
  return useBaseMapStore(
    useShallow((state) => ({
      physicsBoxPosition: state.physicsBoxPosition,
      setPhysicsBoxPosition: state.setPhysicsBoxPosition,
      followPhysicsBox: state.followPhysicsBox,
      setFollowPhysicsBox: state.setFollowPhysicsBox,
      cameraTransitionComplete: state.cameraTransitionComplete,
      setCameraTransitionComplete: state.setCameraTransitionComplete,
    }))
  )
}
