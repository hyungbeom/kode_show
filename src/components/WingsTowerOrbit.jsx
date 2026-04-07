import { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { resolveSceneNode } from '../utils/gltfNodeUtils'

/** 스크린 윗면 위 비행 기준 (월드 Y, 타워 AABB max.y 기준) */
const CLEAR_ABOVE_TOP = 16
const ORBIT_RAD_X = 24
const ORBIT_RAD_Z = 18
const ORBIT_SPEED = 0.052
const ORBIT_Z_WARP = 1.06
const ALT_BOB = 3.2
const ALT_BOB_FREQ = 0.088

const _box = new THREE.Box3()
const _world = new THREE.Vector3()
const _local = new THREE.Vector3()
const _next = new THREE.Vector3()

/**
 * @param {THREE.Object3D} anchor
 * @param {THREE.Object3D[]} wings
 * @param {number} t
 * @param {THREE.Object3D | null | undefined} clonedScene
 * @param {{ centerOffsetXZ?: [number, number], baseYWorldOffset?: number }} [opts]
 */
function applyWingsOrbitAtAnchor(anchor, wings, t, clonedScene, opts) {
  const centerOffsetXZ = opts?.centerOffsetXZ
  const baseYWorldOffset = opts?.baseYWorldOffset ?? 0
  const n = wings?.length ?? 0
  if (!anchor || n === 0) return
  if (clonedScene) clonedScene.updateMatrixWorld(true)
  anchor.updateWorldMatrix(true, true)

  _box.setFromObject(anchor)
  if (_box.isEmpty()) return

  let cx = (_box.min.x + _box.max.x) / 2
  let cz = (_box.min.z + _box.max.z) / 2
  if (centerOffsetXZ) {
    cx += centerOffsetXZ[0]
    cz += centerOffsetXZ[1]
  }
  const topY = _box.max.y
  const baseY = topY + CLEAR_ABOVE_TOP + baseYWorldOffset

  for (let i = 0; i < n; i++) {
    const wing = wings[i]
    if (!wing || !wing.parent) continue

    const phaseOff = (i / Math.max(n, 1)) * Math.PI * 2
    const ang = t * ORBIT_SPEED + phaseOff
    const angNext = (t + 0.08) * ORBIT_SPEED + phaseOff

    const xw = cx + Math.cos(ang) * ORBIT_RAD_X
    const zw = cz + Math.sin(ang * ORBIT_Z_WARP) * ORBIT_RAD_Z
    const yw = baseY + Math.sin(t * ALT_BOB_FREQ + i * 0.7) * ALT_BOB

    const xn = cx + Math.cos(angNext) * ORBIT_RAD_X
    const zn = cz + Math.sin(angNext * ORBIT_Z_WARP) * ORBIT_RAD_Z

    _world.set(xw, yw, zw)
    wing.parent.updateWorldMatrix(true, true)
    wing.parent.worldToLocal(_local.copy(_world))
    wing.position.copy(_local)

    _next.set(xn, yw, zn)
    wing.lookAt(_next)
    // glTF는 전진이 +Z인 경우가 많고 lookAt은 -Z를 목표로 맞춤 → 비행 방향이 뒤집혀 보임
    wing.rotateY(Math.PI)
  }
}

/**
 * `Wings` 단일 그룹 또는 `Wing` / `Wing001` / `Wing002`를
 * `Info_Tower_Screen` 상공에서 느린 타원 궤도로 비행.
 * @param {{ centerOffsetXZ?: [number, number], timePhase?: number }} [extra]
 */
export function WingsTowerOrbit({ anchor, wings, clonedScene, centerOffsetXZ, timePhase = 0 }) {
  const n = wings?.length ?? 0

  useFrame(({ clock }) => {
    if (!anchor || n === 0) return
    applyWingsOrbitAtAnchor(anchor, wings, clock.elapsedTime + timePhase, clonedScene, {
      centerOffsetXZ,
    })
  })

  return null
}

/** 복제 날개만 타워 대비 고도 추가 하향(월드 Y) */
const DUPLICATE_BASE_Y_OFFSET = -42

/**
 * `Wings`(또는 첫 날개 메시)를 한 벌 복제해 맵 다른 구역 상공에서 같은 방식으로 비행.
 * 궤도 중심은 앵커 AABB + `centerOffsetXZ`(월드 XZ) — GLB에 별도 앵커 없이도 띄울 수 있음.
 */
export function WingsDuplicateOrbit({
  wingTemplate,
  anchor,
  clonedScene,
  centerOffsetXZ = [142, 78],
  timePhase = 3.1,
}) {
  const hostRef = useRef(/** @type {THREE.Group | null} */ (null))
  const cloneRef = useRef(/** @type {THREE.Object3D | null} */ (null))

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!wingTemplate || !host) return
    const c = wingTemplate.clone(true)
    cloneRef.current = c
    c.position.set(0, 0, 0)
    host.add(c)
    return () => {
      if (host.children.includes(c)) host.remove(c)
      cloneRef.current = null
    }
  }, [wingTemplate])

  useFrame(({ clock }) => {
    const c = cloneRef.current
    if (!c || !anchor) return
    applyWingsOrbitAtAnchor(anchor, [c], clock.elapsedTime + timePhase, clonedScene, {
      centerOffsetXZ,
      baseYWorldOffset: DUPLICATE_BASE_Y_OFFSET,
    })
  })

  return <group ref={hostRef} />
}

/**
 * world.glb nodes에서 타워 스크린 + 날개 타깃 수집
 * @param {Record<string, THREE.Object3D>} nodes
 */
export function resolveWingsTowerOrbitTargets(nodes) {
  const anchor = resolveSceneNode(nodes, 'Info_Tower_Screen')
  if (!anchor) return { anchor: null, wings: [], wingTemplateForClone: null }

  const group = resolveSceneNode(nodes, 'Wings')
  if (group) return { anchor, wings: [group], wingTemplateForClone: group }

  const names = ['Wing', 'Wing001', 'Wing002']
  const wings = names.map((name) => resolveSceneNode(nodes, name)).filter(Boolean)
  const wingTemplateForClone = wings[0] ?? null
  return { anchor, wings, wingTemplateForClone }
}
