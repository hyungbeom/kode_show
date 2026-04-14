import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { normalizeProductGlbToUnit } from '../utils/productGlbNormalize'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'
import { R3fEquipmentViewEnhancements } from './R3fEquipmentViewEnhancements'

/** 정육면체 대각선 방향 ≈35.26° — 원점을 향한 아이소메트릭 기본 시점 */
const ISO_POLAR = Math.acos(1 / Math.sqrt(3))
const ISO_DIST = 2.28 / Math.sqrt(3)
const ISO_CAMERA_POS = [
  ISO_DIST * 0.98,
  ISO_DIST * 0.94,
  ISO_DIST * 1.02,
]

function CardGlbModel({ url }) {
  const { scene } = useGLTF(url, DRACO_DECODER_URL)
  const object = useMemo(() => {
    const o = normalizeProductGlbToUnit(scene)
    o.traverse((ch) => {
      if (ch.isMesh) ch.castShadow = true
    })
    return o
  }, [scene])
  return <primitive object={object} />
}

/**
 * 업체 카드 우측 썸네일 — 제품 GLB 인라인 회전(터치 궤도)
 * @param {{ url: string }} props
 */
export default function ZoneCompanyCardGlbPreview({ url }) {
  return (
    <Canvas
      className="zone-carousel-card__glb-canvas"
      shadows
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
      }}
      camera={{ position: ISO_CAMERA_POS, fov: 38, near: 0.08, far: 80 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1
      }}
    >
      <R3fEquipmentViewEnhancements />
      <ambientLight intensity={0.62} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.89, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>
       <Suspense fallback={null}>
        <CardGlbModel url={url} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={1.45}
        maxDistance={4.6}
        target={[0, 0, 0]}
        minPolarAngle={Math.max(0.35, ISO_POLAR - 0.42)}
        maxPolarAngle={Math.min(Math.PI - 0.16, ISO_POLAR + 0.48)}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  )
}
