import { MAP_ORTHO_DEFAULT_LOGICAL_ZOOM } from './constants'

/**
 * 화면 너비에 따른 맵 OrthographicCamera.zoom (논리값).
 * 좁을수록 줌을 올려 같은 월드가 화면에서 더 크게 보이게 함.
 */
export function computeMapOrthoZoomForWidth(widthPx: number): number {
  if (widthPx < 480) return 5.6
  if (widthPx < 768) return 4.8
  if (widthPx < 1024) return 4.1
  if (widthPx < 1366) return 3.75
  return MAP_ORTHO_DEFAULT_LOGICAL_ZOOM
}
