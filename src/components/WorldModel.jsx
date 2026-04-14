/*
world.glb 맵 모델
- 씬 전체를 primitive로 로드해 Blender 원점/위치/변환 유지
- world.glb 애니메이션 클립 전부 재생(`useAnimations`); 날개·스크린 등은 GLB 키프레임 우선(기존 궤도·수동 회전 제거)
- Air_tower, Air_tower001 연기 파티클 (타워 AABB에 비례한 크기)
- Airplane / Baloon / Clould_A·B·C — `WorldDetachedGlbProps`: `public/models/*.glb` + 클립 전부 재생
- 구역별 LandHover: *_Land 합 히트, 말풍선 앵커·모양은 구역별 (수질·대기·탄소·측정 등)
- Carbon_Land+CH_Leaf_Body — 히트 합침, 말풍선은 Carbon_Land AABB 중심·우상단 피벗
- NeonScreen — world.glb의 cube001 앵커 + screen.glb 지오 + /neon.png (WorldModel에서 마운트 필요)
- Navigate idle 시 맵 회전 체감은 WorldModel이 아니라 CameraController에서 타깃 주위 카메라 궤도로 처리
- Water_all — `WaterAllWaves` 버텍스 파동(geometry clone)
- CH_Microscope.glb — `CHMicroscopeModel` 고정 배치, 측정분석 말풍선은 `Measurement_Land` AABB 중심 (`MeasurementLandPhysics` 고정 trimesh — 플레이어 발판)
- CH_Air.glb / CH_Water.glb — `CHAirModel`·`CHWaterModel`, world.glb 의 CH_Air·CH_Water 노드 위치에 동기화 + GLB 애니 전부 재생
- CH_Leaf.glb / CH_Earth.glb — `CHLeafModel`·`CHEarthModel`, CH_Leaf_Body·Earth 앵커에 동기화 + 애니 재생
*/

import React, { useMemo, memo, useLayoutEffect, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useGraph, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useMapStore } from '../store/useMapStore'
import { LandHover } from './LandHover'
import { WorldDetachedGlbProps } from './WorldDetachedGlbProps'
import { NeonScreen } from './NeonScreen'
import { WaterAllWaves, getWaterAllMeshFromNodes } from './WaterAllWaves'
import { CHMicroscopeModel } from './CHMicroscopeModel'
import { CHAirModel } from './CHAirModel'
import { CHWaterModel } from './CHWaterModel'
import { CHLeafModel } from './CHLeafModel'
import { CHEarthModel } from './CHEarthModel'
import { MeasurementLandPhysics } from './MeasurementLandPhysics'
import { resolveSceneNode } from '../utils/gltfNodeUtils'
import {
  ZONE_ID_AIR,
  ZONE_ID_CARBON,
  ZONE_ID_EARTH,
  ZONE_ID_INST,
  ZONE_ID_LAB,
  ZONE_ID_WATER,
} from '../utils/constants'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'

/** Mill_Wing는 GLB 키가 \\u0008Mill_Wing 일 수 있으므로 루프에서 resolveSceneNode 사용 */
// const SPIN_Y_GEARS = ['Gear_A', 'Gear_B', 'Gear_C', 'Gear_D', 'Gear_E', 'Gear_F', 'Gear_G', 'Mill_Wing']
// const SPIN_Y_FANS = ['Air_Fan_A_propeller', 'Air_Fan_B_propeller']
// const WING_SPIN_Z_NODES = ['Wing', 'Wing001', 'Wing002']

/** Zone 포커스용 GLB 노드 (기관 건은 오타/철자 별칭 처리) */
const GLB_FOCUS_NODES = ['CH_Water', 'CH_Air', 'CH_Leaf_Body', 'Earth', 'Measurement_Land']
const INSTITUTION_GLB_ALIASES = ['Institution_Builidng', 'Institution_Building']

