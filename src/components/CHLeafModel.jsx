/*
 * CH_Leaf.glb — gltfjsx-style skinned meshes; synced to world.glb CH_Leaf_Body.
 */
import React, { useRef, useEffect, useCallback, forwardRef, useMemo } from 'react'
import { useGraph } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import { useSyncGroupToWorldGlbAnchor } from '../hooks/useSyncGroupToWorldGlbAnchor'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'

const CH_LEAF_GLB_URL = '/models/CH_Leaf.glb'

/** world.glb 에 CH_Leaf_Body 가 없을 때만 사용 */
export const CH_LEAF_MAP_PLACEMENT = {
  position: [-32, 7, 110],
  rotation: [0, 0.4, 0],
  scale: 1,
}

export const CHLeafModel = forwardRef(function CHLeafModel({ anchor = null }, forwardedRef) {
  const groupRef = useRef(/** @type {THREE.Group | null} */ (null))
  const animRootRef = useRef(/** @type {THREE.Group | null} */ (null))
  const { scene, animations } = useGLTF(CH_LEAF_GLB_URL, DRACO_DECODER_URL)
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

  useSyncGroupToWorldGlbAnchor(groupRef, anchor, CH_LEAF_MAP_PLACEMENT)

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
    <group ref={assignRef} dispose={null}>
      <group ref={animRootRef} dispose={null}>
        <group name="Scene">
          <group name="Armature">
            <primitive object={nodes.mixamorigHips} />
            <skinnedMesh
              name="L_hand"
              castShadow
              geometry={nodes.L_hand.geometry}
              material={materials.A1}
              skeleton={nodes.L_hand.skeleton}
            />
            <skinnedMesh
              name="L_Leg"
              castShadow
              geometry={nodes.L_Leg.geometry}
              material={materials.A1}
              skeleton={nodes.L_Leg.skeleton}
            />
            <skinnedMesh
              name="R_Hand001"
              castShadow
              geometry={nodes.R_Hand001.geometry}
              material={materials.A1}
              skeleton={nodes.R_Hand001.skeleton}
            />
            <skinnedMesh
              name="R_leg"
              castShadow
              geometry={nodes.R_leg.geometry}
              material={materials.A1}
              skeleton={nodes.R_leg.skeleton}
            />
          </group>
        </group>
      </group>
    </group>
  )
})

CHLeafModel.displayName = 'CHLeafModel'

useGLTF.preload(CH_LEAF_GLB_URL, DRACO_DECODER_URL)
