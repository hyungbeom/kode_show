import * as THREE from 'three'

/** 캐러셀·풀스크린 뷰어 공통 — 중심 정렬 + 단위 스케일 */
export function normalizeProductGlbToUnit(scene: THREE.Object3D): THREE.Object3D {
  const clone = scene.clone(true)
  clone.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(clone)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  clone.position.sub(center)
  const s = 1.65 / maxDim
  clone.scale.setScalar(s)
  return clone
}
