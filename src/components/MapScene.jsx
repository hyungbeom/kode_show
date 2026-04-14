import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, memo, lazy } from 'react'
import { Cloud, Clouds, Environment, Lightformer, PerspectiveCamera } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { suspend } from 'suspend-react'
import MapModel from './MapModel'
import CameraSystem from './CameraSystem'
import { RapierDebugOverlay } from './RapierDebugOverlay'
import { useMapStore } from '../store/useMapStore'
import { readLayoutBrowserWidthPx } from '../utils/mapViewport'
import {
  getMapInitialOrthoZoomForWidth,
  resolveMapCameraLayoutForViewport,
} from '../utils/mapCameraLayout'
import {
  maintainTransparentSceneBackground,
  syncTransparentWebGLCanvas,
} from '../utils/syncTransparentWebGLCanvas'
/** 개발 전용 r3f-perf — 프로덕션 빌드에서는 청크 미포함 */
const ENABLE_MAP_R3F_PERF = import.meta.env.DEV === true && import.meta.env.PROD !== true

const MapR3fPerfLazy = ENABLE_MAP_R3F_PERF
  ? lazy(() => import('./MapR3fPerf').then((mod) => ({ default: mod.MapR3fPerf })))
  : null

/**
 * rapier3d-compat 기본 init 경로는 WASM을 Uint8Array로 넘겨
 * "pass a single object instead" 콘솔 경고가 난다.
 * 빈 설정 객체로 먼저 초기화하면 이후 R3F Rapier의 init()가 즉시 반환된다.
 */
function RapierCompatPrewarm() {
  suspend(
    () => import('@dimforge/rapier3d-compat').then((R) => R.init({})),
    ['rapier-compat-prewarm'],
  )
  return null
}

/** Canvas 뒤 레이어 — index.css :root --map-app-backdrop 과 동일 */
const MAP_BACKDROP_GRADIENT = 'var(--map-app-backdrop)'

/**
 * Rapier 콜라이더 와이어 — 기본 켬. 배포 시 끄려면 `.env` 에 `VITE_RAPIER_DEBUG=0`
 * (예전엔 `Physics debug={import.meta.env.DEV}` 만 켜져 있어 preview 빌드에선 안 보였음)
 */
const RAPIER_DEBUG_VISIBLE = import.meta.env.VITE_RAPIER_DEBUG !== '0'

/**
 * 맵 모드는 CameraSystem OrthographicCamera 가 makeDefault.
 * 캐릭터 모드에서 직교 카메라만 언마운트되면 기본 카메라가 한 프레임 비거나 엇갈릴 수 있어
 * 캐릭터 모드에서 Player 가 Perspective 를 lerp 하므로, 그때만 makeDefault 로 켠다.
 */
function CharacterPerspectiveCamera() {
  const followPhysicsBox = useMapStore((s) => s.followPhysicsBox)
  return (
    <PerspectiveCamera makeDefault={followPhysicsBox} fov={80} near={1} far={500000} />
  )
}

/**
 * 배경 투명 유지 — 컴포넌트는 모듈 스코프에 두어 매 렌더마다 타입이 바뀌지 않게 함
 */
const BackgroundTransparency = memo(function BackgroundTransparency() {
  const { gl, scene } = useThree()

  useEffect(() => {
    syncTransparentWebGLCanvas(gl, scene)
  }, [gl, scene])

  // Environment 등이 background 를 덮을 수 있음 — clearColor() 는 쓰지 않음(전체 버퍼 클리어와 혼동)
  useFrame(() => {
    maintainTransparentSceneBackground(gl, scene)
  })

  return null
})

/**
 * 캐릭터 모드에서 WebGL 캔버스에 브라우저 스크롤/제스처가 끼어들지 않게 함
 */
function MapCharacterModeCanvasTouch() {
  const followPhysicsBox = useMapStore((s) => s.followPhysicsBox)
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const el = gl.domElement
    el.style.touchAction = followPhysicsBox ? 'none' : 'auto'
    return () => {
      el.style.touchAction = 'auto'
    }
  }, [followPhysicsBox, gl])

  return null
}

/**
 * Physics 내부 씬 — MapScene 바깥에 정의해 리마운트 비용 감소
 */
function MapPhysicsSceneContent() {
  return (
    <>
      <BackgroundTransparency />
      <MapCharacterModeCanvasTouch />
      <CharacterPerspectiveCamera />
      <CameraSystem />

      <Environment preset="sunset" environmentIntensity={0.72}>
        <Lightformer form="rect" intensity={0.72} color="white" scale={[10, 5]} target={[0, 0, 0]} />
      </Environment>

      <ambientLight intensity={0.22} />

      <pointLight
        position={[30, 50, 30]}
        intensity={1.2}
        color="#FFE5B4"
        distance={150}
        decay={1.5}
        castShadow
      />
      <pointLight
        position={[-30, 50, -30]}
        intensity={0.95}
        color="#B8E6FF"
        distance={150}
        decay={1.5}
      />
      <pointLight
        position={[0, 60, 0]}
        intensity={1.4}
        color="#FFFFFF"
        distance={200}
        decay={1.5}
        castShadow
      />

      <spotLight
        position={[0, 120, 0]}
        angle={0.4}
        penumbra={0.3}
        intensity={1.55}
        castShadow
        color="#FFFFFF"
        distance={200}
        decay={1.5}
      />

      <Suspense fallback={null}>
        <MapModel />
      </Suspense>

      {/*{RAPIER_DEBUG_VISIBLE ? <RapierDebugOverlay /> : null}*/}
    </>
  )
}

function MapViewportOrthoSync() {
  const setMapViewportOrthoZoom = useMapStore((s) => s.setMapViewportOrthoZoom)
  const setMapDefaultCameraLayout = useMapStore((s) => s.setMapDefaultCameraLayout)
  const setMapLayoutBrowserWidthPx = useMapStore((s) => s.setMapLayoutBrowserWidthPx)

  useEffect(() => {
    const sync = () => {
      const w = readLayoutBrowserWidthPx()
      setMapLayoutBrowserWidthPx(w)
      setMapViewportOrthoZoom(getMapInitialOrthoZoomForWidth(w))
      const { orthoPosition, orbitTarget } = resolveMapCameraLayoutForViewport(w)
      setMapDefaultCameraLayout(orthoPosition, orbitTarget)
    }

    sync()
    window.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('resize', sync)
    }
  }, [setMapViewportOrthoZoom, setMapDefaultCameraLayout, setMapLayoutBrowserWidthPx])

  return null
}

/**
 * KODE Clubs 지도 씬 — zone 구조물, 넓은 구역 배치
 */
const MapScene = memo(function MapScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapViewportOrthoSync />
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
        dpr={[1, 1.5]}
        onCreated={({ gl, scene }) => {
          syncTransparentWebGLCanvas(gl, scene)
        }}
      >
        <RapierCompatPrewarm />
        <Physics gravity={[0, -9.81, 0]} debug={false}>
          {MapR3fPerfLazy && (
            <Suspense fallback={null}>
              <MapR3fPerfLazy />
            </Suspense>
          )}
          <MapPhysicsSceneContent />
        </Physics>
      </Canvas>
    </div>
  )
})

MapScene.displayName = 'MapScene'

export default MapScene
