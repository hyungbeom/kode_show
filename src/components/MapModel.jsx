import { Suspense, memo } from 'react'
import { RigidBody } from '@react-three/rapier'
import Player from './Player'
import { WorldModel } from './WorldModel'

/**
 * 맵 지형 컴포넌트
 * world.glb 맵 + 캐릭터만 표시, 물리엔진용 ground 유지
 */
const MapTerrain = memo(function MapTerrain() {
  const scale = 5
  const groundLevel = 0

  return (
    <group position={[0, 0, 0]}>
      {/* world.glb 맵 모델 */}
      <WorldModel />

      {/* 물리엔진용 바닥 - 캐릭터 이동 지원 */}
      <GroundPlane scale={scale} groundLevel={groundLevel} />

      {/* Player 캐릭터 */}
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
