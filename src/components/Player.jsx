import { useRef, memo, Suspense, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../store/useMapStore'
import { MODEL_PATHS } from '../utils/constants'
import { AmongUsColliderDebug } from './AmongUsColliderDebug'

const CHARACTER_GLB_URL = MODEL_PATHS.PLAYER.AMONG_US

/** 글롭 비주얼 스케일 — 카메라 오프셋과 같은 `scale` 계열로 맞춤 */
const CHARACTER_MODEL_SCALE = 0.25

/** useFrame 핫패스용 벡터 재사용 (매 프레임 new Vector3 금지) */
const _target = new THREE.Vector3()
const _camDesired = new THREE.Vector3()
const _worldPlayer = new THREE.Vector3()
const _localNav = new THREE.Vector3()
const _worldScale = new THREE.Vector3()
const _camLookInstant = new THREE.Vector3()
const _camLookSmoothed = new THREE.Vector3()

/** 맵 로컬(MapTerrain 그룹 기준) 캐릭터 스폰 XZ — Y는 `groundLevel`에 더함 */
const CHARACTER_SPAWN_XZ = /** @type {const} */ ([120, 10])

const NAV_GOAL_ARRIVAL_XZ = 0.32
const MIN_NAV_EFFECTIVE_RADIUS = 0.52
const NAV_RAW_DIR_MIN_DIST = 0.2
/** 목표 방향으로 붙는 가속 느낌 — 클수록 순식간에 달려감 (프레임 독립: 1 - exp(-k*dt)) */
const MOVE_SMOOTH = 3.05
/**
 * MapTerrain 로컬 기준 초당 최대 이동 거리(걷기 상한).
 * 여전히 빠르면 줄이고, 답답하면 키우기.
 */
const MAX_NAV_SPEED_LOCAL = 20
/** 카메라 위치가 캐릭터를 따라붙는 속도 (드래그 중은 더 낮춤) */
const CAM_SMOOTH = 3.2
const CAM_SMOOTH_DRAG = 1.85
/**
 * 카메라 전용 yaw 보간 — 캐릭터는 즉시 돌아도 카메라는 천천히 따라감(발밑·드래그 휙휙 방지).
 */
const CAM_YAW_SMOOTH = 2.75
const CAM_YAW_SMOOTH_DRAG = 1.25
/** lookAt 월드점 2차 스무딩 */
const CAM_LOOK_POINT_SMOOTH = 4.5
const CAM_LOOK_POINT_SMOOTH_DRAG = 2.8
const LERP_STOP_DIST = 0.06
/**
 * 참고 쿼터뷰(위+뒤 비슷한 비율 → 약 45~58° 내려다봄).
 * 값 키우면 줌 아웃(캐릭터가 화면에서 더 작아짐).
 */
const CAM_OFFSET_UP = 20
const CAM_OFFSET_BACK = 29
/** 발 기준 약간 위를 보되, CAM_LOOK_AHEAD 와 함께 씀 */
const CAM_LOOK_LIFT = 1.65
/** 진행 방향으로 lookAt 을 밀어 화면 위쪽에 앞길이 더 보이게 */
const CAM_LOOK_AHEAD = 7
/** amongus.glb 전방이 +Z 일 때 이동 방향 바라보기 */
const MODEL_FORWARD_ADJUST_Y = 0

/** a → b 최단 호 라디안 차 */
function shortestAngleDelta(a, b) {
  let d = b - a
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

function PlayerCharacterModel() {
  const { scene } = useGLTF(CHARACTER_GLB_URL)
  const s = CHARACTER_MODEL_SCALE

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  return <primitive object={clonedScene} scale={[s, s, s]} position={[0, 0, 0]} />
}

useGLTF.preload(CHARACTER_GLB_URL)

/**
 * Ecctrl 없음 — 클릭/홀드 네비(`characterNavGoal`) + 위치·회전 lerp,
 * PerspectiveCamera: 캐릭터 yaw·시선은 **보간**해 드래그/발밑 클릭에도 서서히 앞·뒤로 도는 느낌.
 * 캐릭터 메시는 `lookAt` 금지 — X축 눕힘 방지, Yaw 만 즉시 갱신.
 */
const Player = memo(function Player({ scale = 5, groundLevel = 0 }) {
  const rootRef = useRef(/** @type {THREE.Group | null} */ (null))
  const navGoalDirRef = useRef({ x: 0, z: 1 })
  /** 직교 맵 → 캐릭터 모드 직후 첫 프레임에 카메라를 월드 기준으로 스냅 */
  const wasFollowingRef = useRef(false)
  /** 카메라 릭만 쓰는 보간 yaw (캐릭터 mesh.rotation.y 와 별도) */
  const smoothedCamYawRef = useRef(/** @type {number} */ (NaN))

  const followPhysicsBox = useMapStore((state) => state.followPhysicsBox)
  const camMul = scale * CHARACTER_MODEL_SCALE

  useEffect(() => {
    if (!followPhysicsBox) {
      navGoalDirRef.current = { x: 0, z: 1 }
      smoothedCamYawRef.current = NaN
      useMapStore.getState().setCharacterNavGoal(null)
      useMapStore.getState().setCharacterNavPointerActive(false)
    }
  }, [followPhysicsBox])

  useFrame((state, delta) => {
    const root = rootRef.current
    if (!root) return

    const map = useMapStore.getState()
    if (!map.followPhysicsBox) {
      wasFollowingRef.current = false
      return
    }

    const dt = delta > 0.1 ? 0.1 : delta
    const moveT = 1 - Math.exp(-MOVE_SMOOTH * dt)
    const goal = map.characterNavGoal
    const pointerActive = map.characterNavPointerActive
    const pushPos = map.setPhysicsBoxPosition

    const camSmooth = pointerActive ? CAM_SMOOTH_DRAG : CAM_SMOOTH
    const camT = 1 - Math.exp(-camSmooth * dt)

    const p = root.position
    const parent = root.parent

    if (goal) {
      _localNav.set(goal.x, goal.y, goal.z)
      if (parent) parent.worldToLocal(_localNav)

      const rawDx = _localNav.x - p.x
      const rawDz = _localNav.z - p.z
      const rawDist = Math.hypot(rawDx, rawDz)

      if (rawDist < NAV_GOAL_ARRIVAL_XZ && !pointerActive) {
        map.setCharacterNavGoal(null)
        _target.copy(p)
      } else {
        let tx
        let ty
        let tz
        if (pointerActive) {
          let ux
          let uz
          if (rawDist >= NAV_RAW_DIR_MIN_DIST) {
            ux = rawDx / rawDist
            uz = rawDz / rawDist
            navGoalDirRef.current.x = ux
            navGoalDirRef.current.z = uz
          } else {
            ux = navGoalDirRef.current.x
            uz = navGoalDirRef.current.z
            let len = Math.hypot(ux, uz)
            if (len < 1e-6) {
              ux = 0
              uz = 1
              len = 1
            } else {
              ux /= len
              uz /= len
            }
          }
          const pullDist = Math.max(rawDist, MIN_NAV_EFFECTIVE_RADIUS)
          tx = p.x + ux * pullDist
          ty = _localNav.y
          tz = p.z + uz * pullDist
        } else {
          tx = _localNav.x
          ty = _localNav.y
          tz = _localNav.z
        }
        _target.set(tx, ty, tz)
      }
    } else {
      _target.copy(p)
    }

    const distToTarget = p.distanceTo(_target)
    if (distToTarget > LERP_STOP_DIST) {
      const idealStep = distToTarget * moveT
      const maxStep = MAX_NAV_SPEED_LOCAL * dt
      const step = Math.min(idealStep, maxStep)
      p.lerp(_target, step / distToTarget)
    }

    const faceDx = _target.x - p.x
    const faceDz = _target.z - p.z
    if (Math.hypot(faceDx, faceDz) > 0.03) {
      root.rotation.x = 0
      root.rotation.z = 0
      root.rotation.y = Math.atan2(faceDx, faceDz) + MODEL_FORWARD_ADJUST_Y
    }

    root.getWorldPosition(_worldPlayer)
    pushPos([_worldPlayer.x, _worldPlayer.y, _worldPlayer.z])

    const cam = state.camera
    if (cam instanceof THREE.PerspectiveCamera) {
      root.getWorldScale(_worldScale)
      const wMul = Math.max(_worldScale.x, _worldScale.y, _worldScale.z)
      const up = CAM_OFFSET_UP * camMul * wMul
      const back = CAM_OFFSET_BACK * camMul * wMul
      const lookLift = CAM_LOOK_LIFT * camMul * wMul
      const lookAhead = CAM_LOOK_AHEAD * camMul * wMul

      const charYaw = root.rotation.y
      let camYaw = smoothedCamYawRef.current
      if (!Number.isFinite(camYaw)) camYaw = charYaw
      const yawRate = pointerActive ? CAM_YAW_SMOOTH_DRAG : CAM_YAW_SMOOTH
      const yawT = 1 - Math.exp(-yawRate * dt)
      camYaw += shortestAngleDelta(camYaw, charYaw) * yawT
      smoothedCamYawRef.current = camYaw

      const sinY = Math.sin(camYaw)
      const cosY = Math.cos(camYaw)

      _camDesired.set(
        _worldPlayer.x - sinY * back,
        _worldPlayer.y + up,
        _worldPlayer.z - cosY * back,
      )

      _camLookInstant.set(
        _worldPlayer.x + sinY * lookAhead,
        _worldPlayer.y + lookLift,
        _worldPlayer.z + cosY * lookAhead,
      )

      const lookPtRate = pointerActive ? CAM_LOOK_POINT_SMOOTH_DRAG : CAM_LOOK_POINT_SMOOTH
      const lookPtT = 1 - Math.exp(-lookPtRate * dt)

      if (!wasFollowingRef.current) {
        wasFollowingRef.current = true
        _camLookSmoothed.copy(_camLookInstant)
        cam.position.copy(_camDesired)
        cam.up.set(0, 1, 0)
        cam.lookAt(_camLookSmoothed)
      } else {
        _camLookSmoothed.lerp(_camLookInstant, lookPtT)
        cam.position.lerp(_camDesired, camT)
        cam.lookAt(_camLookSmoothed)
      }
    }
  })

  const spawnY = groundLevel + 12

  return (
    <group
      ref={rootRef}
      position={[CHARACTER_SPAWN_XZ[0], spawnY, CHARACTER_SPAWN_XZ[1]]}
    >
      <Suspense
        fallback={
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#FF6B6B" />
          </mesh>
        }
      >
        <AmongUsColliderDebug />
        <PlayerCharacterModel />
      </Suspense>
    </group>
  )
})

Player.displayName = 'Player'

export default Player
