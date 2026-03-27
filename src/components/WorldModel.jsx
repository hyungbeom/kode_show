/*
world.glb 맵 모델
- 씬 전체를 primitive로 로드해 Blender 원점/위치/변환 유지
- Gear_A ~ Gear_G, Mill_Wing — rotateY / Air_Fan_A·B_propeller — rotateY 2배속 / Wing, Wing001, Wing002 — rotateZ / Earth — rotateY (지구본)
- Air_tower, Air_tower001 연기 파티클 (타워 AABB에 비례한 크기)
- Air_Fan_A/B_propeller — SakuraWind (캡슐 바람결 + 원형 꽃잎)
- Airplane — 맵 상공 궤도 애니메이션 (AirplaneFlight, 키 입력 없음)
- 구역별 LandHover: *_Land 합 히트, 말풍선은 CH_* / Earth / Institution_Builidng 등 마커 노드 위
- Carbon_Land+CH_Leaf_Body — 말풍선은 CH_Leaf_Body·CARBON NATURAL
- NeonScreen — world.glb의 cube001 앵커 + screen.glb 지오 + /neon.png (WorldModel에서 마운트 필요)
*/

import React, { useMemo, memo, useLayoutEffect, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useGraph, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useMapStore } from '../store/useMapStore'
import { SakuraWind } from './SakuraWind'
import { AirplaneFlight } from './AirplaneFlight'
import { LandHover } from './LandHover'
import { NeonScreen } from './NeonScreen'
import { resolveSceneNode } from '../utils/gltfNodeUtils'
import {
  ZONE_ID_AIR,
  ZONE_ID_CARBON,
  ZONE_ID_EARTH,
  ZONE_ID_INST,
  ZONE_ID_LAB,
  ZONE_ID_WATER,
} from '../utils/constants'

/** Mill_Wing는 GLB 키가 \\u0008Mill_Wing 일 수 있으므로 루프에서 resolveSceneNode 사용 */
const SPIN_Y_GEARS = ['Gear_A', 'Gear_B', 'Gear_C', 'Gear_D', 'Gear_E', 'Gear_F', 'Gear_G', 'Mill_Wing']
const SPIN_Y_FANS = ['Air_Fan_A_propeller', 'Air_Fan_B_propeller']
const WING_SPIN_Z_NODES = ['Wing', 'Wing001', 'Wing002']
const ROTATION_SPEED = 2 // rad/s
const FAN_ROTATION_MULTIPLIER = 2 // 프로펠러는 톱니 대비 이 배속
/** 외국관 Earth 지구본 Y축 회전 */
const EARTH_ROTATION_SPEED = 1.1 // rad/s

/** SakuraWind: 자동 추정 축에 대한 월드 Yaw / 수평 Pitch 보정 (맵·팬 배치에 맞춤) */
const SAKURA_WIND_DIR_YAW_DEG = 44.5
const SAKURA_WIND_DIR_PITCH_DEG = -13.5

/** Zone 포커스용 GLB 노드 (기관 건은 오타/철자 별칭 처리) */
const GLB_FOCUS_NODES = ['CH_Water', 'CH_Air', 'CH_Microscope', 'CH_Leaf_Body', 'Earth']
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
const SMOKE_MAX_PARTICLES = 120

/**
 * Air_tower 계열 굴뚝 위 연기 (월드 AABB 기준 크기·위치)
 */
function AirTowerSmoke({ nodes, clonedScene }) {
  const { scene } = useThree()
  const particlesRef = useRef([])
  const spawnAccByTower = useRef({})
  const box = useRef(new THREE.Box3())
  const size = useRef(new THREE.Vector3())
  const spawnPos = useRef(new THREE.Vector3())
  /** 반지름 1 구 — mesh.scale로 월드 크기 지정 */
  const sharedGeo = useMemo(() => new THREE.SphereGeometry(1, 10, 10), [])

  useEffect(() => {
    return () => {
      particlesRef.current.forEach((mesh) => {
        scene.remove(mesh)
        mesh.material.dispose()
      })
      particlesRef.current = []
      sharedGeo.dispose()
    }
  }, [scene, sharedGeo])

  useFrame((_, delta) => {
    if (clonedScene) clonedScene.updateMatrixWorld(true)

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
      while (acc[towerName] >= SMOKE_SPAWN_INTERVAL && particlesRef.current.length < SMOKE_MAX_PARTICLES) {
        acc[towerName] -= SMOKE_SPAWN_INTERVAL
        const material = new THREE.MeshBasicMaterial({
          color: 0xe8eaed,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          toneMapped: false,
        })
        const mesh = new THREE.Mesh(sharedGeo, material)
        mesh.renderOrder = 10
        mesh.position.copy(spawnPos.current)
        mesh.scale.setScalar(baseRadius)
        mesh.userData.smokeS = s
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
      p.scale.x += grow
      p.scale.y += grow
      p.scale.z += grow
      p.material.opacity -= SMOKE_FADE_SPEED * delta
      if (p.material.opacity <= 0) {
        scene.remove(p)
        p.material.dispose()
        particlesRef.current.splice(i, 1)
      }
    }
  })

  return null
}

