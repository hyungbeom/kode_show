/**
 * Navigate 모드 — UI에서 NAVIGATE를 눌렀을 때 도달하는 맵 전체 보기용 카메라 구도
 * (Orthographic 위치 · OrbitControls 타깃 · ortho zoom)와 그에 맞춘 뷰 상태를 통칭합니다.
 * 목표 pose는 아래 `getNavigateResetCamera`가 뷰포트·설정에 따라 결정합니다.
 *
 * 구현상 `resetToFullMap`이 true가 되면 CameraController가 이 pose로 애니메이션합니다.
 *
 * Navigate idle 시: `mapNavigateWorldDecorSpinActive`(GSAP 완료 후 true)와
 * `isNavigateModeWorldSpinActive`가 둘 다 참일 때만 CameraController가 Orbit 타깃 축으로 카메라만 공전합니다.
 * world.glb 루트는 회전하지 않습니다.
 *
 * 우선순위 (`getNavigateResetCamera`):
 * 1. 모바일 — 뷰포트 너비 ≤ `MAP_NAVIGATE_MOBILE_TOP_DOWN.maxWidthPx` 이고 `enabled`일 때
 * 2. `MAP_NAVIGATE_RESET_CAMERA.enabled` — 전 구간 커스텀
 * 3. 그 외 — 스토어의 뷰포트별 기본값 (`mapDefault*` / 줌)
 *
 * 주의: 스토어 `mapViewportOrthoZoom`에 그대로 동기화되므로 줌에 누적 곱(예: 매 클릭 0.88)을 넣지 말 것.
 */

/**
 * 좁은 화면(≤maxWidthPx)에서 Navigate 모드용 카메라.
 * 아래 pose는 Leva로 맞춘 고정값 — `useWorldGlbBoundsCenter`로 AABB 탑뷰로 바꿀 수 있음.
 */
export const MAP_NAVIGATE_MOBILE_TOP_DOWN = {
  enabled: true,
  maxWidthPx: 768,

  /**
   * true이면 `worldGlbBoundsCenter`(WorldModel AABB)가 있을 때
   * 타깃·카메라 XZ를 그 중심에 맞춤 (`topDownCameraHeight` 등 사용).
   */
  useWorldGlbBoundsCenter: false,

  /** OrthographicCamera.position — Leva 스냅샷 */
  orthoPosition: [311, 400, 42] as [number, number, number],

  /** OrbitControls.target — Leva 스냅샷 */
  orbitTarget: [-14, -173, 2] as [number, number, number],

  /**
   * bounds 사용 시 카메라 Y. 기본 300에서 조금만 내리면 거의 탑뷰 유지 + 살짝 낮은 시점.
   * 더 낮추면(예: 240) 시선이 더 기울어짐.
   */
  topDownCameraHeight: 268,

  /** bounds 사용 시 카메라 Z = centerZ + 이 값(오빗 직선 각도 안정화) */
  cameraZEpsilon: 0.0001,

  /** 비우면 너비별 스토어 줌 */
  orthoZoom: 1.45,
}

/** 전 뷰포트 구간에 동일한 Navigate 모드 pose를 쓸 때 `enabled: true` */
export const MAP_NAVIGATE_RESET_CAMERA = {
  enabled: false,

  orthoPosition: [200, 160, 200] as [number, number, number],

  orbitTarget: [-150, 0, 0] as [number, number, number],

  orthoZoom: undefined as number | undefined,
}

export type NavigateResetPoint = {
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
  zoom: number
}

/** Navigate 모드에 쓸 카메라 목표 pose·줌 */
export function getNavigateResetCamera(
  fallbackOrthoPosition: readonly [number, number, number],
  fallbackOrbitTarget: readonly [number, number, number],
  fallbackZoom: number,
  layoutWidthPx: number,
  worldGlbBoundsCenter: readonly [number, number, number] | null,
): NavigateResetPoint {
  if (MAP_NAVIGATE_MOBILE_TOP_DOWN.enabled && layoutWidthPx <= MAP_NAVIGATE_MOBILE_TOP_DOWN.maxWidthPx) {
    const m = MAP_NAVIGATE_MOBILE_TOP_DOWN
    if (m.useWorldGlbBoundsCenter && worldGlbBoundsCenter) {
      const [cx, cy, cz] = worldGlbBoundsCenter
      const camY = m.topDownCameraHeight
      const zEps = m.cameraZEpsilon
      return {
        position: { x: cx, y: camY, z: cz + zEps },
        target: { x: cx, y: cy, z: cz },
        zoom: m.orthoZoom ?? fallbackZoom,
      }
    }
    return {
      position: {
        x: m.orthoPosition[0],
        y: m.orthoPosition[1],
        z: m.orthoPosition[2],
      },
      target: { x: m.orbitTarget[0], y: m.orbitTarget[1], z: m.orbitTarget[2] },
      zoom: m.orthoZoom ?? fallbackZoom,
    }
  }

  if (MAP_NAVIGATE_RESET_CAMERA.enabled) {
    const c = MAP_NAVIGATE_RESET_CAMERA
    return {
      position: {
        x: c.orthoPosition[0],
        y: c.orthoPosition[1],
        z: c.orthoPosition[2],
      },
      target: { x: c.orbitTarget[0], y: c.orbitTarget[1], z: c.orbitTarget[2] },
      zoom: c.orthoZoom ?? fallbackZoom,
    }
  }

  return {
    position: {
      x: fallbackOrthoPosition[0],
      y: fallbackOrthoPosition[1],
      z: fallbackOrthoPosition[2],
    },
    target: {
      x: fallbackOrbitTarget[0],
      y: fallbackOrbitTarget[1],
      z: fallbackOrbitTarget[2],
    },
    zoom: fallbackZoom,
  }
}

/** Navigate idle 시 Orbit 타깃 축 기준 카메라 공전 각속도 (rad/s) — GLB 고정·시각만 회전 */
export const NAVIGATE_MODE_WORLD_YAW_RAD_PER_S = 0.06

export type NavigateModeWorldSpinSnapshot = {
  followPhysicsBox: boolean
  cameraTarget: [number, number, number] | null
  selectedZone: string | null
  isFullscreenCanvas: boolean
}

/**
 * 맵 전체 탐색 뷰(Zone 줌·전체화면·건물 타깃 이동·물리 추적이 아닐 때).
 * CameraController는 여기에 더해 `mapNavigateWorldDecorSpinActive`를 AND 해 Navigate 모드에서만 공전합니다.
 */
export function isNavigateModeWorldSpinActive(s: NavigateModeWorldSpinSnapshot): boolean {
  return (
    !s.followPhysicsBox &&
    s.cameraTarget === null &&
    s.selectedZone === null &&
    !s.isFullscreenCanvas
  )
}
