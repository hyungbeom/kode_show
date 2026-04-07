import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, MeshCollider } from '@react-three/rapier'
import * as THREE from 'three'

const _parentInv = new THREE.Matrix4()
const _local = new THREE.Matrix4()

/** Rapier는 traverseVisible — mesh.visible=false면 trimesh 미생성. 투명 재질로만 숨김 */
const colliderOnlyMaterial = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
  depthTest: false,
})

/**
 * world.glb `Measurement_Land` 와 동일 월드 변환으로 고정 trimesh 콜라이더 (비주얼은 clonedScene).
 * 그룹 월드 = landNode.parent 월드 × 클론 로컬 = landNode 월드 (이중 변환 방지).
 */
export function MeasurementLandPhysics({ landNode }) {
  const groupRef = useRef(/** @type {THREE.Group | null} */ (null))

  const colliderRoot = useMemo(() => {
    if (!landNode) return null
    const c = landNode.clone(true)
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false
        o.receiveShadow = false
        o.material = Array.isArray(o.material)
          ? o.material.map(() => colliderOnlyMaterial)
          : colliderOnlyMaterial
      }
    })
    return c
  }, [landNode])

  useFrame(() => {
    const g = groupRef.current
    if (!landNode || !g?.parent) return
    const parent = landNode.parent
    landNode.updateWorldMatrix(true, true)
    if (parent) parent.updateWorldMatrix(true, true)
    g.parent.updateWorldMatrix(true, true)
    _parentInv.copy(g.parent.matrixWorld).invert()
    const targetWorld = parent ? parent.matrixWorld : landNode.matrixWorld
    _local.multiplyMatrices(_parentInv, targetWorld)
    g.matrix.copy(_local)
    g.matrixWorldNeedsUpdate = true
  })

  if (!colliderRoot) return null

  return (
    <RigidBody type="fixed" colliders={false} friction={2} restitution={0.02}>
      <group ref={groupRef} matrixAutoUpdate={false}>
        <MeshCollider type="trimesh">
          <primitive object={colliderRoot} />
        </MeshCollider>
      </group>
    </RigidBody>
  )
}
