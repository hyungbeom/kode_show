import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Center,
  ContactShadows,
  Environment,
  Grid,
  MeshTransmissionMaterial,
  Text3D,
} from '@react-three/drei'
import * as THREE from 'three'
import { useState } from 'react'
import './LoadingScreen.css'

/** three.js 예제 JSON — 기하 산세리프(볼드), Vite에서 경로 이슈 없이 CDN 사용 */
const TEXT3D_FONT_URL =
  'https://cdn.jsdelivr.net/npm/three@0.182.0/examples/fonts/helvetiker_bold.typeface.json'

function GlassEnvexTitle() {
  const group = useRef(/** @type {THREE.Group | null} */ (null))

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={group} position={[0, 0.15, 0]}>
      <Center>
        <Text3D
          font={TEXT3D_FONT_URL}
          castShadow
          receiveShadow
          curveSegments={20}
          bevelEnabled
          bevelThickness={0.08}
          bevelSize={0.04}
          bevelOffset={0}
          bevelSegments={4}
          size={1}
          height={0.42}
          lineHeight={0.9}
          letterSpacing={0.04}
        >
          ENVEX
          <MeshTransmissionMaterial
            backside
            backsideThickness={0.3}
            samples={10}
            resolution={512}
            transmission={0.92}
            roughness={0.16}
            thickness={0.65}
            ior={1.52}
            chromaticAberration={0.14}
            anisotropicBlur={0.12}
            distortion={0.12}
            distortionScale={0.18}
            temporalDistortion={0}
            attenuationDistance={0.45}
            attenuationColor="#e0f2fe"
            color="#7dd3fc"
            envMapIntensity={1.15}
          />
        </Text3D>
      </Center>
    </group>
  )
}

function LoadingScene3D() {
  return (
    <>
      <color attach="background" args={['#e8f4fc']} />
      <fog attach="fog" args={['#e8f4fc', 12, 48]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 12, 7]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-4, 6, -3]} intensity={0.45} color="#dbeafe" />

      <Environment preset="city" environmentIntensity={0.85} />

      <Suspense fallback={null}>
        <GlassEnvexTitle />
      </Suspense>

      <ContactShadows
        position={[0, -1.22, 0]}
        opacity={0.5}
        scale={28}
        blur={2.8}
        far={9}
        frames={1}
        color="#0c4a6e"
      />

      <Grid
        renderOrder={-1}
        position={[0, -1.23, 0]}
        infiniteGrid
        cellSize={0.45}
        cellThickness={0.55}
        cellColor="#93c5fd"
        sectionSize={4.5}
        sectionThickness={1}
        sectionColor="#3b82f6"
        fadeDistance={46}
        fadeStrength={0.85}
      />
    </>
  )
}

/**
 * 로딩 화면 — ENVEX 3D 글래스 타포 + 그리드 / 접촉 그림자 (drei Text3D + MeshTransmissionMaterial)
 * - landing: ENTER만 표시 (첫 진입), 자동 진행 없음
 * - room: 업체 룸 전환 시 프로그레스 링 + onComplete
 */
export default function LoadingScreen({ onComplete, isInitial = false, mode = 'room', onEnter }) {
  const [progress, setProgress] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const isLanding = mode === 'landing'

  useEffect(() => {
    if (isLanding) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            onCompleteRef.current()
          }, 500)
          return 100
        }
        return prev + 2
      })
    }, 30)

    return () => clearInterval(interval)
  }, [isLanding])

  return (
    <div className={`loading-screen ${isInitial ? 'initial-loading' : ''}`}>
      <div className="loading-canvas-wrap" aria-hidden>
        <Canvas
          className="loading-canvas"
          shadows="soft"
          dpr={[1, 1.75]}
          camera={{ position: [5.2, 3.4, 6.8], fov: 38, near: 0.1, far: 80 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl }) => {
            gl.shadowMap.enabled = true
            gl.shadowMap.type = THREE.PCFSoftShadowMap
          }}
        >
          <LoadingScene3D />
        </Canvas>
      </div>

      <div className="loading-content loading-content--overlay">
        <h2 className={`loading-subtitle${isLanding ? ' loading-subtitle--landing' : ''}`}>
          2026 ENVEX · Environmental Technology &amp; Green Energy
        </h2>

        {isLanding ? (
          <button
            type="button"
            className="loading-enter"
            onClick={() => onEnter?.()}
          >
            <span className="loading-enter__ring" aria-hidden />
            <span className="loading-enter__label">ENTER</span>
          </button>
        ) : (
          <div className="loading-circle">
            <svg className="loading-circle-svg" viewBox="0 0 100 100">
              <circle
                className="loading-circle-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#1a1a2e"
                strokeWidth="2"
              />
              <circle
                className="loading-circle-progress"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <span className="loading-percentage">{progress}%</span>
          </div>
        )}
      </div>

      <div className="loading-cookie">
        By continuing to use this website, you agree to the use of cookies which allow us to measure user
        behaviour on our site, for more information{' '}
        <a href="#" className="cookie-link">
          view our cookie policy.
        </a>
      </div>
    </div>
  )
}
