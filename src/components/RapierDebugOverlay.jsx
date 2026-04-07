import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import * as THREE from 'three'

function isFiniteBuffer(arr) {
  if (!arr || !arr.length) return false
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) return false
  }
  return true
}

/**
 * Rapier `world.debugRender()` 와이어 (동적 콜라이더는 Rapier가 붉은 계열 vertex color 사용).
 * 투명 캔버스·맵 메시 뒤에 묻히지 않게 depthTest 끔.
 *
 * 물리 상태가 깨지거나 한 프레임에 NaN 정점이 나올 때 `computeBoundingSphere` 경고가 무한 반복될 수 있어
 * 유효할 때만 지오메트리를 갈아끼운다.
 */
export function RapierDebugOverlay() {
  const ref = useRef(/** @type {THREE.LineSegments | null} */ (null))
  const { world } = useRapier()
  /** 빈 bufferGeometry 는 boundingSphere NaN 유발 가능 — 초기값은 유한한 퇴화 선분 */
  const fallbackPositions = useMemo(() => new Float32Array([0, 0, 0, 0, 0, 0]), [])

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const buffers = world.debugRender()
    const verts = buffers.vertices
    const vLen = verts?.length ?? 0
    if (vLen < 6 || vLen % 3 !== 0) return
    if (!isFiniteBuffer(verts)) return

    const colorsIn = buffers.colors
    if (colorsIn?.length) {
      const expectedColors = (vLen / 3) * 4
      if (colorsIn.length !== expectedColors || !isFiniteBuffer(colorsIn)) return
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
    if (colorsIn?.length) {
      geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colorsIn), 4))
    } else {
      const n = vLen / 3
      const c = new Float32Array(n * 4)
      for (let i = 0; i < n * 4; i += 4) {
        c[i] = 1
        c[i + 1] = 0.15
        c[i + 2] = 0.12
        c[i + 3] = 1
      }
      geom.setAttribute('color', new THREE.BufferAttribute(c, 4))
    }
    mesh.geometry.dispose()
    mesh.geometry = geom
  })

  return (
    <lineSegments ref={ref} frustumCulled={false} renderOrder={100000}>
      <bufferGeometry>
        <float32BufferAttribute attach="attributes-position" args={[fallbackPositions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        depthTest={false}
        depthWrite={false}
        transparent
        toneMapped={false}
      />
    </lineSegments>
  )
}
