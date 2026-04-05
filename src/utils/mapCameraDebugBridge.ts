/**
 * R3F 씬(MapCameraDebugBridgeRecorder) → 뷰포트 고정 DOM(MapCameraDebugOverlay) 용 임시 브리지.
 * 나중에 디버그 제거 시 이 모듈·관련 컴포넌트 일괄 삭제하면 됨.
 */
export type MapCameraDebugSnapshot = {
  camX: number
  camY: number
  camZ: number
  targetX: number
  targetY: number
  targetZ: number
  orthoZoom: number
  valid: boolean
}

export const mapCameraDebugBridge: MapCameraDebugSnapshot = {
  camX: 0,
  camY: 0,
  camZ: 0,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  orthoZoom: 1,
  valid: false,
}
