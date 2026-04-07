import { create } from 'zustand'
import {
  getMapDefaultOrthoPositionForWidth,
  getMapDefaultOrbitTargetForWidth,
  getMapInitialOrthoZoomForWidth,
} from '../utils/mapCameraLayout'
import { readLayoutBrowserWidthPx } from '../utils/mapViewport'
import { ZONE_INFO_PANEL_ENABLED } from '../utils/constants'

/**
 * KODE Clubs 지도 상태 관리 스토어
 * 현재 선택된 구역, 카메라 위치 등을 전역으로 관리합니다.
 */
interface MapStore {
  // 현재 선택된 구역 정보
  selectedArea: string | null
  
  // 카메라 타겟 위치 (구역 클릭 시 이동할 좌표)
  cameraTarget: [number, number, number] | null
  
  // world.glb 노드별 포커스 좌표 (바운딩 박스 중심)
  glbFocusPositions: Record<string, [number, number, number]>
  setGlbFocusPositions: (positions: Record<string, [number, number, number]>) => void

  /** world.glb 전체 클론 씬 AABB 중심 — 브라우저 가로 중앙에 맵을 두는 데 사용 */
  worldGlbBoundsCenter: [number, number, number] | null
  setWorldGlbBoundsCenter: (p: [number, number, number] | null) => void

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
  
  /**
   * true → CameraController가 Navigate 모드 pose로 GSAP 전환을 시작합니다.
   * (Navigate 모드: NAVIGATE 클릭 후의 맵 전체 보기 카메라 구도 — `mapNavigateReset`)
   */
  resetToFullMap: boolean
  setResetToFullMap: (value: boolean) => void

  /**
   * Navigate(또는 인트로 EXPLORE) GSAP가 Navigate pose에 도달한 뒤에만 true.
   * WorldModel 장식·루트 Yaw는 이 값이 true일 때만 돌며, 존 줌/모달 닫기만으로는 다시 켜지지 않음.
   */
  mapNavigateWorldDecorSpinActive: boolean

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

  /** 맵 검색으로 존 열 때: 업체 탭 + 해당 카드부터 보이게 */
  zonePanelSearchDeepLink: { focusCompanyId: number } | null
  setZonePanelSearchDeepLink: (value: { focusCompanyId: number } | null) => void
  
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

  /**
   * NAVIGATE 등: 존/마커/추적 등 상호작용만 초기화.
   * `mapHeroCopyDismissed`는 건드리지 않음 — 블러 인트로를 다시 띄우지 않음.
   * 카메라는 Navigate 모드로 맞추려면 `setResetToFullMap(true)` + CameraController.
   */
  resetMapToInitialInteractionState: () => void

  /** 인트로 EXPLORE 후 왼쪽 히어로 숨김 — 카메라는 Navigate 모드와 동일하게 `resetToFullMap` 경로 */
  mapHeroCopyDismissed: boolean
  triggerBrandFilmCenterView: () => void

  /** 뷰포트 너비 기반 맵 OrthographicCamera 논리 줌 (PC/태블릿/모바일) */
  mapViewportOrthoZoom: number
  setMapViewportOrthoZoom: (zoom: number) => void

  /** 브라우저 너비 기반 맵 기본 카메라 pose — CameraSystem / CameraController 와 동기화 */
  mapDefaultOrthoPosition: [number, number, number]
  mapDefaultOrbitTarget: [number, number, number]
  setMapDefaultCameraLayout: (
    ortho: [number, number, number],
    target: [number, number, number],
  ) => void

  /** readLayoutBrowserWidthPx — ZONE 말풍선·Html 오버레이가 카메라와 동일 기준 사용 */
  mapLayoutBrowserWidthPx: number
  setMapLayoutBrowserWidthPx: (w: number) => void
}

