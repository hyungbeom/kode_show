import { useRef, memo, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Ecctrl from 'ecctrl'
import { useMapStore } from '../store/useMapStore'

/**
 * Among Us 모델 컴포넌트
 */
function AmongUsModel() {
  const { scene } = useGLTF('/models/amongus.glb')
  
  // 모델을 복제하고 모든 메시에 그림자 속성 추가
  const clonedScene = scene.clone()
  clonedScene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  
  // 모델 스케일 및 위치 조정
  return (
    <primitive 
      object={clonedScene} 
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
    />
  )
}

// 모델 프리로드
useGLTF.preload('/models/amongus.glb')

/**
 * Player 컴포넌트 - ecctrl를 사용한 캐릭터 컨트롤러
 * 키보드 입력(WASD)으로 이동하는 3인칭 캐릭터
 */
const Player = memo(function Player({ scale = 5, groundLevel = 0 }) {
  const ecctrlRef = useRef()
  
  const setPhysicsBoxPosition = useMapStore((state) => state.setPhysicsBoxPosition)
  const followPhysicsBox = useMapStore((state) => state.followPhysicsBox)

  // 위치 추적용 ref
  const currentPositionRef = useRef([0, groundLevel + 5, 0])

  // ecctrl의 위치 추적 (Zustand 스토어 업데이트용)
  useFrame(() => {
    if (!ecctrlRef.current || !followPhysicsBox) return
    
    const characterRef = ecctrlRef.current?.characterRef
    if (characterRef?.current?.api) {
      const translation = characterRef.current.api.translation()
      if (translation) {
        currentPositionRef.current = [translation.x, translation.y, translation.z]
        setPhysicsBoxPosition([translation.x, translation.y, translation.z])
      }
    }
  })
  
  return (
    <Ecctrl
      ref={ecctrlRef}
      position={[0, groundLevel + 5, 0]}
      maxVelLimit={18}
      jumpVel={8}
      mode="FixedCamera"
      turnSpeed={5}
      fixedCamRotMult={2}
      camInitDis={-12 * scale}
      camMaxDis={-15 * scale}
      camMinDis={-8 * scale}
      camInitDir={{ x: 0, y: 1.2 }}
      camTargetPos={{ x: 0, y: 4.5 * scale, z: 0 }}
      camFollowMult={15}
      autoLookAt={true}
      camCollision={true}
      camCollisionOffset={0.7}
      enableGroundCheck={true}
      slopeMaxAngle={45}
      slopeRayOriginOffest={0.5}
      slopeRayLength={2}
      slopeRayDir={{ x: 0, y: -1, z: 0 }}
      slopeUpExtraForce={0.1}
      slopeDownExtraForce={0.2}
      autoBalance={true}
      autoBalanceSpringMass={0.3}
      autoBalanceDampingC={0.03}
      disableFollowCam={!followPhysicsBox}
    >
      <Suspense fallback={
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#FF6B6B" />
        </mesh>
      }>
        <AmongUsModel />
      </Suspense>
    </Ecctrl>
  )
})

Player.displayName = 'Player'

export default Player
