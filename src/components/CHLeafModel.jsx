/*
 * CH_Leaf.glb — world.glb 의 CH_Leaf_Body(탄소 구역) 위치에 동기화, 애니 전부 재생
 */
import React, { useRef, useEffect, useCallback, forwardRef, useLayoutEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useSyncGroupToWorldGlbAnchor } from '../hooks/useSyncGroupToWorldGlbAnchor'

const CH_LEAF_GLB_URL = '/models/CH_Leaf.glb'

/** world.glb 에 CH_Leaf_Body 가 없을 때만 사용 */
export const CH_LEAF_MAP_PLACEMENT = {
  position: [-32, 7, 110],
  rotation: [0, 0.4, 0],
  scale: 1,
}

export const CHLeafModel = forwardRef(function CHLeafModel({ anchor = null }, forwardedRef) {
  const groupRef = useRef(/** @type {THREE.Group | null} */ (null))
  const sceneRef = useRef(/** @type {THREE.Object3D | null} */ (null))
  const { scene, animations } = useGLTF(CH_LEAF_GLB_URL)
  const { actions } = useAnimations(animations, sceneRef)

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

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

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
      <primitive ref={sceneRef} object={scene} />
    </group>
  )
})

CHLeafModel.displayName = 'CHLeafModel'

useGLTF.preload(CH_LEAF_GLB_URL)
