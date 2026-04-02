import { Suspense, memo, useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import Player from './Player'
import { WorldModel } from './WorldModel'
import { useBrowserWidthPx } from '../hooks/useBrowserWidthPx'
import {
  getMapWorldResponsivePosition,
  getMapWorldResponsiveScale,
} from '../utils/mapViewportLayout'

/**
 * 맵 지형 컴포넌트
 * world.glb 맵 + 캐릭터만 표시, 물리엔진용 ground 유지
 * 태블릿·모바일: 브라우저(visualViewport / innerWidth) 너비로 월드 스케일·위치 조절
 */
const MapTerrain = memo(function MapTerrain() {
  const browserWidthPx = useBrowserWidthPx()

  const worldScale = useMemo(
    () => getMapWorldResponsiveScale(browserWidthPx),
    [browserWidthPx],
  )
  const worldPosition = useMemo(
    () => getMapWorldResponsivePosition(browserWidthPx),
    [browserWidthPx],
  )

  const scale = 5
  const groundLevel = 0

  return (
    <group scale={worldScale} position={worldPosition}>
      <WorldModel />

      <GroundPlane scale={scale} groundLevel={groundLevel} />

      <Player scale={scale} groundLevel={groundLevel} />
    </group>
  )
})

/**
 * 땅 plane에 물리엔진 적용 및 클릭 이벤트
 * ecctrl가 이동을 처리하므로 클릭 위치만 전달
 */
const GroundPlane = memo(function GroundPlane({ scale, groundLevel }) {
  return (
    <RigidBody type="fixed" position={[0, groundLevel, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#A8E6CF" transparent opacity={0} />
      </mesh>
    </RigidBody>
  )
})

const MapModel = memo(function MapModel() {
  return (
    <Suspense fallback={null}>
      <MapTerrain />
    </Suspense>
  )
})

export default MapModel
