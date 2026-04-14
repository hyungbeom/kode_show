import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { normalizeProductGlbToUnit } from '../utils/productGlbNormalize'

function Model({ url }) {
  const { scene } = useGLTF(url)
  const object = useMemo(() => normalizeProductGlbToUnit(scene), [scene])
  return <primitive object={object} />
}

/**
 * 제품 이미지 UI 전체 영역을 채우는 3D 뷰 — 터치·드래그로 궤도 회전
 * @param {{ glbUrl: string }} props
 */
export default function ProductFullscreenGlbCanvas({ glbUrl }) {
  return (
    <Canvas
      className="product-fullscreen-glb-canvas"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        touchAction: 'none',
      }}
      camera={{ position: [0, 0.4, 3.25], fov: 42, near: 0.08, far: 80 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 1)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1
      }}
    >
      <ambientLight intensity={0.58} />
      <directionalLight position={[6, 12, 8]} intensity={1.12} />
      <directionalLight position={[-5, 4, -6]} intensity={0.42} />
      <Grid
        renderOrder={-1}
        position={[0, -0.88, 0]}
        side={THREE.DoubleSide}
        infiniteGrid
        args={[120, 120]}
        cellSize={0.38}
        cellThickness={0.72}
        cellColor="#9eb6d4"
        sectionSize={1.9}
        sectionThickness={1.05}
        sectionColor="#c8daf2"
        fadeDistance={48}
        fadeStrength={0.55}
      />
      <Suspense fallback={null}>
        <Model url={glbUrl} />
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={1.35}
        maxDistance={6.5}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI - 0.12}
        enableDamping
        dampingFactor={0.085}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
