import { useRef, useEffect, memo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useMapStore } from '../store/useMapStore'
import { getNavigateResetCamera } from '../config/mapNavigateReset'
import { getZoneCameraFramingForWidth } from '../utils/mapZoneCameraFraming'
import { gsap } from 'gsap'
import * as THREE from 'three'

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
  const setMarkersVisible = useMapStore((state) => state.setMarkersVisible)
  const initialEntry = useMapStore((state) => state.initialEntry)
  const openPendingZone = useMapStore((state) => state.openPendingZone)
  const setInitialEntry = useMapStore((state) => state.setInitialEntry)
  const selectedZone = useMapStore((state) => state.selectedZone)
  const followPhysicsBox = useMapStore((state) => state.followPhysicsBox)
  const isFullMapRotating = useMapStore((state) => state.isFullMapRotating)
  const setIsFullMapRotating = useMapStore((state) => state.setIsFullMapRotating)
  const selectedArea = useMapStore((state) => state.selectedArea)
  const pendingZone = useMapStore((state) => state.pendingZone)
  const mapViewportOrthoZoom = useMapStore((state) => state.mapViewportOrthoZoom)
  const mapDefaultOrthoPosition = useMapStore((state) => state.mapDefaultOrthoPosition)
  const mapDefaultOrbitTarget = useMapStore((state) => state.mapDefaultOrbitTarget)
  const mapLayoutBrowserWidthPx = useMapStore((state) => state.mapLayoutBrowserWidthPx)
  const worldGlbBoundsCenter = useMapStore((state) => state.worldGlbBoundsCenter)

  const animationRef = useRef(null)
  const resetAnimationRef = useRef(null)
  const initialEntryAnimationRef = useRef(null)
  /** GSAP 카메라 애니메이션 중에는 궤도 useFrame이 개입하지 않도록 (리셋 시 오른쪽 튐 방지) */
  const orbitSuspendedRef = useRef(false)

  /** initialEntry: 동기화만 하고 자동 궤도는 끔 → OrbitControls로 직접 조작 */
  useEffect(() => {
    if (followPhysicsBox) return
    if (!initialEntry) return
    if (!controlsRef?.current) return

    if (initialEntryAnimationRef.current) {
      initialEntryAnimationRef.current.kill()
      initialEntryAnimationRef.current = null
    }
    if (animationRef.current) {
      animationRef.current.kill()
    }
    if (resetAnimationRef.current) {
      resetAnimationRef.current.kill()
    }

    const controls = controlsRef.current
    controls.target.set(
      mapDefaultOrbitTarget[0],
      mapDefaultOrbitTarget[1],
      mapDefaultOrbitTarget[2],
    )
    camera.position.set(
      mapDefaultOrthoPosition[0],
      mapDefaultOrthoPosition[1],
      mapDefaultOrthoPosition[2],
    )
    camera.zoom = mapViewportOrthoZoom
    camera.updateProjectionMatrix()
    controls.update()

    syncOrbitFromCamera()
    setInitialEntry(false)
    orbitSuspendedRef.current = false
    setIsFullMapRotating(false)
  }, [
    initialEntry,
    camera,
    controlsRef,
    setInitialEntry,
    setIsFullMapRotating,
    followPhysicsBox,
    mapViewportOrthoZoom,
    mapDefaultOrthoPosition,
    mapDefaultOrbitTarget,
  ])

  // Zone 클릭 시 줌아웃 애니메이션 트리거 (setSelectedZone에서 resetToFullMap: true 설정됨)
  // 줌아웃 애니메이션은 resetToFullMap useEffect에서 처리됨
  
  // 맵 전체 보기 모드 (줌 아웃)
  useEffect(() => {
    // 추적 모드일 때는 CameraController 비활성화 (Player에서 직접 제어)
    if (followPhysicsBox) return
    if (!resetToFullMap) return
    if (!controlsRef?.current) return

    orbitSuspendedRef.current = true
    setIsFullMapRotating(false)
    useMapStore.setState({ mapNavigateWorldDecorSpinActive: false })

    // Zone이 선택된 상태에서는 줌아웃 애니메이션 실행 후 업체 리스트 표시
    // (selectedZone 체크 제거 - Zone 클릭 시 줌아웃 후 리스트 표시)

    
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

    // Navigate 모드 목표 pose (직교 위치 · 타깃 · 줌)
    const { position: endPosition, target: endTarget, zoom: endZoom } = getNavigateResetCamera(
      mapDefaultOrthoPosition,
      mapDefaultOrbitTarget,
      mapViewportOrthoZoom,
      mapLayoutBrowserWidthPx,
      worldGlbBoundsCenter,
    )

    // GSAP — NAVIGATE 등에서 Navigate 모드로 전환
    const timeline = gsap.timeline({
      onComplete: () => {
        // Navigate 모드 종료 자세와 스토어 mapDefault* 가 다르면 resetToFullMap false 직후
        // CameraSystem useLayoutEffect 가 옛 mapDefault 로 카메라를 덮어 최종 구도가 바뀌는 현상 방지
        useMapStore.setState({
          mapDefaultOrthoPosition: [endPosition.x, endPosition.y, endPosition.z],
          mapDefaultOrbitTarget: [endTarget.x, endTarget.y, endTarget.z],
          mapViewportOrthoZoom: endZoom,
          resetToFullMap: false,
          mapNavigateWorldDecorSpinActive: true,
        })
        setMarkersVisible(true)
        orbitSuspendedRef.current = false
        syncOrbitFromCamera()
        // 최초 맵 진입(initialEntry)과 동일: 자동 궤도 회전 없음 — 사용자가 오빗 조작
        setIsFullMapRotating(false)
        resetAnimationRef.current = null
      },
    })
    
    resetAnimationRef.current = timeline
      .to(camera.position, {
        x: endPosition.x,
        y: endPosition.y,
        z: endPosition.z,
        duration: 1.5,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: endTarget.x,
          y: endTarget.y,
          z: endTarget.z,
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
          zoom: endZoom,
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
  }, [
    resetToFullMap,
    camera,
    controlsRef,
    clearCameraTarget,
    setMarkersVisible,
    setIsFullMapRotating,
    followPhysicsBox,
    mapViewportOrthoZoom,
    mapDefaultOrthoPosition,
    mapDefaultOrbitTarget,
    mapLayoutBrowserWidthPx,
    worldGlbBoundsCenter,
  ])
  
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
    
    const zoneKey = pendingZone ?? selectedArea
    const framing = getZoneCameraFramingForWidth(zoneKey, mapLayoutBrowserWidthPx)
    const sx = framing.cameraShiftX ?? 0
    const sy = framing.cameraShiftY ?? 0
    const sz = framing.cameraShiftZ ?? 0

    // offset: 카메라만 타깃에서 벌어지는 아이소 거리 / cameraShift: 카메라·타깃 동일 평행이동(시선 유지·회전 없음)
    const targetPosition = {
      x: cameraTarget[0] + framing.offsetX + sx,
      y: cameraTarget[1] + framing.offsetY + sy,
      z: cameraTarget[2] + framing.offsetZ + sz,
    }

    const targetControlsTarget = {
      x: cameraTarget[0] + sx,
      y: cameraTarget[1] + sy,
      z: cameraTarget[2] + sz,
    }
    
    const targetZoom = framing.targetZoom
    const zoomDuration = framing.duration

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
        duration: zoomDuration,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: targetControlsTarget.x,
          y: targetControlsTarget.y,
          z: targetControlsTarget.z,
          duration: zoomDuration,
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
          zoom: targetZoom,
          duration: zoomDuration,
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
  }, [
    cameraTarget,
    camera,
    controlsRef,
    clearCameraTarget,
    openPendingZone,
    followPhysicsBox,
    selectedArea,
    pendingZone,
    mapLayoutBrowserWidthPx,
  ])
  
  // 맵 전체 보기: 정면 기준 좌우 왕복 + 반주기 높이/반경 변조 (메비우스 띠 느낌, 360° 원형 아님)
  /** 위상 t — 시간에 따라 증가, sin(t)로 좌우, sin(t/2)로 높이·반경에 한 번 꼬이는 느낌 */
  const phaseRef = useRef(0)
  /** 현재 정면 방향의 방위각(라디안) — 초기 (200,160,200) 기준 */
  const baseAzimuthRef = useRef(Math.atan2(200, 200))
  const orbitRadiusRef = useRef(Math.sqrt(200 * 200 + 200 * 200))
  const orbitHeightRef = useRef(160)
  /**
   * 방위각 흔들림. sin(u) 부호와 "화면 왼쪽"은 씬 좌표계와 안 맞을 수 있음.
   * 이전엔 sin<0에만 큰 값을 줬는데, 체감상 왼쪽이 sin>0 구간이면 효과가 안 보였음.
   * → 큰 스윙을 sin≥0 쪽에 두고, 전체를 한쪽으로 밀어 bias 추가.
   */
  const AZIMUTH_SWING_NARROW = 0.82
  const AZIMUTH_SWING_WIDE = 1.85
  /** 전체 궤도를 방위각 감소 방향으로 밀어 체감 "왼쪽" 이동 확대 (라디안) */
  const AZIMUTH_BIAS_LEFT = 0.45
  /** sin(phase/2)에 묶인 수직·반경 변조 (한 주기에 메비우스처럼 한 번 비틀림) */
  const Y_BOB = 22
  const RADIAL_PULSE = 0.085
  const pathSpeed = 0.14 // 위상 증가 속도 (rad/s) — 왕복이 느리게 반복
  /** 휠로 쌓였다가 서서히 줄어드는 추가 배속 */
  const speedBoostRef = useRef(0)
  const dragLastXRef = useRef(null)
  const isOrbitDragRef = useRef(false)

  /** 현재 카메라 위치에 맞춰 기준 방위각·반지름·높이 동기화 (phase=0이면 sin(0)=0으로 현재 각 유지) */
  const syncOrbitFromCamera = () => {
    const x = camera.position.x
    const z = camera.position.z
    const r = Math.hypot(x, z)
    if (r > 1e-4) {
      orbitRadiusRef.current = r
      baseAzimuthRef.current = Math.atan2(z, x)
    }
    orbitHeightRef.current = camera.position.y
    phaseRef.current = 0
  }

  // 자동 궤도 중: 휠·가로 드래그로 위상/속도 조절
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
      phaseRef.current += dx * 0.006
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

    phaseRef.current += pathSpeed * (1 + speedBoostRef.current) * delta

    const u = phaseRef.current
    const baseA = baseAzimuthRef.current
    const s = Math.sin(u)
    const swing = s >= 0 ? AZIMUTH_SWING_WIDE : AZIMUTH_SWING_NARROW
    const theta = baseA + swing * s - AZIMUTH_BIAS_LEFT
    const r =
      orbitRadiusRef.current * (1 + RADIAL_PULSE * Math.sin(u * 0.5))
    const y =
      orbitHeightRef.current + Y_BOB * Math.sin(u * 0.5)

    const newX = r * Math.cos(theta)
    const newZ = r * Math.sin(theta)

    const currentPos = state.camera.position
    const targetPos = new THREE.Vector3(newX, y, newZ)
    currentPos.lerp(targetPos, 1 - Math.exp(-3 * delta))

    controls.target.set(0, 0, 0)
    controls.update()
  })
  
  // 추적 모드일 때는 CameraController 비활성화 (Player에서 직접 제어)
  // 이 컴포넌트는 side effect만 수행하고 렌더링은 하지 않습니다
  return null
}

export default memo(CameraController)
