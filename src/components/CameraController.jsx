import { useRef, useEffect, memo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useMapStore } from '../store/useMapStore'
import { gsap } from 'gsap'
import * as THREE from 'three'

/** 전체 맵 뷰 Orthographic 줌 — 초기 진입·NAVIGATE 리셋 공통 */
const FULL_MAP_ZOOM = 5

/**
 * GSAP을 사용한 카메라 시점 전환 컨트롤러
 * Zustand 스토어의 상태 변경을 감지하여 부드럽게 카메라를 제어합니다.
 * - 마커 클릭 시 해당 건물이 아이소메트릭 뷰의 센터에 오도록 카메라를 이동시킵니다.
 * - Zone 클릭 시 줌아웃 애니메이션을 실행합니다.
 * - 초기 진입 시 맵 전체가 보이도록 줌아웃 상태로 시작합니다.
 */
function CameraController({ controlsRef }) {
  const { camera, gl } = useThree()
  const cameraTarget = useMapStore((state) => state.cameraTarget)
  const clearCameraTarget = useMapStore((state) => state.clearCameraTarget)
  const resetToFullMap = useMapStore((state) => state.resetToFullMap)
  const setResetToFullMap = useMapStore((state) => state.setResetToFullMap)
  const setMarkersVisible = useMapStore((state) => state.setMarkersVisible)
  const initialEntry = useMapStore((state) => state.initialEntry)
  const openPendingZone = useMapStore((state) => state.openPendingZone)
  const setInitialEntry = useMapStore((state) => state.setInitialEntry)
  const selectedZone = useMapStore((state) => state.selectedZone)
  const selectedZonePosition = useMapStore((state) => state.selectedZonePosition)
  const followPhysicsBox = useMapStore((state) => state.followPhysicsBox)
  const isFullMapRotating = useMapStore((state) => state.isFullMapRotating)
  const setIsFullMapRotating = useMapStore((state) => state.setIsFullMapRotating)
  
  const animationRef = useRef(null)
  const resetAnimationRef = useRef(null)
  const initialEntryAnimationRef = useRef(null)
  /** GSAP 카메라 애니메이션 중에는 궤도 useFrame이 개입하지 않도록 (리셋 시 오른쪽 튐 방지) */
  const orbitSuspendedRef = useRef(false)

  // 아이소메트릭 오프셋
  const offsetX = 200
  const offsetY = 160
  const offsetZ = 200

  // 초기 진입 시 줌아웃 상태로 시작 (전체 맵이 보이는 상태)
  useEffect(() => {
    // 추적 모드일 때는 CameraController 비활성화 (Player에서 직접 제어)
    if (followPhysicsBox) return
    if (!initialEntry) return
    if (!controlsRef?.current) return

    orbitSuspendedRef.current = true
    setIsFullMapRotating(false)

    console.log('CameraController: Initial entry - zooming out to show full map')
    
    // 기존 애니메이션 취소
    if (initialEntryAnimationRef.current) {
      initialEntryAnimationRef.current.kill()
    }
    if (animationRef.current) {
      animationRef.current.kill()
    }
    if (resetAnimationRef.current) {
      resetAnimationRef.current.kill()
    }
    
    const controls = controlsRef.current
    
    // 초기 카메라 위치 (더 멀리서 시작하여 줌인 효과)
    const startPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }
    
    // 최종 카메라 위치와 타겟 (맵 전체가 보이는 상태) - 5배 스케일에 맞게 조정
    const targetPosition = {
      x: 200,
      y: 160,
      z: 200,
    }
    
    const targetTarget = {
      x: 0,
      y: 0,
      z: 0,
    }
    
    // 맵이 5배 확대되었으므로 줌도 5배에 맞게 조정 (더 작게 줌 아웃)
    const startZoom = camera.zoom || 1
    const targetZoom = FULL_MAP_ZOOM

    // GSAP 애니메이션 생성 - 멀리서 시작해서 줌인하는 효과
    const timeline = gsap.timeline({
      onComplete: () => {
        console.log('CameraController: Initial entry animation complete - full map view, starting rotation')
        setInitialEntry(false)
        orbitSuspendedRef.current = false
        syncOrbitFromCamera()
        // 초기 진입 후에도 카메라 회전 시작
        setIsFullMapRotating(true)
        initialEntryAnimationRef.current = null
      },
    })
    
    // 카메라를 먼저 멀리서 시작 (줌 아웃 상태)
    initialEntryAnimationRef.current = timeline
      .set(camera.position, {
        x: targetPosition.x * 1.5,
        y: targetPosition.y * 1.5,
        z: targetPosition.z * 1.5,
      })
      .set(controls.target, {
        x: targetTarget.x,
        y: targetTarget.y,
        z: targetTarget.z,
      })
      .set(camera, {
        zoom: startZoom * 0.8, // 더 멀리서 시작
      })
      .to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 2,
        ease: 'power2.out',
      })
      .to(
        controls.target,
        {
          x: targetTarget.x,
          y: targetTarget.y,
          z: targetTarget.z,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            controls.update()
          },
        },
        0 // 동시에 시작
      )
      .to(
        camera,
        {
          zoom: targetZoom,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => {
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
    
    return () => {
      if (initialEntryAnimationRef.current) {
        initialEntryAnimationRef.current.kill()
      }
      orbitSuspendedRef.current = false
    }
  }, [initialEntry, camera, controlsRef, setInitialEntry, setIsFullMapRotating, followPhysicsBox])
  
  // Zone 클릭 시 줌아웃 애니메이션 트리거 (setSelectedZone에서 resetToFullMap: true 설정됨)
  // 줌아웃 애니메이션은 resetToFullMap useEffect에서 처리됨
  
  // 맵 전체 보기 모드 (줌 아웃)
  useEffect(() => {
    // 추적 모드일 때는 CameraController 비활성화 (Player에서 직접 제어)
    if (followPhysicsBox) return
    if (!resetToFullMap) return
    if (!controlsRef?.current) {
      console.log('CameraController: controlsRef not available')
      return
    }

    orbitSuspendedRef.current = true
    setIsFullMapRotating(false)

    // Zone이 선택된 상태에서는 줌아웃 애니메이션 실행 후 업체 리스트 표시
    // (selectedZone 체크 제거 - Zone 클릭 시 줌아웃 후 리스트 표시)

    console.log('CameraController: Resetting to full map view (keeping camera position)')
    
    // 기존 애니메이션 취소
    if (resetAnimationRef.current) {
      resetAnimationRef.current.kill()
    }
    if (animationRef.current) {
      animationRef.current.kill()
    }
    if (initialEntryAnimationRef.current) {
      initialEntryAnimationRef.current.kill()
    }
    
    // cameraTarget도 클리어하여 마커 클릭 애니메이션과 충돌 방지
    clearCameraTarget()
    
    const controls = controlsRef.current
    
    const initialZoom = FULL_MAP_ZOOM

    // 초기 카메라 위치와 타겟 (맵 중앙)
    const initialPosition = {
      x: 200,
      y: 160,
      z: 200,
    }
    
    const initialTarget = {
      x: 0,
      y: 0,
      z: 0,
    }
    
    // GSAP 애니메이션 - NavigationUI 클릭 시 맵 중앙으로 이동하고 줌 아웃
    const timeline = gsap.timeline({
      onComplete: () => {
        console.log('CameraController: Reset animation complete - starting rotation')
        setResetToFullMap(false)
        // NavigationUI 클릭인 경우 마커 표시
        setMarkersVisible(true)
        orbitSuspendedRef.current = false
        syncOrbitFromCamera()
        // 맵 전체 보기 모드에서 카메라 회전 시작
        setIsFullMapRotating(true)
        resetAnimationRef.current = null
      },
    })
    
    resetAnimationRef.current = timeline
      .to(camera.position, {
        x: initialPosition.x,
        y: initialPosition.y,
        z: initialPosition.z,
        duration: 1.5,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: initialTarget.x,
          y: initialTarget.y,
          z: initialTarget.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            controls.update()
          },
        },
        0 // 동시에 시작
      )
      .to(
        camera,
        {
          zoom: initialZoom,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
    
    return () => {
      if (resetAnimationRef.current) {
        resetAnimationRef.current.kill()
      }
      orbitSuspendedRef.current = false
    }
  }, [resetToFullMap, camera, controlsRef, setResetToFullMap, clearCameraTarget, setMarkersVisible, setIsFullMapRotating, followPhysicsBox])
  
  // 마커 클릭 시 카메라 이동
  useEffect(() => {
    // 추적 모드일 때는 CameraController 비활성화 (Player에서 직접 제어)
    if (followPhysicsBox) return
    if (!cameraTarget) return
    if (!controlsRef?.current) return
    
    // 기존 애니메이션 취소
    if (animationRef.current) {
      animationRef.current.kill()
    }
    
    const controls = controlsRef.current
    
    // 카메라의 현재 위치와 타겟
    const startPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }
    
    const startTarget = {
      x: controls.target.x,
      y: controls.target.y,
      z: controls.target.z,
    }
    
    // 아이소메트릭 각도 유지하면서 건물을 센터로
    // 맵이 5배 확대되었으므로 오프셋도 5배에 맞게 조정
    // 현재 카메라 각도: position [200, 160, 200] → 대각선 위에서 내려다보는 각도
    // 건물 위치를 중심으로 같은 각도 유지
    const offsetX = 200  // 아이소메트릭 오프셋
    const offsetY = 160  // 높이
    const offsetZ = 200  // 아이소메트릭 오프셋
    
    const targetPosition = {
      x: cameraTarget[0] + offsetX,
      y: cameraTarget[1] + offsetY,
      z: cameraTarget[2] + offsetZ,
    }
    
    // OrbitControls의 target을 건물 위치로 설정 (센터로 오게)
    const targetControlsTarget = {
      x: cameraTarget[0],
      y: cameraTarget[1],
      z: cameraTarget[2],
    }
    
    // Orthographic Camera의 zoom 증가 (줌인 효과)
    // 맵이 5배 확대되었으므로 줌인 값도 조정
    const startZoom = camera.zoom || 2.5
    const targetZoom = 10  // 맵 전체 보기(2.5)에서 4배 줌인 (2.5 * 4 = 10) - 적당한 거리로 조정
    
    // GSAP 애니메이션 생성
    const timeline = gsap.timeline({
      onComplete: () => {
        // 줌인 완료 후 pendingZone이 있으면 모달 열기
        openPendingZone()
        clearCameraTarget()
        animationRef.current = null
      },
    })
    
    // 카메라 위치, OrbitControls target, zoom을 동시에 애니메이션
    animationRef.current = timeline
      .to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: targetControlsTarget.x,
          y: targetControlsTarget.y,
          z: targetControlsTarget.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            controls.update()
          },
        },
        0 // 동시에 시작
      )
      .to(
        camera,
        {
          zoom: targetZoom,  // 줌인 효과
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
    
    // 컴포넌트 언마운트 시 애니메이션 정리
    return () => {
      if (animationRef.current) {
        animationRef.current.kill()
      }
    }
  }, [cameraTarget, camera, controlsRef, clearCameraTarget, openPendingZone, followPhysicsBox])
  
  // 맵 전체 보기 모드에서 카메라 회전 애니메이션
  const rotationAngleRef = useRef(0)
  /** XZ 평면 궤도 반지름·높이 (줌인 종료 위치와 맞춤 — 회전 시작 시 각도 0 가정으로 인한 튐 방지) */
  const orbitRadiusRef = useRef(Math.sqrt(200 * 200 + 200 * 200))
  const orbitHeightRef = useRef(160)
  const rotationSpeed = 0.1 // 회전 속도 (라디안/초) - 더 천천히 회전
  /** 휠로 쌓였다가 서서히 줄어드는 추가 배속 (같은 원 궤도 위에서만) */
  const speedBoostRef = useRef(0)
  const dragLastXRef = useRef(null)
  const isOrbitDragRef = useRef(false)

  /** 현재 카메라 위치에 맞춰 궤도 각·반지름·높이 동기화 */
  const syncOrbitFromCamera = () => {
    const x = camera.position.x
    const z = camera.position.z
    const r = Math.hypot(x, z)
    if (r > 1e-4) {
      orbitRadiusRef.current = r
      rotationAngleRef.current = Math.atan2(z, x)
    }
    orbitHeightRef.current = camera.position.y
  }

  // 자동 궤도 중: 휠·가로 드래그는 같은 원 위에서만 각속도/각도 조절 (OrbitControls는 CameraSystem에서 꺼짐)
  useEffect(() => {
    if (followPhysicsBox || !isFullMapRotating) return
    const el = gl.domElement
    const MAX_BOOST = 4
    const BOOST_STEP = 0.28

    const onWheel = (e) => {
      if (!useMapStore.getState().isFullMapRotating) return
      e.preventDefault()
      speedBoostRef.current = THREE.MathUtils.clamp(
        speedBoostRef.current - Math.sign(e.deltaY) * BOOST_STEP,
        0,
        MAX_BOOST
      )
    }
    const onPointerDown = (e) => {
      if (!useMapStore.getState().isFullMapRotating || e.button !== 0) return
      isOrbitDragRef.current = true
      dragLastXRef.current = e.clientX
    }
    const onPointerMove = (e) => {
      if (!isOrbitDragRef.current || dragLastXRef.current == null) return
      if (!useMapStore.getState().isFullMapRotating) return
      const dx = e.clientX - dragLastXRef.current
      dragLastXRef.current = e.clientX
      rotationAngleRef.current += dx * 0.004
    }
    const endDrag = () => {
      isOrbitDragRef.current = false
      dragLastXRef.current = null
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', endDrag)
    el.addEventListener('pointercancel', endDrag)
    el.addEventListener('pointerleave', endDrag)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', endDrag)
      el.removeEventListener('pointercancel', endDrag)
      el.removeEventListener('pointerleave', endDrag)
    }
  }, [followPhysicsBox, isFullMapRotating, gl])

  // 마커 클릭이나 Zone 선택 시 회전 중지
  useEffect(() => {
    if (cameraTarget || selectedZone) {
      if (isFullMapRotating) {
        console.log('CameraController: Stopping rotation due to cameraTarget or selectedZone')
        setIsFullMapRotating(false)
      }
    }
  }, [cameraTarget, selectedZone, isFullMapRotating, setIsFullMapRotating])
  
  useFrame((state, delta) => {
    // 추적 모드일 때는 회전 비활성화
    if (followPhysicsBox) return
    
    if (!controlsRef?.current) return

    // GSAP로 카메라 이동 중에는 궤도 보간 비활성 (리셋·초기 진입과 충돌 방지)
    if (orbitSuspendedRef.current) return

    // useEffect 동기화(ref) 대신 매 프레임 스토어를 읽음 — 드래그/휠 직후에도 궤도가 한 박자 더 먹지 않음
    if (!useMapStore.getState().isFullMapRotating) {
      return
    }
    
    // 마커 클릭이나 Zone 선택 시 회전 중지
    if (cameraTarget || selectedZone) {
      return
    }
    
    const controls = controlsRef.current

    const BOOST_DECAY = 1.8
    speedBoostRef.current *= Math.exp(-BOOST_DECAY * delta)

    // 회전 각도 업데이트 (휠로 쌓인 배속은 같은 원 궤도에서만 적용)
    rotationAngleRef.current += rotationSpeed * (1 + speedBoostRef.current) * delta

    const radius = orbitRadiusRef.current
    const height = orbitHeightRef.current

    // 원형 궤도상의 위치 계산 (XZ 평면, 맵 중심 origin 기준)
    const newX = radius * Math.cos(rotationAngleRef.current)
    const newZ = radius * Math.sin(rotationAngleRef.current)

    // 카메라 위치 업데이트 (더 부드럽게 보간 - 흔들림 방지)
    const currentPos = state.camera.position
    const targetPos = new THREE.Vector3(newX, height, newZ)
    // 더 부드러운 보간으로 흔들림 방지
    currentPos.lerp(targetPos, 1 - Math.exp(-3 * delta))
    
    // 카메라가 맵 중심을 바라보도록 설정
    controls.target.set(0, 0, 0)
    controls.update()
  })
  
  // 추적 모드일 때는 CameraController 비활성화 (Player에서 직접 제어)
  // 이 컴포넌트는 side effect만 수행하고 렌더링은 하지 않습니다
  return null
}

export default memo(CameraController)
