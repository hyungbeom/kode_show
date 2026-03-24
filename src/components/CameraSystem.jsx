import { memo, useRef, useEffect } from 'react'
import { OrthographicCamera, OrbitControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import CameraController from './CameraController'
import { useMapStore } from '../store/useMapStore'
import * as THREE from 'three'

/**
 * 카메라 시스템 컴포넌트
 * 리렌더링 영향 없이 독립적으로 관리되는 카메라 관련 컴포넌트
 */
const CameraSystem = memo(() => {
  const controlsRef = useRef()
  const followPhysicsBox = useMapStore((state) => state.followPhysicsBox)
  const setIsFullMapRotating = useMapStore((state) => state.setIsFullMapRotating)
  const { camera } = useThree()
  const setCameraTransitionComplete = useMapStore((state) => state.setCameraTransitionComplete)
  const isFullMapRotating = useMapStore((state) => state.isFullMapRotating)
  const cameraTarget = useMapStore((state) => state.cameraTarget)
  const selectedZone = useMapStore((state) => state.selectedZone)
  
  // 카메라 전환 애니메이션용 ref
  const transitionStartRef = useRef(null)
  const transitionTargetRef = useRef(null)
  const transitionLookAtRef = useRef(null)
  const transitionStartLookAtRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const transitionProgressRef = useRef(0)
  const prevFollowPhysicsBoxRef = useRef(followPhysicsBox)
  const isInitialMountRef = useRef(true)
  const transitionDuration = 1.5
  
  // 초기 마운트 완료 표시 및 전환 완료 상태 설정
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      // 초기 마운트 시 전환 완료 상태로 설정 (애니메이션 없이 시작)
      setCameraTransitionComplete(true)
    }
  }, [setCameraTransitionComplete])
  
  // followPhysicsBox 변경 시 전환 타겟 설정
  useEffect(() => {
    // 추적 모드일 때는 전환 애니메이션 실행하지 않음
    if (followPhysicsBox) {
      return
    }
    
    // 초기 마운트 시에는 전환 애니메이션 실행하지 않음
    if (isInitialMountRef.current) {
      prevFollowPhysicsBoxRef.current = followPhysicsBox
      return
    }
    
    if (prevFollowPhysicsBoxRef.current === followPhysicsBox) {
      return
    }
    
    // 전환 시작 시 완료 상태를 false로 설정
    setCameraTransitionComplete(false)
    
    // 다음 프레임에서 현재 카메라 위치를 정확히 캡처
    const captureFrame = () => {
      const startPosition = new THREE.Vector3(
        camera.position.x,
        camera.position.y,
        camera.position.z
      )
      
      // 현재 카메라가 바라보는 방향 계산
      const currentDirection = new THREE.Vector3()
      camera.getWorldDirection(currentDirection)
      const startLookAt = startPosition.clone().add(currentDirection.multiplyScalar(10))
      
      transitionStartRef.current = startPosition.clone()
      transitionStartLookAtRef.current = startLookAt.clone()
      transitionProgressRef.current = 0
      isTransitioningRef.current = true
      
      // 맵 뷰로 전환: OrthographicCamera 위치로
      transitionTargetRef.current = new THREE.Vector3(200, 160, 200)
      transitionLookAtRef.current = new THREE.Vector3(0, 0, 0)
      
      prevFollowPhysicsBoxRef.current = followPhysicsBox
    }
    
    // 다음 프레임에서 캡처
    requestAnimationFrame(captureFrame)
  }, [followPhysicsBox, camera, setCameraTransitionComplete])
  
  // 맵 전체 보기 모드에서 카메라 회전 애니메이션
  const rotationAngleRef = useRef(0)
  const rotationSpeed = 0.15 // 회전 속도 (라디안/초) - 느리게 조정
  
  // useFrame에서 부드러운 카메라 전환 처리 및 회전 애니메이션
  // 추적 모드일 때는 전환 애니메이션만 처리하고, 완료 후에는 ecctrl가 제어
  useFrame((state, delta) => {
    // 추적 모드이고 전환이 완료된 경우에는 ecctrl가 카메라를 제어하므로 여기서는 건드리지 않음
    if (followPhysicsBox && !isTransitioningRef.current) {
      return
    }
    
    // 맵 전체 보기 모드에서 카메라 회전은 CameraController에서 처리하므로 여기서는 비활성화
    // (중복 처리로 인한 카메라 흔들림 방지)
    
    if (isTransitioningRef.current && transitionStartRef.current && transitionTargetRef.current) {
      // 전환 진행도 업데이트
      transitionProgressRef.current += delta / transitionDuration
      
      if (transitionProgressRef.current >= 1) {
        // 전환 완료
        transitionProgressRef.current = 1
        isTransitioningRef.current = false
        
        // 최종 위치 설정
        state.camera.position.copy(transitionTargetRef.current)
        if (transitionLookAtRef.current) {
          state.camera.lookAt(transitionLookAtRef.current)
        }
        
        // OrthographicCamera인 경우 zoom 설정
        if (state.camera instanceof THREE.OrthographicCamera && !followPhysicsBox) {
          state.camera.zoom = 2.5
          state.camera.updateProjectionMatrix()
        }
        
        // 전환 완료 상태를 스토어에 저장
        setCameraTransitionComplete(true)
      } else {
        // 부드럽게 보간 (easeInOut)
        const t = transitionProgressRef.current
        const easedT = t < 0.5 
          ? 2 * t * t 
          : 1 - Math.pow(-2 * t + 2, 2) / 2
        
        // 위치 보간
        const currentPos = transitionStartRef.current.clone().lerp(
          transitionTargetRef.current,
          easedT
        )
        state.camera.position.copy(currentPos)
        
        // lookAt 보간
        if (transitionLookAtRef.current && transitionStartLookAtRef.current) {
          const lookAtPos = transitionStartLookAtRef.current.clone().lerp(
            transitionLookAtRef.current,
            easedT
          )
          state.camera.lookAt(lookAtPos)
        }
        
        // OrthographicCamera인 경우 zoom도 보간
        if (state.camera instanceof THREE.OrthographicCamera && !followPhysicsBox) {
          const startZoom = 1
          const targetZoom = 2.5
          const currentZoom = startZoom + (targetZoom - startZoom) * easedT
          state.camera.zoom = currentZoom
          state.camera.updateProjectionMatrix()
        }
      }
    }
  })
  
  // 추적 모드일 때는 아무것도 렌더링하지 않음 (ecctrl가 카메라 제어)
  // 모든 hooks 호출 후에 조건부 return
  if (followPhysicsBox) {
    return null
  }
  
  return (
    <>
      {/* 맵 뷰일 때만 OrthographicCamera 렌더링 */}
      <OrthographicCamera
        makeDefault
        position={[200, 160, 200]}
        zoom={2.5}
        near={0.1}
        far={500000}
      />
      
      {/* 카메라 컨트롤러 (GSAP 애니메이션) */}
      <CameraController controlsRef={controlsRef} />
      
      {/* 오빗 컨트롤 - 마우스 드래그 회전, 휠 줌, 패닝 지원 */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableRotate={true}
        enableZoom={true}
        minZoom={0.5}
        maxZoom={50}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0, 0]}
        onStart={() => setIsFullMapRotating(false)}
      />
    </>
  )
})

CameraSystem.displayName = 'CameraSystem'

export default CameraSystem
