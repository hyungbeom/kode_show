import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, memo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import MapModel from './MapModel'
import CameraSystem from './CameraSystem'

/** div 그라데이션과 동일 톤 — Canvas 뒤 레이어 */
const MAP_BACKDROP_GRADIENT =
  'linear-gradient(to bottom, #CCFFCC 0%, #B8E6CC 20%, #87CEEB 45%, #5F9EA0 70%, #4682B4 100%)'

/**
 * 배경 투명 유지 — 컴포넌트는 모듈 스코프에 두어 매 렌더마다 타입이 바뀌지 않게 함
 */
const BackgroundTransparency = memo(function BackgroundTransparency() {
  const { gl, scene } = useThree()

  useEffect(() => {
    gl.setClearColor(0x000000, 0)
    // Three.js 런타임: 투명 캔버스 (R3F 관례)
    // eslint-disable-next-line react-hooks/immutability -- three Scene
    scene.background = null
    // eslint-disable-next-line react-hooks/immutability -- WebGLRenderer.domElement
    gl.domElement.style.backgroundColor = 'transparent'
  }, [gl, scene])

  useFrame(() => {
    gl.setClearColor(0x000000, 0)
    if (scene.background !== null) {
      // eslint-disable-next-line react-hooks/immutability -- three Scene
      scene.background = null
    }
  })

  return null
})

/**
 * Physics 내부 씬 — MapScene 바깥에 정의해 리마운트 비용 감소
 */
function MapPhysicsSceneContent() {
  return (
    <>
      <BackgroundTransparency />
      <color attach="background" args={['transparent']} />
      <CameraSystem />

      <Environment preset="sunset">
        <Lightformer form="rect" intensity={1} color="white" scale={[10, 5]} target={[0, 0, 0]} />
      </Environment>

      <ambientLight intensity={0.3} />

      <directionalLight
        position={[80, 60, 80]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
      />

      <directionalLight position={[-60, 50, -60]} intensity={0.6} color="#FFE5B4" />

      <pointLight
        position={[30, 50, 30]}
        intensity={1.5}
        color="#FFE5B4"
        distance={150}
        decay={1.5}
        castShadow
      />
      <pointLight
        position={[-30, 50, -30]}
        intensity={1.2}
        color="#B8E6FF"
        distance={150}
        decay={1.5}
      />
      <pointLight
        position={[0, 60, 0]}
        intensity={1.8}
        color="#FFFFFF"
        distance={200}
        decay={1.5}
        castShadow
      />

      <spotLight
        position={[0, 120, 0]}
        angle={0.4}
        penumbra={0.3}
        intensity={2.0}
        castShadow
        color="#FFFFFF"
        distance={200}
        decay={1.5}
      />

      <Suspense fallback={null}>
        <MapModel />
      </Suspense>
    </>
  )
}

/**
 * KODE Clubs 지도 씬 — zone 구조물, 넓은 구역 배치
 */
const MapScene = memo(function MapScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          background: MAP_BACKDROP_GRADIENT,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Canvas
        shadows
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'transparent',
        }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 2]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          scene.background = null
          gl.clearColor(0, 0, 0, 0)
          gl.domElement.style.backgroundColor = 'transparent'
        }}
      >
        <Physics gravity={[0, -9.81, 0]} debug={false}>
          <MapPhysicsSceneContent />
        </Physics>
      </Canvas>
    </div>
  )
})

MapScene.displayName = 'MapScene'

export default MapScene
