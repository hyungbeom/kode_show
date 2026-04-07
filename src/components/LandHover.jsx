import { useRef, useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../store/useMapStore'
import { NodeSpeechBubble } from './NodeSpeechBubble'
import { CHARACTER_NAV_PICK_USERDATA_KEY } from './CharacterNavRaycastMode'

const _unionWorld = new THREE.Box3()
const _boxWorld = new THREE.Box3()
const _localUnion = new THREE.Box3()
const _corner = new THREE.Vector3()
const _invParent = new THREE.Matrix4()
const _centerLocal = new THREE.Vector3()
const _sizeLocal = new THREE.Vector3()
const _worldCorners = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
]

/** true: 랜드(투명 히트 박스) 클릭 시 해당 관으로 카메라 이동 */
const MAP_LAND_MESH_CLICK_NAVIGATES_ZONE = true

/** 히트 AABB가 실제 메시보다 과하게 커지지 않게 — 기본 최소 변 길이(월드) */
const DEFAULT_HIT_BOX_MIN_AXIS = 0.5
/** 타깃 합 AABB 대비 히트 박스 스케일 (1 = 여백 없음) */
const DEFAULT_HIT_BOX_UNION_SCALE = 1.02
const HIT_BOX_AXIS_EPS = 1e-6

/** 월드축 정렬 AABB 8꼭짓점 → parent 로컬에서 다시 AABB (히트 박스 position/scale 정합) */
function worldAabbToParentLocal(mesh, worldMin, worldMax, centerOut, sizeOut) {
  const parent = mesh.parent
  if (!parent) return false
  parent.updateWorldMatrix(true, true)
  _invParent.copy(parent.matrixWorld).invert()
  const { x: x0, y: y0, z: z0 } = worldMin
  const { x: x1, y: y1, z: z1 } = worldMax
  const pts = _worldCorners
  pts[0].set(x0, y0, z0)
  pts[1].set(x1, y0, z0)
  pts[2].set(x0, y1, z0)
  pts[3].set(x1, y1, z0)
  pts[4].set(x0, y0, z1)
  pts[5].set(x1, y0, z1)
  pts[6].set(x0, y1, z1)
  pts[7].set(x1, y1, z1)
  _localUnion.makeEmpty()
  for (let i = 0; i < 8; i++) {
    _corner.copy(pts[i]).applyMatrix4(_invParent)
    _localUnion.expandByPoint(_corner)
  }
  if (_localUnion.isEmpty()) return false
  _localUnion.getCenter(centerOut)
  _localUnion.getSize(sizeOut)
  return true
}

/**
 * *_Land 등 메시 위 호버: 커서 pointer, 말풍선 dark
 * - land: 단일 히트·말풍선 앵커
 * - lands + speechAnchor: 합 AABB 히트, 말풍선은 speechAnchor (예: CH_Leaf_Body)
 * - speechAnchorRef: 말풍선만 이 ref의 Object3D 추적 (히트·구역 포커스는 speechAnchor 유지)
 * - speechBubblePlacement / speechBubbleYPad / speechBubbleHtmlPivot: NodeSpeechBubble 배치
 * - bubbleActivatesZone: false면 Html 말풍선 탭으로 구역 이동 안 함(포인터는 캔버스로 통과) — 랜드 메시만 클릭
 * - hitBoxUnionScale / hitBoxMinAxis: 투명 히트 박스 크기(기본은 약간 확대·최소 두께); 좁은 랜드는 0에 가깝게 줄이면 AABB에 가깝게 맞춤
 * - hitBoxPreciseAabb: true면 Box3.setFromObject(…, true)로 꼭짓점 기준 AABB(랜드·건물 합이 화면과 더 잘 맞을 때)
 * - hitBoxExpandWorld: 합 AABB를 월드 단위로 등방 확장 — 다른 구역 히트와 레이 거리 경쟁에서 불리할 때 소량만
 * - characterNavPickable: 캐릭터 시점(followPhysicsBox)에서만 의미 있음. true일 때만 `CharacterNavRaycastMode` 레이 화이트리스트에 올라가 클릭 이동 가능(기본 false — Measurement_Land 등 필요한 랜드만 true)
 */
