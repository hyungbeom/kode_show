import { MAP_DEFAULT_ORBIT_TARGET, MAP_DEFAULT_ORTHO_POSITION } from './constants'
import { computeMapOrthoZoomForWidth } from './mapViewport'

/** Navigate 모드 전용 pose는 `src/config/mapNavigateReset.ts` (`getNavigateResetCamera`) */

/** 이 너비 미만 → mobile (`readLayoutBrowserWidthPx` 기준) */
export const MAP_LAYOUT_TABLET_MIN_PX = 768

/** 이 너비 미만(이상은 tablet) → tablet 구간은 [MAP_LAYOUT_TABLET_MIN_PX, MAP_LAYOUT_PC_MIN_PX) */
export const MAP_LAYOUT_PC_MIN_PX = 1024

export type MapLayoutViewportKind = 'mobile' | 'tablet' | 'pc'

export type MapInitialCameraRig = {
  /** OrthographicCamera.position [x, y, z] */
  orthoPosition: [number, number, number]
  /** OrbitControls.target [x, y, z] */
  orbitTarget: [number, number, number]
  /**
   * OrthographicCamera.zoom (논리값). 비우면 `computeMapOrthoZoomForWidth`(mapViewport) 폴백.
   */
  orthoZoom?: number
  /**
   * ortho·orbit에 **같은 벡터**로 더함 → 시선 유지, 화면상 팬(AABB와 무관).
   */
  framingPan?: [number, number, number]
}

/**
 * 초기 맵 로드 시 카메라 — 모바일 / 태블릿 / PC는 여기만 수정.
 * 구간: mobile `<` 768px, tablet 768px ~ 1023px, pc `>=` 1024px
 *
 * - orthoPosition / orbitTarget: 기본 자세
 * - orthoZoom: 있으면 초기 줌(없으면 mapViewport 너비별 자동)
 * - framingPan: 선택 시 ortho·orbit에 동시에 더해 화면상 팬
 */
export const MAP_INITIAL_CAMERA_BY_VIEWPORT: Record<MapLayoutViewportKind, MapInitialCameraRig> = {
  mobile: {
    orthoPosition: [172, 238, 172],
    orbitTarget: [0, 0, 0],
    orthoZoom: 2,
    framingPan: [-45, -8, 12],
  },
  tablet: {
    orthoPosition: [188, 150, 188],
    orbitTarget: [-82.5, 0, 0],
  },
  pc: {
    orthoPosition: [...MAP_DEFAULT_ORTHO_POSITION],
    orbitTarget: [...MAP_DEFAULT_ORBIT_TARGET],
  },
}

export function getMapLayoutViewportKind(widthPx: number): MapLayoutViewportKind {
  if (widthPx < MAP_LAYOUT_TABLET_MIN_PX) return 'mobile'
  if (widthPx < MAP_LAYOUT_PC_MIN_PX) return 'tablet'
  return 'pc'
}

export function getMapInitialCameraRigForWidth(widthPx: number): MapInitialCameraRig {
  return MAP_INITIAL_CAMERA_BY_VIEWPORT[getMapLayoutViewportKind(widthPx)]
}

/** 초기 맵 줌 — 구간에 `orthoZoom` 이 있으면 그 값, 없으면 너비별 자동 줌 */
export function getMapInitialOrthoZoomForWidth(widthPx: number): number {
  const z = getMapInitialCameraRigForWidth(widthPx).orthoZoom
  return z ?? computeMapOrthoZoomForWidth(widthPx)
}

function addVec3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

/**
 * 브라우저 너비에 따른 맵 기본 OrthographicCamera 위치.
 * 실제 값은 `MAP_INITIAL_CAMERA_BY_VIEWPORT` 에서만 수정.
 */
export function getMapDefaultOrthoPositionForWidth(widthPx: number): [number, number, number] {
  return getMapInitialCameraRigForWidth(widthPx).orthoPosition
}

/**
 * OrbitControls 기본 타깃.
 * 실제 값은 `MAP_INITIAL_CAMERA_BY_VIEWPORT` 에서만 수정.
 */
export function getMapDefaultOrbitTargetForWidth(widthPx: number): [number, number, number] {
  return getMapInitialCameraRigForWidth(widthPx).orbitTarget
}

/**
 * 뷰포트 너비별 `MAP_INITIAL_CAMERA_BY_VIEWPORT` + 선택적 `framingPan`.
 */
export function resolveMapCameraLayoutForViewport(widthPx: number): {
  orthoPosition: [number, number, number]
  orbitTarget: [number, number, number]
} {
  const ortho = getMapDefaultOrthoPositionForWidth(widthPx)
  const target = getMapDefaultOrbitTargetForWidth(widthPx)
  const pan = getMapInitialCameraRigForWidth(widthPx).framingPan
  if (!pan) return { orthoPosition: ortho, orbitTarget: target }
  return {
    orthoPosition: addVec3(ortho, pan),
    orbitTarget: addVec3(target, pan),
  }
}
