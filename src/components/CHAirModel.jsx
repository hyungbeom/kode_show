/*
 * CH_Air.glb — gltfjsx / 애니메이션은 CHMicroscopeModel 과 동일 패턴
 * world.glb 의 CH_Air 노드가 있으면 맵 그룹 로컬 좌표로 맞춤
 */
import React, { useRef, useEffect, useCallback, forwardRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useSyncGroupToWorldGlbAnchor } from '../hooks/useSyncGroupToWorldGlbAnchor'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'
import { DISABLE_GLTF_ANIMATIONS } from '../config/perfAnimationTest'

const CH_AIR_GLB_URL = '/models/CH_Air.glb'

/** world.glb 에 CH_Air 가 없을 때만 사용 */
export const CH_AIR_MAP_PLACEMENT = {
  position: [-50, 41, -90],
  rotation: [0, 0.7, 0],
  scale: 1,
}

export const CHAirModel = forwardRef(function CHAirModel({ anchor = null }, forwardedRef) {
  const internalRef = useRef(/** @type {THREE.Group | null} */ (null))
  const { nodes, materials, animations } = useGLTF(CH_AIR_GLB_URL, DRACO_DECODER_URL)
  const { actions } = useAnimations(animations, internalRef)

  const assignRef = useCallback(
    (node) => {
      internalRef.current = node
      if (forwardedRef != null) {
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else forwardedRef.current = node
      }
    },
    [forwardedRef],
  )

  useSyncGroupToWorldGlbAnchor(internalRef, anchor, CH_AIR_MAP_PLACEMENT)

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
      <group name="Scene">
        <mesh
          name="CH_Air"
          castShadow
          geometry={nodes.CH_Air.geometry}
          material={materials.A1}
        />
      </group>
    </group>
  )
})

CHAirModel.displayName = 'CHAirModel'

useGLTF.preload(CH_AIR_GLB_URL, DRACO_DECODER_URL)
