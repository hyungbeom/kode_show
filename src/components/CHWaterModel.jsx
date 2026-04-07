/*
 * CH_Water.glb — gltfjsx / 애니메이션은 CHMicroscopeModel 과 동일 패턴
 * 메시 로컬 변환은 사용자 제공 GLB 스펙과 동일
 */
import React, { useRef, useEffect, useCallback, forwardRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useSyncGroupToWorldGlbAnchor } from '../hooks/useSyncGroupToWorldGlbAnchor'

const CH_WATER_GLB_URL = '/models/CH_Water.glb'

/** world.glb 에 CH_Water 가 없을 때만 사용 */
export const CH_WATER_MAP_PLACEMENT = {
  position: [-132, 16, 37],
  rotation: [0, 0.3, 0],
  scale: 1,
}

export const CHWaterModel = forwardRef(function CHWaterModel({ anchor = null }, forwardedRef) {
  const internalRef = useRef(/** @type {THREE.Group | null} */ (null))
  const { nodes, materials, animations } = useGLTF(CH_WATER_GLB_URL)
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

  useSyncGroupToWorldGlbAnchor(internalRef, anchor, CH_WATER_MAP_PLACEMENT)

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
      <group name="Scene">
        <mesh
          name="CH_Water"
          castShadow
          receiveShadow
          geometry={nodes.CH_Water.geometry}
          material={materials.A1}
          position={[0.227, -15.034, -0.154]}
          rotation={[0, -0.654, 0]}
        />
      </group>
    </group>
  )
})

CHWaterModel.displayName = 'CHWaterModel'

useGLTF.preload(CH_WATER_GLB_URL)