const SMOKE_SPAWN_INTERVAL = 0.5 // 초
/** 큰 맵에서도 보이도록 상승·확산은 타워 크기에 비례해 적용 */
const SMOKE_RISE_FACTOR = 0.35 // bbox 최대 변 × 초당
const SMOKE_SCALE_GROW_FACTOR = 0.07 // bbox 최대 변 × 초당 (스케일 증가)
const SMOKE_FADE_SPEED = 0.55 // 초당 opacity 감소
const SMOKE_DRIFT_FACTOR = 0.14 // bbox 최대 변 × 초당 (흔들림)
const SMOKE_RADIUS_FACTOR = 0.08 // 연기 구 반지름 ≈ bbox 최대변 × 이 값
const SMOKE_TOP_PAD_FACTOR = 0.06 // 스폰: bbox.max.y + 최대변×이 값
const SMOKE_TOWER_NODES = ['Air_tower', 'Air_tower001']
const SMOKE_MAX_PARTICLES = 72
/** 프레임당 타워당 최대 스폰 — 누적 시 버스트로 재질·메시 폭증 방지 */
const SMOKE_MAX_SPAWN_PER_FRAME_PER_TOWER = 2

/**
 * Air_tower 계열 굴뚝 위 연기 (월드 AABB 기준 크기·위치)
 * 재질은 전 파티클이 1개만 공유 — 이전처럼 매 스폰마다 MeshBasicMaterial 생성 시 WebGL 컨텍스트 손실 유발
 */
function AirTowerSmoke({ nodes }) {
  const { scene } = useThree()
  const particlesRef = useRef([])
  const meshPoolRef = useRef([])
  const spawnAccByTower = useRef({})
  const box = useRef(new THREE.Box3())
  const size = useRef(new THREE.Vector3())
  const spawnPos = useRef(new THREE.Vector3())
  const sharedGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  const smokeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xe8eaed,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      particlesRef.current.forEach((mesh) => scene.remove(mesh))
      meshPoolRef.current.forEach((mesh) => scene.remove(mesh))
      particlesRef.current = []
      meshPoolRef.current = []
      sharedGeo.dispose()
      smokeMat.dispose()
    }
  }, [scene, sharedGeo, smokeMat])

  useFrame((_, delta) => {
    for (const towerName of SMOKE_TOWER_NODES) {
      const tower = nodes[towerName]
      if (!tower) continue

      tower.updateWorldMatrix(true, true)

      box.current.setFromObject(tower)
      let s
      if (box.current.isEmpty()) {
        tower.getWorldPosition(spawnPos.current)
        spawnPos.current.y += 12
        s = 25
      } else {
        box.current.getSize(size.current)
        s = Math.max(size.current.x, size.current.y, size.current.z, 0.001)
        const cx = (box.current.min.x + box.current.max.x) / 2
        const cz = (box.current.min.z + box.current.max.z) / 2
        const topY = box.current.max.y + s * SMOKE_TOP_PAD_FACTOR
        spawnPos.current.set(cx, topY, cz)
      }

      const baseRadius = s * SMOKE_RADIUS_FACTOR
      const acc = spawnAccByTower.current
      acc[towerName] = (acc[towerName] ?? 0) + delta
      let towerSpawns = 0
      while (
        acc[towerName] >= SMOKE_SPAWN_INTERVAL &&
        particlesRef.current.length < SMOKE_MAX_PARTICLES &&
        towerSpawns < SMOKE_MAX_SPAWN_PER_FRAME_PER_TOWER
      ) {
        acc[towerName] -= SMOKE_SPAWN_INTERVAL
        towerSpawns++

        const mesh = meshPoolRef.current.pop() ?? new THREE.Mesh(sharedGeo, smokeMat)
        mesh.renderOrder = 10
        mesh.position.copy(spawnPos.current)
        mesh.userData.smokeS = s
        mesh.userData.life = 1
        mesh.userData.sx = baseRadius
        mesh.userData.sy = baseRadius
        mesh.userData.sz = baseRadius
        mesh.scale.set(baseRadius, baseRadius, baseRadius)
        scene.add(mesh)
        particlesRef.current.push(mesh)
      }
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i]
      const s = p.userData.smokeS ?? 25
      const rise = s * SMOKE_RISE_FACTOR * delta
      const drift = s * SMOKE_DRIFT_FACTOR * delta
      const grow = s * SMOKE_SCALE_GROW_FACTOR * delta
      p.position.y += rise
      p.position.x += (Math.random() - 0.5) * drift
      p.position.z += (Math.random() - 0.5) * drift
      p.userData.sx += grow
      p.userData.sy += grow
      p.userData.sz += grow
      p.userData.life -= SMOKE_FADE_SPEED * delta
      const life = Math.max(0, p.userData.life)
      p.scale.set(p.userData.sx * life, p.userData.sy * life, p.userData.sz * life)
      if (p.userData.life <= 0) {
        scene.remove(p)
        particlesRef.current.splice(i, 1)
        meshPoolRef.current.push(p)
      }
    }
  })

  return null
}

