import { PerformanceMonitor, AdaptiveDpr } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

/**
 * drei PerformanceMonitor의 `factor`를 R3F 스토어 `performance.current`에 반영해야
 * {@link AdaptiveDpr}가 실제로 DPR을 낮춥니다(둘이 기본으로는 연결되어 있지 않음).
 */
export function R3fAdaptivePerformance() {
  const set = useThree((s) => s.set)
  return (
    <PerformanceMonitor
      factor={1}
      onChange={(api) => {
        set((state) => ({
          performance: { ...state.performance, current: api.factor },
        }))
      }}
    >
      <AdaptiveDpr pixelated />
    </PerformanceMonitor>
  )
}

/**
 * 장비용 3D 뷰: 저해상도 그림자 맵 + 타이트한 ortho shadow camera.
 * (BakeShadows 없음 — 모델/카메라가 움직일 때 실시간 그림자 유지)
 *
 * drei {@link SoftShadows} 는 마운트 시 씬 전체 머티리얼을 dispose 하는 reset()을 호출해
 * 같은 Canvas 의 Grid·GLB 머티리얼이 깨지므로 여기서는 사용하지 않습니다.
 */
export function R3fEquipmentRealtimeShadows() {
  return (
    <>
      <directionalLight
        castShadow
        position={[5, 10, 5]}
        intensity={1.5}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 0.1, 20]} />
      </directionalLight>
    </>
  )
}

/** Adaptive DPR + 소프트 실시간 그림자 키 라이트 한 묶음 */
export function R3fEquipmentViewEnhancements() {
  return (
    <>
      <R3fAdaptivePerformance />
      <R3fEquipmentRealtimeShadows />
    </>
  )
}
