import React, { useMemo, useRef, useEffect, memo } from 'react'
import * as THREE from 'three'
import { useGLTF, useAnimations } from '@react-three/drei'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'

/** `public/models/` — Vite는 public을 루트로 제공 ( `/models/foo.glb` ) */
export const DETACHED_GLB = {
  airplane: '/models/Airplane.glb',
  balloon: '/models/Baloon.glb',
  cloudA: '/models/Clould_A.glb',
  cloudB: '/models/Clould_B.glb',
  cloudC: '/models/Clould_C.glb',
}

const CLOUD_URL_BY_ID = {
  A: DETACHED_GLB.cloudA,
  B: DETACHED_GLB.cloudB,
  C: DETACHED_GLB.cloudC,
}

const GLB_CLOUD_SCALE = 2

/**
 * world 경계 직전 측정값 — AABB 계산 전 한 프레임용
 * @type {{ min: [number, number, number], max: [number, number, number] }}
 */
const FALLBACK_WORLD_AABB = {
  min: [-179.31, -182.82, -165.1],
  max: [186.34, 75.03, 170.73],
}

/**
 * @param {{ min: [number, number, number], max: [number, number, number] } | null | undefined} worldAabb
 */
function computeDetachedPlacements(worldAabb) {
  const b = worldAabb ?? FALLBACK_WORLD_AABB
  const [minX, minY, minZ] = b.min
  const [maxX, maxY, maxZ] = b.max
  const cx = (minX + maxX) * 0.5
  const cz = (minZ + maxZ) * 0.5
  const sx = maxX - minX
  const sz = maxZ - minZ
  const sy = maxY - minY
  const margin = Math.max(28, Math.min(sx, sz) * 0.08)
  /** 구름만 맵 끝 쪽으로 더 퍼뜨리기 위해 여유 조금 축소 */
  const cloudMargin = Math.max(16, Math.min(sx, sz) * 0.045)

  const clampX = (x) => THREE.MathUtils.clamp(x, minX + margin, maxX - margin)
  const clampZ = (z) => THREE.MathUtils.clamp(z, minZ + margin, maxZ - margin)
  const clampCloudX = (x) => THREE.MathUtils.clamp(x, minX + cloudMargin, maxX - cloudMargin)
  const clampCloudZ = (z) => THREE.MathUtils.clamp(z, minZ + cloudMargin, maxZ - cloudMargin)

  /** 열기구는 지붕 아래, 비행기·구름은 maxY 위로 (맵 대비 높이 조절은 비율·클램프만 손대면 됨) */
  const airplaneLift = THREE.MathUtils.clamp(sy * 0.055, 20, 42)
  const yAirplane = maxY + airplaneLift
  const yBalloon = maxY - 26
  const cloudSkyLift = THREE.MathUtils.clamp(sy * 0.34, 110, 255)
  const yCloudHigh = maxY + cloudSkyLift
  const yCloudMid = maxY + cloudSkyLift * 0.64
  const yCloudLow = maxY + cloudSkyLift * 0.36

  const airplane = {
    position: [clampX(cx), yAirplane, clampZ(cz)],
    rotation: [0, 0, 0],
    scale: 1,
  }

  const spread = Math.min(sx, sz) * 0.2
  const balloonOffsets = [
    [0, 0, 0],
    [spread * 0.95, -5, spread * 0.72],
    [-spread * 0.88, 5, -spread * 0.78],
  ]
  const balloons = balloonOffsets.map(([ox, oy, oz]) => ({
    position: [clampX(cx + ox), yBalloon + oy, clampZ(cz + oz)],
    rotation: [0, 0, 0],
    scale: 1,
  }))

  const cloudSpecs = [
    {
      id: 'A',
      duplicate: false,
      position: [clampCloudX(cx - sx * 0.41), yCloudHigh, clampCloudZ(cz - sz * 0.39)],
      rotation: [0, 1.22, 0],
    },
    {
      id: 'A',
      duplicate: true,
      position: [clampCloudX(cx - sx * 0.38), yCloudMid, clampCloudZ(cz + sz * 0.44)],
      rotation: [0, 0, 0],
    },
    {
      id: 'B',
      duplicate: true,
      position: [clampCloudX(cx + sx * 0.36), yCloudLow, clampCloudZ(cz - sz * 0.37)],
      rotation: [0, 0.38, 0],
    },
    {
      id: 'C',
      duplicate: false,
      position: [clampCloudX(cx + sx * 0.43), yCloudMid, clampCloudZ(cz + sz * 0.41)],
      rotation: [0.06, 0.12, -0.04],
    },
  ]

  return { airplane, balloons, cloudSpecs }
}

const DetachedAnimatedGlb = memo(function DetachedAnimatedGlb({
  url,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const rootRef = useRef(/** @type {THREE.Group | null} */ (null))
  const { scene, animations } = useGLTF(url, DRACO_DECODER_URL)
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false
        o.receiveShadow = false
      }
    })
    return c
  }, [scene])

  const { actions } = useAnimations(animations, rootRef)

  useEffect(() => {
    if (!actions) return
    for (const key of Object.keys(actions)) {
      actions[key]?.reset()?.play()
    }
    return () => {
      for (const key of Object.keys(actions)) {
        actions[key]?.stop()
      }
    }
  }, [actions])

  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned} />
    </group>
  )
})

function DetachedCloudInstance({ spec }) {
  const url = CLOUD_URL_BY_ID[spec.id]
  if (!url) return null
  return (
    <DetachedAnimatedGlb
      url={url}
      position={spec.position}
      rotation={spec.rotation}
      scale={GLB_CLOUD_SCALE}
    />
  )
}

/**
 * 구름 / 비행기 / 열기구 — `public/models/*.glb` + 내장 애니 전부 재생.
 * `worldAabb`: world.glb 클론 AABB(맵 로컬). 없으면 캐시된 대략 박스로 배치.
 *
 * @param {{ worldAabb?: { min: [number, number, number], max: [number, number, number] } | null }} props
 */
export function WorldDetachedGlbProps({ worldAabb = null }) {
  const { airplane, balloons, cloudSpecs } = useMemo(
    () => computeDetachedPlacements(worldAabb),
    [worldAabb],
  )

  return (
    <>
      <DetachedAnimatedGlb
        url={DETACHED_GLB.airplane}
        position={airplane.position}
        rotation={airplane.rotation}
        scale={airplane.scale}
      />
      {balloons.map((p, i) => (
        <DetachedAnimatedGlb
          key={`balloon-detached-${i}`}
          url={DETACHED_GLB.balloon}
          position={p.position}
          rotation={p.rotation}
          scale={p.scale}
        />
      ))}
      {cloudSpecs.map((spec, i) => (
        <DetachedCloudInstance key={`cloud-detached-${spec.id}-${spec.duplicate ? 'd' : 's'}-${i}`} spec={spec} />
      ))}
    </>
  )
}

for (const u of Object.values(DETACHED_GLB)) {
  useGLTF.preload(u, DRACO_DECODER_URL)
}
