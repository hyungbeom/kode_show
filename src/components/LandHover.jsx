import { useRef, useState, useLayoutEffect, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../store/useMapStore'
import { NodeSpeechBubble } from './NodeSpeechBubble'

/**
 * *_Land 등 메시 위 호버: 커서 pointer, 말풍선 dark
 * - land: 단일 히트·말풍선 앵커
 * - lands + speechAnchor: 합 AABB 히트, 말풍선은 speechAnchor (예: CH_Leaf_Body)
 */
export function LandHover({ land, lands, speechAnchor, clonedScene, label, zoneId, glbNode }) {
  const [hovered, setHovered] = useState(false)
  const [footprint, setFootprint] = useState(null)
  const hitRef = useRef(null)
  const selectArea = useMapStore((s) => s.selectArea)
  const glbFocusPositions = useMapStore((s) => s.glbFocusPositions)

  const handleZoneClick = useCallback(
    (e) => {
      if (!zoneId || !glbNode) return
      e.stopPropagation()
      const pos = glbFocusPositions[glbNode]
      if (pos) selectArea(zoneId, pos)
    },
    [zoneId, glbNode, glbFocusPositions, selectArea]
  )

  const targets = useMemo(() => {
    if (lands?.length) return lands.filter(Boolean)
    if (land) return [land]
    return []
  }, [lands, land])

  const bubbleAnchor = speechAnchor ?? land ?? targets[0] ?? null

  useCursor(hovered, 'pointer', 'auto')

  useLayoutEffect(() => {
    if (!targets.length) return
    if (clonedScene) clonedScene.updateMatrixWorld(true)
    targets.forEach((t) => t.updateWorldMatrix(true, true))

    const union = new THREE.Box3()
    let hasBox = false
    for (const t of targets) {
      const b = new THREE.Box3().setFromObject(t)
      if (b.isEmpty()) continue
      if (!hasBox) {
        union.copy(b)
        hasBox = true
      } else {
        union.union(b)
      }
    }
    if (!hasBox) return
    setFootprint({ min: union.min.clone(), max: union.max.clone() })
  }, [targets, clonedScene])

  useFrame(() => {
    const mesh = hitRef.current
    const fp = footprint
    if (!mesh || !fp) return
    const { min, max } = fp
    const cx = (min.x + max.x) / 2
    const cy = (min.y + max.y) / 2
    const cz = (min.z + max.z) / 2
    const sx = max.x - min.x
    const sy = max.y - min.y
    const sz = max.z - min.z
    mesh.position.set(cx, cy, cz)
    mesh.scale.set(Math.max(sx * 1.02, 0.5), Math.max(sy * 1.02, 0.5), Math.max(sz * 1.02, 0.5))
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
        onClick={handleZoneClick}
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
      <NodeSpeechBubble
        anchor={bubbleAnchor}
        clonedScene={clonedScene}
        label={label}
        showBadge
        yPad={18}
        variant={hovered ? 'dark' : 'light'}
      />
    </>
  )
}
