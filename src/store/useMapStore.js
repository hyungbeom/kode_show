import { create } from 'zustand'

/**
 * KODE Clubs 지도 상태 관리 스토어
 * 현재 선택된 구역, 카메라 위치 등을 전역으로 관리합니다.
 */
export const useMapStore = create((set) => ({
  // 현재 선택된 구역 정보
  selectedArea: null,
  
  // 카메라 타겟 위치 (구역 클릭 시 이동할 좌표)
  cameraTarget: null,
  
  // world.glb 노드별 포커스 좌표 (바운딩 박스 중심) — Zone 리스트 클릭 시 카메라 타겟
  glbFocusPositions: {},
  setGlbFocusPositions: (positions) => {
    set({ glbFocusPositions: positions })
  },

  // 마커 표시 상태 (초기 진입 시 전체 맵이 보이므로 마커도 표시)
  markersVisible: true,
  
  // 초기 진입 플래그 (ENTER 클릭 후 맵 중앙으로 줌인)
  initialEntry: false,
  setInitialEntry: (value) => {
    set({ initialEntry: value })
  },
  
  // 구역 선택 함수
  selectArea: (areaId, position) => {
    set({
      selectedArea: areaId,
      cameraTarget: position,
      markersVisible: false,  // 마커 클릭 시 마커 숨김
    })
  },
  
  // 구역 선택 해제
  deselectArea: () => {
    set({
      selectedArea: null,
      cameraTarget: null,
    })
  },
  
  // 카메라 타겟만 설정 (애니메이션용)
  setCameraTarget: (position) => {
    set({ cameraTarget: position })
  },
  
  // 카메라 타겟 초기화
  clearCameraTarget: () => {
    set({ cameraTarget: null })
  },
  
  // 맵 전체 보기 모드 (줌 아웃)
  resetToFullMap: false,
  setResetToFullMap: (value) => {
    set({ 
      resetToFullMap: value,
      // 마커는 줌아웃 완료 후 CameraController에서 표시
    })
  },
  // 맵 전체 보기 모드에서 카메라 회전 활성화 여부
  isFullMapRotating: false,
  setIsFullMapRotating: (value) => {
    set({ isFullMapRotating: value })
  },
  
  // 마커 표시 상태 설정
  setMarkersVisible: (visible) => {
    set({ markersVisible: visible })
  },
  
  // 선택된 Zone 정보 (육면체 클릭 시)
  selectedZone: null,
  selectedZonePosition: null,
  pendingZone: null,  // 줌인 완료 후 열릴 Zone
  pendingZonePosition: null,
  isMarkerClick: false,  // 마커 클릭인지 Zone 박스 클릭인지 구분
  // 전체 화면 캔버스 모드
  isFullscreenCanvas: false,
  setFullscreenCanvas: (value) => {
    set({ isFullscreenCanvas: value })
  },
  closeFullscreenCanvas: () => {
    set({
      isFullscreenCanvas: false,
      selectedZone: null,
      selectedZonePosition: null,
      isMarkerClick: false,
    })
  },
  setSelectedZone: (zoneId, position, fromMarker = false) => {
    // Zone 클릭 시 줌인 상태 확인 후 처리
    set((state) => {
      // 마커 클릭인 경우도 줌인 후 모달 표시 (전체 화면 모드 없이)
      // pendingZone에 저장하고 cameraTarget을 설정하여 줌인 트리거
      return {
        pendingZone: zoneId,
        pendingZonePosition: position,
        cameraTarget: position,  // 줌인 애니메이션 트리거
        isMarkerClick: fromMarker,  // 마커 클릭 여부 저장
        // 마커는 업체 리스트가 표시되므로 숨김
        markersVisible: false,
      }
    })
  },
  // 줌인 완료 후 Zone 모달 열기
  openPendingZone: () => {
    set((state) => {
      if (state.pendingZone) {
        return {
          selectedZone: state.pendingZone,
          selectedZonePosition: state.pendingZonePosition,
          pendingZone: null,
          pendingZonePosition: null,
          // 마커 클릭인 경우 전체 화면 모드 없이, Zone 박스 클릭인 경우 전체 화면 모드 활성화
          isFullscreenCanvas: !state.isMarkerClick,  // 마커 클릭이 아니면 전체 화면 모드
        }
      }
      return {}
    })
  },
  clearSelectedZone: () => {
    set({ 
      selectedZone: null,
      selectedZonePosition: null,
      isMarkerClick: false,
    })
  },
  
  // 선택된 업체 정보 (업체 클릭 시)
  selectedCompanyId: null,
  selectedCompanyName: null,
  setSelectedCompany: (companyId, companyName) => {
    set({ 
      selectedCompanyId: companyId,
      selectedCompanyName: companyName,
    })
  },
  clearSelectedCompany: () => {
    set({ 
      selectedCompanyId: null,
      selectedCompanyName: null,
    })
  },
  
  // 작은 상자 위치 추적 및 카메라 추적 모드
  physicsBoxPosition: [0, 0, 0],
  setPhysicsBoxPosition: (position) => {
    set({ physicsBoxPosition: position })
  },
  physicsBoxTargetPosition: null,  // 작은 상자가 이동할 목표 위치
  setPhysicsBoxTargetPosition: (position) => {
    set({ physicsBoxTargetPosition: position })
  },
  physicsBoxPath: [],  // 경로 찾기로 계산된 경로 배열
  setPhysicsBoxPath: (path) => {
    set({ physicsBoxPath: path })
  },
  followPhysicsBox: false,  // 카메라가 상자를 따라다니는 모드
  setFollowPhysicsBox: (value) => {
    set({ followPhysicsBox: value })
  },
  
  // 카메라 전환 완료 상태 (Player의 카메라 팔로우 시작 시점 제어)
  cameraTransitionComplete: true,
  setCameraTransitionComplete: (complete) => {
    set({ cameraTransitionComplete: complete })
  },
}))