export const WorldModel = memo(function WorldModel(props) {
  const worldAnimRootRef = useRef(/** @type {THREE.Group | null} */ (null))
  const { scene, animations } = useGLTF('/models/world.glb', DRACO_DECODER_URL)
  const { actions: worldGltfActions } = useAnimations(animations, worldAnimRootRef)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = false
      }
    })
    return clone
  }, [scene])

  const { nodes } = useGraph(clonedScene)
  const waterAllMesh = useMemo(() => getWaterAllMeshFromNodes(nodes, clonedScene), [nodes, clonedScene])

  const worldGlbAabb = useMemo(() => {
    clonedScene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(clonedScene)
    if (box.isEmpty()) return null
    return {
      min: /** @type {[number, number, number]} */ ([box.min.x, box.min.y, box.min.z]),
      max: /** @type {[number, number, number]} */ ([box.max.x, box.max.y, box.max.z]),
    }
  }, [clonedScene])

  const setGlbFocusPositions = useMapStore((s) => s.setGlbFocusPositions)
  const setWorldGlbBoundsCenter = useMapStore((s) => s.setWorldGlbBoundsCenter)

  useLayoutEffect(() => {
    const box = new THREE.Box3()
    const center = new THREE.Vector3()

    const writeCenter = (obj) => {
      if (!obj) return
      obj.updateWorldMatrix(true, true)
      box.setFromObject(obj)
      if (box.isEmpty()) obj.getWorldPosition(center)
      else box.getCenter(center)
      return [center.x, center.y, center.z]
    }

    const apply = () => {
      clonedScene.updateMatrixWorld(true)
      box.setFromObject(clonedScene)
      if (!box.isEmpty()) {
        box.getCenter(center)
        setWorldGlbBoundsCenter([center.x, center.y, center.z])
      }
      const map = {}
      GLB_FOCUS_NODES.forEach((name) => {
        const pos = writeCenter(nodes[name])
        if (pos) map[name] = pos
      })
      const instObj = INSTITUTION_GLB_ALIASES.map((k) => nodes[k]).find(Boolean)
      const instPos = writeCenter(instObj)
      if (instPos) map.Institution_Builidng = instPos
      if (Object.keys(map).length) setGlbFocusPositions(map)
    }

    const id = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(id)
  }, [clonedScene, nodes, setGlbFocusPositions, setWorldGlbBoundsCenter])

  useEffect(() => {
    if (!worldGltfActions) return
    for (const key of Object.keys(worldGltfActions)) {
      worldGltfActions[key]?.reset()?.play()
    }
    return () => {
      for (const key of Object.keys(worldGltfActions)) {
        worldGltfActions[key]?.stop()
      }
    }
  }, [worldGltfActions])

  return (
    <>
      <group>
        <group ref={worldAnimRootRef}>
          <primitive object={clonedScene} {...props} />
        </group>
        {nodes.Measurement_Land ? (
          <MeasurementLandPhysics landNode={nodes.Measurement_Land} />
        ) : null}
        <CHMicroscopeModel />
        <CHAirModel anchor={nodes.CH_Air} />
        <CHWaterModel anchor={nodes.CH_Water} />
        <CHLeafModel anchor={nodes.CH_Leaf_Body} />
        <CHEarthModel anchor={nodes.Earth} />
        <WorldDetachedGlbProps worldAabb={worldGlbAabb} />
      </group>
      {waterAllMesh ? <WaterAllWaves mesh={waterAllMesh} /> : null}
      <NeonScreen nodes={nodes} />
      <AirTowerSmoke nodes={nodes} />
      {nodes.Water_Quality_Land || nodes.CH_Water ? (
        <LandHover
          lands={[nodes.Water_Quality_Land, nodes.CH_Water].filter(Boolean)}
          speechAnchor={nodes.Water_Quality_Land || nodes.CH_Water}
          speechBubblePlacement="center"
          speechBubbleYPad={0}
          speechBubbleHtmlPivot="top-left"
          clonedScene={clonedScene}
          label="WATER"
          zoneId={ZONE_ID_WATER}
          glbNode="CH_Water"
        />
      ) : null}
      {nodes.Carbon_Land || nodes.CH_Leaf_Body ? (
        <LandHover
          lands={[nodes.Carbon_Land, nodes.CH_Leaf_Body].filter(Boolean)}
          speechAnchor={nodes.Carbon_Land || nodes.CH_Leaf_Body}
          speechBubblePlacement="center"
          speechBubbleYPad={0}
          speechBubbleHtmlPivot="top-right"
          clonedScene={clonedScene}
          label="CARBON NATURAL"
          zoneId={ZONE_ID_CARBON}
          glbNode="CH_Leaf_Body"
        />
      ) : null}
      {nodes.Measurement_Land ? (
        <LandHover
          lands={[nodes.Measurement_Land].filter(Boolean)}
          speechAnchor={nodes.Measurement_Land}
          speechBubblePlacement="center"
          speechBubbleYPad={0}
          speechBubbleHtmlPivot="top-right"
          hitBoxUnionScale={1}
          hitBoxMinAxis={0}
          characterNavPickable
          clonedScene={clonedScene}
          label={'Measurement\n& Analysis'}
          zoneId={ZONE_ID_LAB}
          glbNode="Measurement_Land"
        />
      ) : null}
      {nodes.Foreign_Land || nodes.Earth ? (
        <LandHover
          lands={[nodes.Foreign_Land, nodes.Earth].filter(Boolean)}
          speechAnchor={nodes.Foreign_Land || nodes.Earth}
          speechBubblePlacement="center"
          speechBubbleYPad={0}
          speechBubbleHtmlPivot="top-right"
          clonedScene={clonedScene}
          label="OVERSEAS"
          zoneId={ZONE_ID_EARTH}
          glbNode="Earth"
        />
      ) : null}
      {nodes.Air_Land || nodes.CH_Air ? (
        <LandHover
          lands={[nodes.Air_Land, nodes.CH_Air].filter(Boolean)}
          speechAnchor={nodes.Air_Land || nodes.CH_Air}
          speechBubblePlacement="center"
          speechBubbleYPad={0}
          speechBubbleHtmlPivot="bottom-left"
          clonedScene={clonedScene}
          label="AIR"
          zoneId={ZONE_ID_AIR}
          glbNode="CH_Air"
        />
      ) : null}
      {nodes.Institution_Land || nodes.Institution_Builidng || nodes.Institution_Building ? (
        <LandHover
          lands={[
            nodes.Institution_Land,
            nodes.Institution_Builidng || nodes.Institution_Building,
          ].filter(Boolean)}
          speechAnchor={
            nodes.Institution_Land ||
            nodes.Institution_Builidng ||
            nodes.Institution_Building
          }
          speechBubblePlacement="center"
          speechBubbleYPad={0}
          speechBubbleHtmlPivot="bottom-right"
          hitBoxPreciseAabb
          hitBoxExpandWorld={2.5}
          clonedScene={clonedScene}
          label={"ASSOCITATION \n ORGANIZATIONS"}
          zoneId={ZONE_ID_INST}
          glbNode="Institution_Builidng"
        />
      ) : null}
    </>
  )
})

useGLTF.preload('/models/world.glb', DRACO_DECODER_URL)