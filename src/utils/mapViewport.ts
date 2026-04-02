import { MAP_ORTHO_DEFAULT_LOGICAL_ZOOM } from './constants'

/** 맵 레이아웃·카메라 동기화용 — MapScene / 스토어 초기값과 동일 규칙 */
export function readLayoutBrowserWidthPx(): number {
  if (typeof window === 'undefined') return 1024
  const vv = window.visualViewport
  if (vv?.width != null && vv.width > 0) return vv.width
  return window.innerWidth
}

/**
 * 화면 너비에 따른 맵 OrthographicCamera.zoom (논리값).
 * 좁을수록 줌을 올려 같은 월드가 화면에서 더 크게 보이게 함.
 */
export function computeMapOrthoZoomForWidth(widthPx: number): number {
  if (widthPx < 480) return 1.7
  if (widthPx < 768) return 2.3
  if (widthPx < 1024) return 2.71
  if (widthPx < 1366) return 2.75
  return MAP_ORTHO_DEFAULT_LOGICAL_ZOOM
}
