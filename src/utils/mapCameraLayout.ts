import { MAP_DEFAULT_ORBIT_TARGET, MAP_DEFAULT_ORTHO_POSITION } from './constants'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/**
 * 브라우저 너비에 따른 맵 기본 OrthographicCamera 위치 ([200,160,200] 기준).
 * 좁은 화면에서는 원점 쪽으로 약간 당겨 프레이밍을 맞춤.
 */
export function getMapDefaultOrthoPositionForWidth(widthPx: number): [number, number, number] {
  const [ox, oy, oz] = MAP_DEFAULT_ORTHO_POSITION
  let factor = 1
  if (widthPx < 480) factor = 0.86
  else if (widthPx < 768) factor = 0.9
  else if (widthPx < 1024) factor = 0.94
  return [ox * factor, oy * factor, oz * factor]
}

/**
 * OrbitControls 기본 타깃. 데스크톱은 왼쪽 히어로 여백(-150,0,0) — 좁을수록 X를 0에 가깝게.
 */
export function getMapDefaultOrbitTargetForWidth(widthPx: number): [number, number, number] {
  const [tx, ty, tz] = MAP_DEFAULT_ORBIT_TARGET
  let centerBlend = 0
  if (widthPx < 480) centerBlend = 1
  else if (widthPx < 768) centerBlend = 0.72
  else if (widthPx < 1024) centerBlend = 0.45
  else centerBlend = 0

  const x = lerp(tx, 0, centerBlend)
  return [x, ty, tz]
}
