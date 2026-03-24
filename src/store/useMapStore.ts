import { create } from 'zustand'
import * as THREE from 'three'

/**
 * KODE Clubs 지도 상태 관리 스토어
 * 현재 선택된 구역, 카메라 위치 등을 전역으로 관리합니다.
 */
interface MapStore {
  // 현재 선택된 구역 정보
  selectedArea: string | null
  
  // 카메라 타겟 위치 (구역 클릭 시 이동할 좌표)
  cameraTarget: [number, number, number] | null
  
  // 마커 표시 상태 (초기 진입 시 전체 맵이 보이므로 마커도 표시)
  markersVisible: boolean
  
  // 초기 진입 플래그 (ENTER 클릭 후 맵 중앙으로 줌인)
  initialEntry: boolean
  setInitialEntry: (value: boolean) => void
  
  // 구역 선택 함수
  selectArea: (areaId: string, position: [number, number, number]) => void
  
  // 구역 선택 해제
  deselectArea: () => void
  
  // 카메라 타겟만 설정 (애니메이션용)
  setCameraTarget: (position: [number, number, number] | null) => void
  
  // 카메라 타겟 초기화
  clearCameraTarget: () => void
  
  // 맵 전체 보기 모드 (줌 아웃)
  resetToFullMap: boolean
  setResetToFullMap: (value: boolean) => void
  
  // 맵 전체 보기 모드에서 카메라 회전 활성화 여부
  isFullMapRotating: boolean
  setIsFullMapRotating: (value: boolean) => void
  
  // 마커 표시 상태 설정
  setMarkersVisible: (visible: boolean) => void
  
  // 선택된 Zone 정보 (육면체 클릭 시)
  selectedZone: string | null
  selectedZonePosition: [number, number, number] | null
  pendingZone: string | null  // 줌인 완료 후 열릴 Zone
  pendingZonePosition: [number, number, number] | null
  isMarkerClick: boolean  // 마커 클릭인지 Zone 박스 클릭인지 구분
  
  // 전체 화면 캔버스 모드
  isFullscreenCanvas: boolean
  setFullscreenCanvas: (value: boolean) => void
  closeFullscreenCanvas: () => void
  setSelectedZone: (zoneId: string, position: [number, number, number], fromMarker?: boolean) => void
  
  // 줌인 완료 후 Zone 모달 열기
  openPendingZone: () => void
  clearSelectedZone: () => void
  
  // 선택된 업체 정보 (업체 클릭 시)
  selectedCompanyId: number | null
  selectedCompanyName: string | null
  setSelectedCompany: (companyId: number, companyName: string) => void
  clearSelectedCompany: () => void
  
  // 작은 상자 위치 추적 및 카메라 추적 모드
  physicsBoxPosition: [number, number, number]
  setPhysicsBoxPosition: (position: [number, number, number]) => void
  physicsBoxTargetPosition: [number, number, number] | null  // 작은 상자가 이동할 목표 위치
  setPhysicsBoxTargetPosition: (position: [number, number, number] | null) => void
  physicsBoxPath: [number, number, number][]  // 경로 찾기로 계산된 경로 배열
  setPhysicsBoxPath: (path: [number, number, number][]) => void
  followPhysicsBox: boolean  // 카메라가 상자를 따라다니는 모드
  setFollowPhysicsBox: (value: boolean) => void
  
  // 카메라 전환 완료 상태 (Player의 카메라 팔로우 시작 시점 제어)
  cameraTransitionComplete: boolean
  setCameraTransitionComplete: (complete: boolean) => void
}

export const useMapStore = create<MapStore>((set) => ({
  // 현재 선택된 구역 정보
  selectedArea: null,
  
  // 카메라 타겟 위치 (구역 클릭 시 이동할 좌표)
  cameraTarget: null,
  
  // 마커 표시 상태 (초기 진입 시 전체 맵이 보이므로 마커도 표시)
  markersVisible: true,
  
  // 초기 진입 플래그 (ENTER 클릭 후 맵 중앙으로 줌인)
  initialEntry: false,
  setInitialEntry: (value: boolean) => {
    set({ initialEntry: value })
  },
  
  // 구역 선택 함수
  selectArea: (areaId: string, position: [number, number, number]) => {
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
  setCameraTarget: (position: [number, number, number] | null) => {
    set({ cameraTarget: position })
  },
  
  // 카메라 타겟 초기화
  clearCameraTarget: () => {
    set({ cameraTarget: null })
  },
  
  // 맵 전체 보기 모드 (줌 아웃)
  resetToFullMap: false,
  setResetToFullMap: (value: boolean) => {
    set({ 
      resetToFullMap: value,
      // 마커는 줌아웃 완료 후 CameraController에서 표시
    })
  },
  
  // 맵 전체 보기 모드에서 카메라 회전 활성화 여부
  isFullMapRotating: false,
  setIsFullMapRotating: (value: boolean) => {
    set({ isFullMapRotating: value })
  },
  
  // 마커 표시 상태 설정
  setMarkersVisible: (visible: boolean) => {
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
  setFullscreenCanvas: (value: boolean) => {
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
  setSelectedZone: (zoneId: string, position: [number, number, number], fromMarker = false) => {
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
  setSelectedCompany: (companyId: number, companyName: string) => {
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
  setPhysicsBoxPosition: (position: [number, number, number]) => {
    set({ physicsBoxPosition: position })
  },
  physicsBoxTargetPosition: null,  // 작은 상자가 이동할 목표 위치
  setPhysicsBoxTargetPosition: (position: [number, number, number] | null) => {
    set({ physicsBoxTargetPosition: position })
  },
  physicsBoxPath: [],  // 경로 찾기로 계산된 경로 배열
  setPhysicsBoxPath: (path: [number, number, number][]) => {
    set({ physicsBoxPath: path })
  },
  followPhysicsBox: false,  // 카메라가 상자를 따라다니는 모드
  setFollowPhysicsBox: (value: boolean) => {
    set({ followPhysicsBox: value })
  },
  
  // 카메라 전환 완료 상태 (Player의 카메라 팔로우 시작 시점 제어)
  cameraTransitionComplete: true,
  setCameraTransitionComplete: (complete: boolean) => {
    set({ cameraTransitionComplete: complete })
  },
}))