export const WorldModel = memo(function WorldModel(props) {
  const { scene } = useGLTF('/models/world.glb')

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

  const { nodes } = useGraph(clonedScene)
  const setGlbFocusPositions = useMapStore((s) => s.setGlbFocusPositions)

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
  }, [clonedScene, nodes, setGlbFocusPositions])

  useFrame((_, delta) => {
    const angleGear = delta * ROTATION_SPEED
    const angleFan = angleGear * FAN_ROTATION_MULTIPLIER
    SPIN_Y_GEARS.forEach((name) => {
      const node = resolveSceneNode(nodes, name)
      if (node) node.rotateY(angleGear)
    })
    SPIN_Y_FANS.forEach((name) => {
      const node = nodes[name]
      if (node) node.rotateY(angleFan)
    })
    WING_SPIN_Z_NODES.forEach((name) => {
      const node = resolveSceneNode(nodes, name)
      if (node) node.rotateZ(angleGear)
    })
    const earth = resolveSceneNode(nodes, 'Earth')
    if (earth) earth.rotateY(delta * EARTH_ROTATION_SPEED)
  })
  return (
    <>
      <primitive object={clonedScene} {...props} />
      <NeonScreen nodes={nodes} />
      <SakuraWind
        fan={nodes.Air_Fan_A_propeller}
        clonedScene={clonedScene}
        windCount={22}
        petalCount={56}
        dirYawDeg={SAKURA_WIND_DIR_YAW_DEG}
        dirPitchDeg={SAKURA_WIND_DIR_PITCH_DEG}
      />
      <SakuraWind
        fan={nodes.Air_Fan_B_propeller}
        clonedScene={clonedScene}
        windCount={22}
        petalCount={56}
        dirYawDeg={SAKURA_WIND_DIR_YAW_DEG}
        dirPitchDeg={SAKURA_WIND_DIR_PITCH_DEG}
      />
      <AirTowerSmoke nodes={nodes} clonedScene={clonedScene} />
      {nodes.Airplane ? <AirplaneFlight airplane={nodes.Airplane} /> : null}
      {nodes.Water_Quality_Land || nodes.CH_Water ? (
        <LandHover
          lands={[nodes.Water_Quality_Land, nodes.CH_Water].filter(Boolean)}
          speechAnchor={nodes.CH_Water || nodes.Water_Quality_Land}
          clonedScene={clonedScene}
          label="WATER"
          zoneId={ZONE_ID_WATER}
          glbNode="CH_Water"
        />
      ) : null}
      {nodes.Carbon_Land || nodes.CH_Leaf_Body ? (
        <LandHover
          lands={[nodes.Carbon_Land, nodes.CH_Leaf_Body].filter(Boolean)}
          speechAnchor={nodes.CH_Leaf_Body || nodes.Carbon_Land}
          clonedScene={clonedScene}
          label="CARBON NATURAL"
          zoneId={ZONE_ID_CARBON}
          glbNode="CH_Leaf_Body"
        />
      ) : null}
      {nodes.Measurement_Land || nodes.CH_Microscope ? (
        <LandHover
          lands={[nodes.Measurement_Land, nodes.CH_Microscope].filter(Boolean)}
          speechAnchor={nodes.CH_Microscope || nodes.Measurement_Land}
          clonedScene={clonedScene}
          label={'Measurement &\nAnalysis'}
          zoneId={ZONE_ID_LAB}
          glbNode="CH_Microscope"
        />
      ) : null}
      {nodes.Foreign_Land || nodes.Earth ? (
        <LandHover
          lands={[nodes.Foreign_Land, nodes.Earth].filter(Boolean)}
          speechAnchor={nodes.Earth || nodes.Foreign_Land}
          clonedScene={clonedScene}
          label="OVERSEAS"
          zoneId={ZONE_ID_EARTH}
          glbNode="Earth"
        />
      ) : null}
      {nodes.Air_Land || nodes.CH_Air ? (
        <LandHover
          lands={[nodes.Air_Land, nodes.CH_Air].filter(Boolean)}
          speechAnchor={nodes.CH_Air || nodes.Air_Land}
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
            nodes.Institution_Builidng || nodes.Institution_Building || nodes.Institution_Land
          }
          clonedScene={clonedScene}
          label={'Associations &\nOrganizations'}
          zoneId={ZONE_ID_INST}
          glbNode="Institution_Builidng"
        />
      ) : null}
    </>
  )
})

useGLTF.preload('/models/world.glb')