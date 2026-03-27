import { useGLTF, useTexture } from '@react-three/drei'
import { useFrame, createPortal } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { resolveSceneNode } from '../utils/gltfNodeUtils'

const SCREEN_GLTF_URL = '/models/screen.glb'
const NEON_URL = '/neon.png'

const CUBE001_KEYS = ['큐브001', 'cube001', 'Cube001', 'CUBE001']

function resolveCube001(nodes) {
  if (!nodes) return null
  for (const k of CUBE001_KEYS) {
    const n = nodes[k]
    if (n) return n
  }
  const resolved = resolveSceneNode(nodes, 'cube001')
  if (resolved) return resolved
  const want = 'cube001'
  for (const key of Object.keys(nodes)) {
    const norm = key.replace(/[\u0000-\u001F\u007F]/g, '').toLowerCase()
    if (norm === want) return nodes[key]
  }
  return null
}

/**
 * screen.glb 패널 + neon 을 cube001 에만 붙입니다.
 */
export function NeonScreen({ nodes }) {
  const { nodes: screenNodes } = useGLTF(SCREEN_GLTF_URL)
  const neonTexture = useTexture(NEON_URL)

  const anchor = useMemo(() => resolveCube001(nodes), [nodes])

  const screenGeo = useMemo(() => {
    if (!screenNodes) return null
    const tryKeys = ['cube001', 'Cube001', 'CUBE001', '큐브001']
    for (const k of tryKeys) {
      const m = screenNodes[k]
      if (m?.isMesh?.geometry) return m.geometry
    }
    const resolved = resolveSceneNode(screenNodes, 'cube001')
    return resolved?.geometry ?? null
  }, [screenNodes])

  useLayoutEffect(() => {
    neonTexture.wrapS = THREE.RepeatWrapping
    neonTexture.wrapT = THREE.RepeatWrapping
    neonTexture.repeat.y = -1
    neonTexture.offset.y = 1
    neonTexture.needsUpdate = true
  }, [neonTexture])

  useFrame(() => {
    neonTexture.offset.x -= 0.005
  })

  if (!screenGeo || !anchor) return null

  return createPortal(
    <group position={[0, 0, 0.02]}>
      <mesh geometry={screenGeo} frustumCulled={false}>
        <meshStandardMaterial
          map={neonTexture}
          emissive="#ffffff"
          emissiveMap={neonTexture}
          emissiveIntensity={2}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>,
    anchor
  )
}

useGLTF.preload(SCREEN_GLTF_URL)
useTexture.preload(NEON_URL)
