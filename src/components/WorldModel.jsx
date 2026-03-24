/*
world.glb 맵 모델
- 씬 전체를 primitive로 로드해 Blender 원점/위치/변환 유지
- Gear_A ~ Gear_G만 useFrame으로 제자리 회전
*/

import React, { useMemo, memo } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

const GEAR_NAMES = ['Gear_A', 'Gear_B', 'Gear_C', 'Gear_D', 'Gear_E', 'Gear_F', 'Gear_G']
const ROTATION_SPEED = 2 // rad/s

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

  useFrame((_, delta) => {
    const speed = delta * ROTATION_SPEED
    GEAR_NAMES.forEach((name) => {
      const gear = nodes[name]
      if (gear) gear.rotation.x += speed
    })
  })

  return <primitive object={clonedScene} {...props} />
})

useGLTF.preload('/models/world.glb')
