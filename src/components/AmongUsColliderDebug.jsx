import { memo } from 'react'

/**
 * 대략적인 발밑 충돌체 크기 참고용 캡슐(디버그).
 * Three `capsuleGeometry` 두 번째 인자는 원통 부분 길이 → 2 * halfHeight.
 */
const CAPSULE_RADIUS = 0.3
const CAPSULE_CYLINDER_LEN = 0.7

/** MapScene `RapierDebugOverlay` 와 동일 — `.env` 에 `VITE_RAPIER_DEBUG=0` 이면 끔 */
const RAPIER_DEBUG_VISIBLE = import.meta.env.VITE_RAPIER_DEBUG !== '0'

/**
 * Among Us **글롭 메시**에는 Rapier 바디가 없을 수 있어,
 * Rapier 디버그 와이어와 실루엣이 다를 때 겹쳐 보기용이다.
 * 이 메시는 그 캡슐을 청록 와이어로 겹쳐 보이게 함(depthTest 끔 — 글롭에 가려지지 않게).
 */
export const AmongUsColliderDebug = memo(function AmongUsColliderDebug() {
  if (!RAPIER_DEBUG_VISIBLE) return null

  return (
    <mesh
      position={[0, 0, 0]}
      name="among-us-capsule-debug"
      frustumCulled={false}
      renderOrder={99999}
    >
      <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_CYLINDER_LEN, 6, 12]} />
      <meshBasicMaterial
        color="#00e5ff"
        wireframe
        transparent
        opacity={0.9}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
})
