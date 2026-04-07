import { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** 월드 Y축 기준 아래로 내릴 거리(맵 스케일에 맞춤) */
const DROP_WORLD_Y = 88

/** 둥실 상하(로컬 Y, 이중 사인) */
const BOB_AMP_PRIMARY = 8
const BOB_AMP_SECONDARY = 4.3
const BOB_SPEED_PRIMARY = 0.42
const BOB_SPEED_SECONDARY = 0.26
const BOB_PHASE2 = 0.95

/** 앵커 근처 수평 원 궤도(로컬 XZ) */
const ORBIT_RADIUS = 20
const ORBIT_SPEED = 0.03
const ORBIT_PHASE = 0.4

const _w = new THREE.Vector3()

function motionOffsets(t, timePhase = 0) {
  const tt = t + timePhase
  const bob =
    Math.sin(tt * BOB_SPEED_PRIMARY) * BOB_AMP_PRIMARY +
    Math.sin(tt * BOB_SPEED_SECONDARY + BOB_PHASE2) * BOB_AMP_SECONDARY
  const ang = tt * ORBIT_SPEED + ORBIT_PHASE
  const dx = Math.cos(ang) * ORBIT_RADIUS
  const dz = Math.sin(ang) * ORBIT_RADIUS
  return { dx, dz, bob }
}

/**
 * 복제 풍선 2벌 — 원본 `BalloonAmbient` 다음에 마운트해 템플릿 월드 위치(드롭 반영) + 오프셋에 고정.
 * `worldOffset`: 월드 X/Y/Z 가감(맵 다른 구역으로 밀기)
 */
export const BALLOON_EXTRA_INSTANCES = [
  { worldOffset: [128, -8, 82], timePhase: 1.25 },
  { worldOffset: [-112, 4, -96], timePhase: 2.7 },
]

/**
 * world.glb 등의 Baloon/Balloon 노드 — 초기에 월드 기준으로 많이 아래로 옮기고,
 * 둥실거림 + 느린 원형 드리프트를 로컬 기준점 주변에 적용.
 */
export function BalloonAmbient({ balloon }) {
  const baseLocal = useRef(new THREE.Vector3())
  const applied = useRef(false)

  useLayoutEffect(() => {
    if (!balloon) return
    const parent = balloon.parent
    if (!parent) return

    balloon.updateWorldMatrix(true, true)
    _w.setFromMatrixPosition(balloon.matrixWorld)
    _w.y -= DROP_WORLD_Y
    parent.updateWorldMatrix(true, true)
    parent.worldToLocal(_w)
    balloon.position.copy(_w)
    baseLocal.current.copy(balloon.position)
    applied.current = true
  }, [balloon])

  useFrame(({ clock }) => {
    if (!balloon || !applied.current) return
    const t = clock.elapsedTime
    const b = baseLocal.current
    const { dx, dz, bob } = motionOffsets(t, 0)
    balloon.position.set(b.x + dx, b.y + bob, b.z + dz)
  })

  return null
}

/**
 * 풍선 메시 `clone(true)` 한 벌을 `worldOffset`만큼 떨어진 위치에 두고 같은 둥실·궤도 적용.
 * `BalloonAmbient` 뒤에 두어 템플릿 월드 행렬이 먼저 반영되게 할 것.
 */
export function BalloonDuplicateAmbient({ template, worldOffset, timePhase = 0 }) {
  const hostRef = useRef(/** @type {THREE.Group | null} */ (null))
  const cloneRef = useRef(/** @type {THREE.Object3D | null} */ (null))
  const [ox, oy, oz] = worldOffset

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!template || !host) return
    const c = template.clone(true)
    cloneRef.current = c
    c.position.set(0, 0, 0)
    host.add(c)

    template.updateWorldMatrix(true, true)
    _w.setFromMatrixPosition(template.matrixWorld)
    _w.x += ox
    _w.y += oy
    _w.z += oz
    const par = host.parent
    if (!par) return
    par.updateWorldMatrix(true, true)
    par.worldToLocal(_w)
    host.position.copy(_w)

    return () => {
      if (host.children.includes(c)) host.remove(c)
      cloneRef.current = null
    }
  }, [template, ox, oy, oz])

  useFrame(({ clock }) => {
    const c = cloneRef.current
    if (!c) return
    const { dx, dz, bob } = motionOffsets(clock.elapsedTime, timePhase)
    c.position.set(dx, bob, dz)
  })

  return <group ref={hostRef} />
}
