import { useLayoutEffect } from 'react'
import * as THREE from 'three'

/**
 * world.glb 노드(앵커)와 형제인 `<group>`의 transform을 맞춤 (맵 루트 그룹 기준 로컬)
 * @param {React.RefObject<THREE.Group | null>} groupRef
 * @param {THREE.Object3D | null | undefined} anchor
 * @param {{ position: [number, number, number], rotation: [number, number, number], scale: number }} fallback
 */
export function useSyncGroupToWorldGlbAnchor(groupRef, anchor, fallback) {
  useLayoutEffect(() => {
    const g = groupRef.current
    if (!g) return

    if (!anchor) {
      const { position, rotation, scale } = fallback
      g.position.set(position[0], position[1], position[2])
      g.rotation.set(rotation[0], rotation[1], rotation[2])
      g.scale.setScalar(scale)
      return
    }

    anchor.updateWorldMatrix(true, true)
    const parent = g.parent
    if (!parent) {
      g.matrix.copy(anchor.matrixWorld)
      g.matrix.decompose(g.position, g.quaternion, g.scale)
      return
    }
    parent.updateWorldMatrix(true, false)
    const wp = new THREE.Vector3()
    const wq = new THREE.Quaternion()
    const ws = new THREE.Vector3()
    anchor.matrixWorld.decompose(wp, wq, ws)
    const invParent = new THREE.Matrix4().copy(parent.matrixWorld).invert()
    const local = new THREE.Matrix4().compose(wp, wq, ws).premultiply(invParent)
    local.decompose(g.position, g.quaternion, g.scale)
  }, [anchor, groupRef, fallback])
}
