import { useRef, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * GLB의 Airplane을 씬에 붙인 뒤, 시간 기반 궤도로 맵 상공을 순회.
 * Three lookAt은 로컬 -Z가 목표를 향함. glTF 전진이 +Z면 목표는 (위치 − 접선) → +Z가 진행 방향.
 * 여전히 반대면 모델이 +X 전진일 수 있음 → 아래 lookAt 줄에서 add/sub만 바꿔보면 됨.
 */
const ORBIT_RAD_X = 92
const ORBIT_RAD_Z = 76
const ORBIT_SPEED = 0.088
const ORBIT_Z_WARP = 1.22
/** 기준 높이 + 출렁임 — 맵 대비 이전보다 약 1/2 높이 */
const ALT_OFFSET = 20
const ALT_WAVE = 9
const ALT_FREQ = 0.058

const PROPELLER_RAD_PER_SEC = 220

export function AirplaneFlight({ airplane }) {
  const { scene } = useThree()
  const center = useRef(new THREE.Vector3())
  const tangent = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())
  const propeller = useRef(null)

  useLayoutEffect(() => {
    if (!airplane) return
    if (airplane.parent !== scene) {
      scene.attach(airplane)
    }
    airplane.rotation.order = 'YXZ'
    propeller.current = airplane.getObjectByName('Propeller') ?? null
    airplane.updateWorldMatrix(true, true)
    center.current.setFromMatrixPosition(airplane.matrixWorld)
  }, [airplane, scene])

  useFrame((state, delta) => {
    if (!airplane || airplane.parent !== scene) return

    const t = state.clock.elapsedTime
    const cx = center.current.x
    const cy = center.current.y
    const cz = center.current.z

    const ang = t * ORBIT_SPEED
    const x = cx + Math.cos(ang) * ORBIT_RAD_X
    const z = cz + Math.sin(ang * ORBIT_Z_WARP) * ORBIT_RAD_Z
    const y = cy + ALT_OFFSET + Math.sin(t * ALT_FREQ) * ALT_WAVE

    const dx = -Math.sin(ang) * ORBIT_RAD_X * ORBIT_SPEED
    const dz = Math.cos(ang * ORBIT_Z_WARP) * ORBIT_RAD_Z * ORBIT_SPEED * ORBIT_Z_WARP
    const dy = Math.cos(t * ALT_FREQ) * ALT_WAVE * ALT_FREQ
    tangent.current.set(dx, dy, dz)
    if (tangent.current.lengthSq() > 1e-10) tangent.current.normalize()
    else tangent.current.set(0, 0, 1)

    airplane.position.set(x, y, z)
    lookTarget.current.copy(airplane.position).sub(tangent.current)
    airplane.lookAt(lookTarget.current)

    const prop = propeller.current
    if (prop) {
      prop.rotateOnWorldAxis(tangent.current, PROPELLER_RAD_PER_SEC * delta)
    }
  })

  return null
}
