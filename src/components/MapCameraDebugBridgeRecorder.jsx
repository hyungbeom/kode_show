import { useFrame, useThree } from '@react-three/fiber'
import { mapCameraDebugBridge } from '../utils/mapCameraDebugBridge'

function writeBridge(camera, controlsRef) {
  const c = camera.position
  const ctrl = controlsRef?.current
  const t = ctrl?.target
  mapCameraDebugBridge.camX = c.x
  mapCameraDebugBridge.camY = c.y
  mapCameraDebugBridge.camZ = c.z
  mapCameraDebugBridge.targetX = t ? t.x : 0
  mapCameraDebugBridge.targetY = t ? t.y : 0
  mapCameraDebugBridge.targetZ = t ? t.z : 0
  mapCameraDebugBridge.orthoZoom = camera.zoom
  mapCameraDebugBridge.valid = true
}

/**
 * 개발용 — 카메라 수치를 브리지에 기록 (화면 고정 오버레이가 읽음).
 */
export function MapCameraDebugBridgeRecorder({ controlsRef }) {
  const { camera } = useThree()

  useFrame(() => {
    writeBridge(camera, controlsRef)
  })

  return null
}
