/*
 * CH_Earth.glb — gltfjsx-style skinned meshes; synced to world.glb Earth.
 */
import React, { useRef, useEffect, useCallback, forwardRef, useMemo } from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useSyncGroupToWorldGlbAnchor } from '../hooks/useSyncGroupToWorldGlbAnchor'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'
import { DISABLE_GLTF_ANIMATIONS } from '../config/perfAnimationTest'

const CH_EARTH_GLB_URL = '/models/CH_Earth.glb'

/** world.glb 에 Earth 가 없을 때만 사용 */
export const CH_EARTH_MAP_PLACEMENT = {
  position: [98, 12, -72],
  rotation: [0, -0.5, 0],
  scale: 1,
}

export const CHEarthModel = forwardRef(function CHEarthModel({ anchor = null }, forwardedRef) {
  const groupRef = useRef(/** @type {THREE.Group | null} */ (null))
  const animRootRef = useRef(/** @type {THREE.Group | null} */ (null))
  const { scene, animations } = useGLTF(CH_EARTH_GLB_URL, DRACO_DECODER_URL)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  const { actions } = useAnimations(animations, animRootRef)

  const assignRef = useCallback(
    (node) => {
      groupRef.current = node
      if (forwardedRef != null) {
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  useSyncGroupToWorldGlbAnchor(groupRef, anchor, CH_EARTH_MAP_PLACEMENT)

  useEffect(() => {
    if (!actions) return
    if (DISABLE_GLTF_ANIMATIONS) return
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
    <group ref={assignRef} dispose={null}>
      <group ref={animRootRef} dispose={null}>
        <group name="Scene">
          <group name="Armature" rotation={[Math.PI / 2, 0, 0]}>
            <primitive object={nodes.mixamorigHips} />
            <skinnedMesh
              name="CH_Earth_A"
              castShadow
              geometry={nodes.CH_Earth_A.geometry}
              material={materials.A1}
              skeleton={nodes.CH_Earth_A.skeleton}
            />
            <skinnedMesh
              name="CH_Earth_body"
              castShadow
              geometry={nodes.CH_Earth_body.geometry}
              material={materials.A1}
              skeleton={nodes.CH_Earth_body.skeleton}
            />
          </group>
        </group>
      </group>
    </group>
  )
})

CHEarthModel.displayName = 'CHEarthModel'

useGLTF.preload(CH_EARTH_GLB_URL, DRACO_DECODER_URL)