export function LandHover({
  land,
  lands,
  speechAnchor,
  speechAnchorRef,
  speechBubblePlacement,
  speechBubbleYPad,
  speechBubbleHtmlPivot,
  bubbleActivatesZone = true,
  hitBoxUnionScale = DEFAULT_HIT_BOX_UNION_SCALE,
  hitBoxMinAxis = DEFAULT_HIT_BOX_MIN_AXIS,
  hitBoxPreciseAabb = false,
  hitBoxExpandWorld = 0,
  characterNavPickable = false,
  clonedScene,
  label,
  zoneId,
  glbNode,
}) {
  const [hovered, setHovered] = useState(false)
  const hitRef = useRef(null)
  const characterNavDragRef = useRef(false)
  const selectArea = useMapStore((s) => s.selectArea)
  const glbFocusPositions = useMapStore((s) => s.glbFocusPositions)
  const mapHeroCopyDismissed = useMapStore((s) => s.mapHeroCopyDismissed)
  const followPhysicsBox = useMapStore((s) => s.followPhysicsBox)
  const setCharacterNavGoal = useMapStore((s) => s.setCharacterNavGoal)
  const setCharacterNavPointerActive = useMapStore((s) => s.setCharacterNavPointerActive)

  const targets = useMemo(() => {
    if (lands?.length) return lands.filter(Boolean)
    if (land) return [land]
    return []
  }, [lands, land])

  const bubbleAnchor = speechAnchor ?? land ?? targets[0] ?? null

  const activateZone = useCallback(() => {
    if (followPhysicsBox || !zoneId) return
    let pos = glbNode ? glbFocusPositions[glbNode] : null
    if (!pos && bubbleAnchor) {
      if (clonedScene) clonedScene.updateMatrixWorld(true)
      bubbleAnchor.updateWorldMatrix(true, true)
      const b = new THREE.Box3().setFromObject(bubbleAnchor)
      const c = new THREE.Vector3()
      if (b.isEmpty()) {
        bubbleAnchor.getWorldPosition(c)
      } else {
        b.getCenter(c)
      }
      pos = [c.x, c.y, c.z]
    }
    if (pos) selectArea(zoneId, pos)
  }, [followPhysicsBox, zoneId, glbNode, glbFocusPositions, selectArea, bubbleAnchor, clonedScene])

  const handleHitPointerDown = useCallback((e) => {
    e.stopPropagation()
    // 모바일·터치: pointerover가 없거나 늦게 와서 말풍선이 dark로 안 바뀌는 경우 보정
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      setHovered(true)
    }
  }, [])

  const handleHitPointerUp = useCallback((e) => {
    e.stopPropagation()
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      setHovered(false)
    }
  }, [])

  const handleHitPointerCancel = useCallback(() => {
    setHovered(false)
  }, [])

  /** 맵 시점: 구역 줌 / 캐릭터 시점: characterNavPickable 인 랜드만 클릭·드래그 이동 */
  const handleLandClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (followPhysicsBox) {
        if (!characterNavPickable) return
        const p = e.point
        setCharacterNavGoal({ x: p.x, y: p.y, z: p.z })
        return
      }
      if (MAP_LAND_MESH_CLICK_NAVIGATES_ZONE) activateZone()
    },
    [followPhysicsBox, characterNavPickable, activateZone, setCharacterNavGoal],
  )

  /** 캐릭터 시점: 누른 채 드래그하면 목표를 실시간 갱신 (클릭 한 번만이 아니라) */
  const handleCharacterNavPointerDown = useCallback(
    (e) => {
      if (!followPhysicsBox || !characterNavPickable) return
      e.stopPropagation()
      characterNavDragRef.current = true
      setCharacterNavPointerActive(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
      const p = e.point
      setCharacterNavGoal({ x: p.x, y: p.y, z: p.z })
    },
    [
      followPhysicsBox,
      characterNavPickable,
      setCharacterNavGoal,
      setCharacterNavPointerActive,
    ],
  )

  const handleCharacterNavPointerMove = useCallback(
    (e) => {
      if (!characterNavDragRef.current || !followPhysicsBox || !characterNavPickable) return
      e.stopPropagation()
      const p = e.point
      setCharacterNavGoal({ x: p.x, y: p.y, z: p.z })
    },
    [followPhysicsBox, characterNavPickable, setCharacterNavGoal],
  )

  const endCharacterNavDrag = useCallback(
    (e) => {
      if (!characterNavPickable) return
      characterNavDragRef.current = false
      setCharacterNavPointerActive(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    },
    [characterNavPickable, setCharacterNavPointerActive],
  )

  useEffect(() => {
    if (followPhysicsBox) setHovered(false)
  }, [followPhysicsBox])

  useLayoutEffect(() => {
    const m = hitRef.current
    if (!m) return
    if (characterNavPickable) {
      m.userData[CHARACTER_NAV_PICK_USERDATA_KEY] = true
    } else {
      delete m.userData[CHARACTER_NAV_PICK_USERDATA_KEY]
    }
  }, [targets.length, bubbleAnchor, characterNavPickable])

  useCursor(!followPhysicsBox && hovered, 'pointer', 'auto')

  useFrame(() => {
    const mesh = hitRef.current
    if (!mesh || !targets.length) return
    if (clonedScene) clonedScene.updateMatrixWorld(true)
    for (const t of targets) {
      t.updateWorldMatrix(true, true)
    }

    let hasBox = false
    for (const t of targets) {
      _boxWorld.setFromObject(t, hitBoxPreciseAabb)
      if (_boxWorld.isEmpty()) continue
      if (!hasBox) {
        _unionWorld.copy(_boxWorld)
        hasBox = true
      } else {
        _unionWorld.union(_boxWorld)
      }
    }
    if (!hasBox || _unionWorld.isEmpty()) return

    if (hitBoxExpandWorld > 0) {
      _unionWorld.expandByScalar(hitBoxExpandWorld)
    }

    if (
      !worldAabbToParentLocal(mesh, _unionWorld.min, _unionWorld.max, _centerLocal, _sizeLocal)
    ) {
      return
    }

    mesh.position.copy(_centerLocal)
    const minAxis = hitBoxMinAxis > 0 ? hitBoxMinAxis : HIT_BOX_AXIS_EPS
    const u = hitBoxUnionScale
    mesh.scale.set(
      Math.max(_sizeLocal.x * u, minAxis),
      Math.max(_sizeLocal.y * u, minAxis),
      Math.max(_sizeLocal.z * u, minAxis),
    )
  })

  useEffect(() => {
    if (!targets.length) return
    const seen = new WeakSet()
    const restore = []
    for (const root of targets) {
      root.traverse((child) => {
        if (!child.isMesh || seen.has(child)) return
        seen.add(child)
        const orig = child.raycast
        child.raycast = () => {}
        restore.push(() => {
          child.raycast = orig
        })
      })
    }
    return () => {
      restore.forEach((fn) => fn())
    }
  }, [targets])

  if (!targets.length || !bubbleAnchor) return null

  return (
    <>
      <mesh
        ref={hitRef}
        visible={mapHeroCopyDismissed}
        onPointerDown={
          followPhysicsBox && characterNavPickable
            ? handleCharacterNavPointerDown
            : followPhysicsBox
              ? undefined
              : handleHitPointerDown
        }
        onPointerMove={
          followPhysicsBox && characterNavPickable ? handleCharacterNavPointerMove : undefined
        }
        onPointerUp={
          followPhysicsBox && characterNavPickable
            ? endCharacterNavDrag
            : followPhysicsBox
              ? undefined
              : handleHitPointerUp
        }
        onPointerCancel={
          followPhysicsBox && characterNavPickable
            ? endCharacterNavDrag
            : followPhysicsBox
              ? undefined
              : handleHitPointerCancel
        }
        onPointerLeave={
          followPhysicsBox
            ? undefined
            : (e) => {
                e.stopPropagation()
                setHovered(false)
              }
        }
        onClick={
          followPhysicsBox || MAP_LAND_MESH_CLICK_NAVIGATES_ZONE ? handleLandClick : undefined
        }
        onPointerOver={
          followPhysicsBox
            ? undefined
            : (e) => {
                e.stopPropagation()
                setHovered(true)
              }
        }
        onPointerOut={
          followPhysicsBox
            ? undefined
            : (e) => {
                e.stopPropagation()
                setHovered(false)
              }
        }
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {mapHeroCopyDismissed && !followPhysicsBox ? (
        <NodeSpeechBubble
          anchor={bubbleAnchor}
          anchorRef={speechAnchorRef}
          clonedScene={clonedScene}
          label={label}
          yPad={speechBubbleYPad ?? 18}
          bubblePlacement={speechBubblePlacement ?? 'top'}
          bubbleHtmlPivot={speechBubbleHtmlPivot ?? 'center'}
          variant={hovered ? 'dark' : 'light'}
          onBubbleActivate={bubbleActivatesZone ? activateZone : undefined}
        />
      ) : null}
    </>
  )
}
