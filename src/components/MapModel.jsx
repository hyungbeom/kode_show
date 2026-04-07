import { Suspense, memo, useMemo } from 'react'
import Player from './Player'
import { WorldModel } from './WorldModel'
import { CharacterNavRaycastMode } from './CharacterNavRaycastMode'
import { useBrowserWidthPx } from '../hooks/useBrowserWidthPx'
import {
  getMapWorldResponsivePosition,
  getMapWorldResponsiveScale,
} from '../utils/mapViewportLayout'

/**
 * 맵 지형 컴포넌트
 * world.glb + Measurement_Land Rapier trimesh(WorldModel) + 캐릭터 — 별도 평면 그라운드 없음
 */
const MapTerrain = memo(function MapTerrain() {
  const browserWidthPx = useBrowserWidthPx()

  const worldScale = useMemo(
    () => getMapWorldResponsiveScale(browserWidthPx),
    [browserWidthPx],
  )
  const worldPosition = useMemo(
    () => getMapWorldResponsivePosition(browserWidthPx),
    [browserWidthPx],
  )

  const scale = 5
  const groundLevel = 0

  return (
    <group scale={worldScale} position={worldPosition}>
      <CharacterNavRaycastMode />
      <WorldModel />

      <Player scale={scale} groundLevel={groundLevel} />
    </group>
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