export const useMapStore = create<MapStore>((set, get) => ({
  // 현재 선택된 구역 정보
  selectedArea: null,
  
  // 카메라 타겟 위치 (구역 클릭 시 이동할 좌표)
  cameraTarget: null,
  
  glbFocusPositions: {},
  setGlbFocusPositions: (positions: Record<string, [number, number, number]>) => {
    set({ glbFocusPositions: positions })
  },

  worldGlbBoundsCenter: null,
  setWorldGlbBoundsCenter: (p) => {
    set({ worldGlbBoundsCenter: p })
  },

  // 마커 표시 상태 (초기 진입 시 전체 맵이 보이므로 마커도 표시)
  markersVisible: true,
  
  // 초기 진입 플래그 (ENTER 클릭 후 맵 중앙으로 줌인)
  initialEntry: false,
  setInitialEntry: (value: boolean) => {
    set({ initialEntry: value })
  },
  
  // 구역 선택 함수 (줌 완료 후 openPendingZone으로 패널 열림 — setSelectedZone과 동일하게 pendingZone 설정)
  selectArea: (areaId: string, position: [number, number, number]) => {
    set({
      selectedArea: areaId,
      cameraTarget: position,
      markersVisible: false,
      pendingZone: areaId,
      pendingZonePosition: position,
      isMarkerClick: false,
      mapNavigateWorldDecorSpinActive: false,
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
    set({
      cameraTarget: position,
      ...(position !== null ? { mapNavigateWorldDecorSpinActive: false } : {}),
    })
  },
  
  // 카메라 타겟 초기화
  clearCameraTarget: () => {
    set({ cameraTarget: null })
  },
  
  // 맵 전체 보기 모드 (줌 아웃)
  resetToFullMap: false,
  mapNavigateWorldDecorSpinActive: false,
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
    set({
      isFullscreenCanvas: value,
      ...(value ? { mapNavigateWorldDecorSpinActive: false } : {}),
    })
  },
  closeFullscreenCanvas: () => {
    set({
      isFullscreenCanvas: false,
      selectedZone: null,
      selectedZonePosition: null,
      isMarkerClick: false,
      zonePanelSearchDeepLink: null,
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
        mapNavigateWorldDecorSpinActive: false,
      }
    })
  },
  
  // 줌인 완료 후 Zone 모달 열기
  openPendingZone: () => {
    set((state) => {
      if (!state.pendingZone) return {}
      if (!ZONE_INFO_PANEL_ENABLED) {
        return {
          pendingZone: null,
          pendingZonePosition: null,
          markersVisible: true,
          selectedArea: null,
          isMarkerClick: false,
        }
      }
      return {
        selectedZone: state.pendingZone,
        selectedZonePosition: state.pendingZonePosition,
        pendingZone: null,
        pendingZonePosition: null,
        // 마커 클릭인 경우 전체 화면 모드 없이, Zone 박스 클릭인 경우 전체 화면 모드 활성화
        isFullscreenCanvas: !state.isMarkerClick,  // 마커 클릭이 아니면 전체 화면 모드
      }
    })
  },
  clearSelectedZone: () => {
    set({ 
      selectedZone: null,
      selectedZonePosition: null,
      isMarkerClick: false,
    })
  },

  zonePanelSearchDeepLink: null,
  setZonePanelSearchDeepLink: (value) => {
    set({ zonePanelSearchDeepLink: value })
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
    set({
      followPhysicsBox: value,
      ...(value ? { mapNavigateWorldDecorSpinActive: false } : {}),
    })
  },
  
  // 카메라 전환 완료 상태 (Player의 카메라 팔로우 시작 시점 제어)
  cameraTransitionComplete: true,
  setCameraTransitionComplete: (complete: boolean) => {
    set({ cameraTransitionComplete: complete })
  },

  mapHeroCopyDismissed: false,
  triggerBrandFilmCenterView: () => {
    get().resetMapToInitialInteractionState()
    set({ mapHeroCopyDismissed: true, resetToFullMap: true })
  },

  mapViewportOrthoZoom: getMapInitialOrthoZoomForWidth(readLayoutBrowserWidthPx()),
  setMapViewportOrthoZoom: (zoom: number) => {
    set({ mapViewportOrthoZoom: zoom })
  },

  mapDefaultOrthoPosition: getMapDefaultOrthoPositionForWidth(readLayoutBrowserWidthPx()),
  mapDefaultOrbitTarget: getMapDefaultOrbitTargetForWidth(readLayoutBrowserWidthPx()),
  setMapDefaultCameraLayout: (ortho, target) => {
    set({
      mapDefaultOrthoPosition: ortho,
      mapDefaultOrbitTarget: target,
    })
  },

  mapLayoutBrowserWidthPx: readLayoutBrowserWidthPx(),
  setMapLayoutBrowserWidthPx: (w: number) => {
    set({ mapLayoutBrowserWidthPx: w })
  },

  resetMapToInitialInteractionState: () => {
    set({
      selectedArea: null,
      cameraTarget: null,
      pendingZone: null,
      pendingZonePosition: null,
      selectedZone: null,
      selectedZonePosition: null,
      isMarkerClick: false,
      isFullscreenCanvas: false,
      markersVisible: true,
      isFullMapRotating: false,
      mapNavigateWorldDecorSpinActive: false,
      followPhysicsBox: false,
      selectedCompanyId: null,
      selectedCompanyName: null,
      physicsBoxTargetPosition: null,
      physicsBoxPath: [],
      cameraTransitionComplete: true,
      zonePanelSearchDeepLink: null,
    })
  },
}))
