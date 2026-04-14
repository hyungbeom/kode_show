import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { resolveSceneNode } from '../utils/gltfNodeUtils'
import { DISABLE_PROCEDURAL_MAP_ANIMATIONS } from '../config/perfAnimationTest'

const WAVE_TIME_A = 2.5
const WAVE_TIME_B = 2.0
const WAVE_U_WEIGHT = 0.55
const WAVE_V_WEIGHT = 0.45

/**
 * Water_all 하위에서 버텍스 수가 가장 많은 Mesh = 실제 물 표면일 가능성이 큼
 * @param {import('three').Object3D | null} root
 * @returns {import('three').Mesh | null}
 */
function pickWaterSurfaceMesh(root) {
  if (!root) return null
  if (root.isMesh && root.geometry?.attributes?.position) return root
  const meshes = []
  root.traverse((c) => {
    if (c.isMesh && c.geometry?.attributes?.position) meshes.push(c)
  })
  if (!meshes.length) return null
  return meshes.reduce((a, b) =>
    a.geometry.attributes.position.count >= b.geometry.attributes.position.count ? a : b,
  )
}

/**
 * @param {Record<string, import('three').Object3D> | undefined} nodes
 * @param {import('three').Object3D | null} [scene] — `Water_all` 이 nodes 맵에 없을 때 전체 순회
 */
export function getWaterAllMeshFromNodes(nodes, scene) {
  let root = resolveSceneNode(nodes, 'Water_all')
  if (!root && scene) {
    scene.traverse((o) => {
      if (o.name === 'Water_all') root = o
    })
  }
  return pickWaterSurfaceMesh(root)
}

/**
 * world.glb `Water_all` — geometry.clone() 후 로컬 버텍스 파동
 * 얇은 축 방향으로 변위, 넓은 두 축 좌표로 위상(맵 스케일에 맞춰 진폭·주파수 자동)
 * 변위는 기준 면에서 한쪽(+)으로만 — 아래로 꺼지지 않음
 */
export function WaterAllWaves({ mesh }) {
  const initialRef = useRef(null)
  const workingGeoRef = useRef(null)
  const normalFrameRef = useRef(0)
  const waveMetaRef = useRef({
    dispI: 1,
    uI: 0,
    vI: 2,
    freqU: 0.05,
    freqV: 0.05,
    amp: 1,
  })

  const workingGeometry = useMemo(() => {
    if (!mesh?.isMesh || !mesh.geometry) return null
    const src = mesh.geometry
    if (!src.attributes?.position) return null
    const g = src.clone()
    g.computeVertexNormals()
    return g
  }, [mesh])

  useLayoutEffect(() => {
    if (!mesh || !workingGeometry) return
    const prevGeo = mesh.geometry
    mesh.geometry = workingGeometry
    workingGeoRef.current = workingGeometry
    initialRef.current = new Float32Array(workingGeometry.attributes.position.array)

    if (!workingGeometry.boundingBox) workingGeometry.computeBoundingBox()
    const s = new THREE.Vector3()
    workingGeometry.boundingBox.getSize(s)
    const dims = [
      { i: 0, v: s.x },
      { i: 1, v: s.y },
      { i: 2, v: s.z },
    ].sort((a, b) => b.v - a.v)
    const uI = dims[0].i
    const vI = dims[1].i
    const dispI = dims[2].i
    const spanU = Math.max(dims[0].v, 1e-4)
    const spanV = Math.max(dims[1].v, 1e-4)
    const spanMax = Math.max(spanU, spanV, 1)
    waveMetaRef.current = {
      dispI,
      uI,
      vI,
      freqU: (Math.PI * 4) / spanU,
      freqV: (Math.PI * 3) / spanV,
      amp: spanMax * 0.02,
    }

    const mat = mesh.material
    if (mat && !Array.isArray(mat) && 'flatShading' in mat) {
      mat.flatShading = true
      mat.needsUpdate = true
    }

    return () => {
      mesh.geometry = prevGeo
      workingGeometry.dispose()
      workingGeoRef.current = null
      initialRef.current = null
    }
  }, [mesh, workingGeometry])

  useFrame(({ clock }) => {
    if (DISABLE_PROCEDURAL_MAP_ANIMATIONS) return
    const geo = workingGeoRef.current
    const initial = initialRef.current
    if (!geo?.attributes?.position || !initial) return

    const pos = geo.attributes.position
    const t = clock.getElapsedTime()
    const arr = pos.array
    const { dispI, uI, vI, freqU, freqV, amp } = waveMetaRef.current

    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3
      const x0 = initial[ix]
      const y0 = initial[ix + 1]
      const z0 = initial[ix + 2]
      const coord = [x0, y0, z0]
      const u = coord[uI]
      const v = coord[vI]
      const mixed =
        Math.sin(u * freqU + t * WAVE_TIME_A) * WAVE_U_WEIGHT +
        Math.cos(v * freqV + t * WAVE_TIME_B) * WAVE_V_WEIGHT
      // [-1,1] → [0,1] : 기준 위치보다 아래(−방향)로는 내려가지 않음
      const wave = (mixed * 0.5 + 0.5) * amp

      arr[ix] = x0
      arr[ix + 1] = y0
      arr[ix + 2] = z0
      arr[ix + dispI] += wave
    }
    pos.needsUpdate = true
    normalFrameRef.current += 1
    if (normalFrameRef.current % 2 === 0) geo.computeVertexNormals()
  })

  return null
}
