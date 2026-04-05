import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../store/useMapStore'
import { NodeSpeechBubble } from './NodeSpeechBubble'

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
 */
export function LandHover({ land, lands, speechAnchor, clonedScene, label, zoneId, glbNode }) {
  const [hovered, setHovered] = useState(false)
  const hitRef = useRef(null)
  const selectArea = useMapStore((s) => s.selectArea)
  const glbFocusPositions = useMapStore((s) => s.glbFocusPositions)
  const mapHeroCopyDismissed = useMapStore((s) => s.mapHeroCopyDismissed)

  const targets = useMemo(() => {
    if (lands?.length) return lands.filter(Boolean)
    if (land) return [land]
    return []
  }, [lands, land])

  const bubbleAnchor = speechAnchor ?? land ?? targets[0] ?? null

  const activateZone = useCallback(() => {
    if (!zoneId) return
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
  }, [zoneId, glbNode, glbFocusPositions, selectArea, bubbleAnchor, clonedScene])

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

  const handleZoneClick = useCallback(
    (e) => {
      e.stopPropagation()
      activateZone()
    },
    [activateZone],
  )

  useCursor(hovered, 'pointer', 'auto')

  useFrame(() => {
    const mesh = hitRef.current
    if (!mesh || !targets.length) return
    if (clonedScene) clonedScene.updateMatrixWorld(true)
    for (const t of targets) {
      t.updateWorldMatrix(true, true)
    }

    let hasBox = false
    for (const t of targets) {
      _boxWorld.setFromObject(t)
      if (_boxWorld.isEmpty()) continue
      if (!hasBox) {
        _unionWorld.copy(_boxWorld)
        hasBox = true
      } else {
        _unionWorld.union(_boxWorld)
      }
    }
    if (!hasBox || _unionWorld.isEmpty()) return

    if (
      !worldAabbToParentLocal(mesh, _unionWorld.min, _unionWorld.max, _centerLocal, _sizeLocal)
    ) {
      return
    }

    mesh.position.copy(_centerLocal)
    mesh.scale.set(
      Math.max(_sizeLocal.x * 1.02, 0.5),
      Math.max(_sizeLocal.y * 1.02, 0.5),
      Math.max(_sizeLocal.z * 1.02, 0.5),
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
        onPointerDown={handleHitPointerDown}
        onPointerUp={handleHitPointerUp}
        onPointerCancel={handleHitPointerCancel}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onClick={MAP_LAND_MESH_CLICK_NAVIGATES_ZONE ? handleZoneClick : undefined}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {mapHeroCopyDismissed ? (
        <NodeSpeechBubble
          anchor={bubbleAnchor}
          clonedScene={clonedScene}
          label={label}
          yPad={18}
          variant={hovered ? 'dark' : 'light'}
          onBubbleActivate={activateZone}
        />
      ) : null}
    </>
  )
}
