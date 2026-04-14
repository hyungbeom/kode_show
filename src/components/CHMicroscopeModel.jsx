/*
 * gltfjsx 기반 — https://github.com/pmndrs/gltfjsx
 * 맵 월드 좌표계 기준 고정 배치 (world.glb CH_Microscope 노드 미사용)
 */
import React, { useRef, useEffect, useCallback, forwardRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'

const CH_MICROSCOPE_GLB_URL = '/models/CH_Microscope.glb'

/** 맵 루트 `<group>` 기준 — 중앙(0,0,0)에서 Y+ 가 하늘 방향 */
export const CH_MICROSCOPE_MAP_PLACEMENT = {
  position: [123, 8, 43],
  rotation: [0, 0, 0],
  scale: 1,
}

export const CHMicroscopeModel = forwardRef(function CHMicroscopeModel(_, forwardedRef) {
  const internalRef = useRef(/** @type {THREE.Group | null} */ (null))
  const { nodes, materials, animations } = useGLTF(CH_MICROSCOPE_GLB_URL, DRACO_DECODER_URL)
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

  const { position, rotation, scale } = CH_MICROSCOPE_MAP_PLACEMENT

  return (
    <group ref={assignRef} position={position} rotation={rotation} scale={scale} dispose={null}>
      <group name="Scene">
        <mesh
          name="CH_Microscope"
          castShadow
          geometry={nodes.CH_Microscope.geometry}
          material={materials.A1}
        >
          <mesh
            name="Head"
            castShadow
            geometry={nodes.Head.geometry}
            material={materials.A1}
            position={[0, 31.757, -7.332]}
          >
            <mesh
              name="Group_Lens_Body"
              castShadow

              geometry={nodes.Group_Lens_Body.geometry}
              material={materials.A1}
              position={[-0.029, -8.957, 9.104]}
              rotation={[Math.PI / 4, 0, 0]}
            >
              <mesh
                name="Group_Lens"
                castShadow

                geometry={nodes.Group_Lens.geometry}
                material={materials.A1}
              />
            </mesh>
            <mesh
              name="Lens"
              castShadow

              geometry={nodes.Lens.geometry}
              material={materials.A1}
              position={[-0.051, 4.772, 6.827]}
              rotation={[0, -0.011, 0]}
            />
          </mesh>
        </mesh>
      </group>
    </group>
  )
})

CHMicroscopeModel.displayName = 'CHMicroscopeModel'

useGLTF.preload(CH_MICROSCOPE_GLB_URL, DRACO_DECODER_URL)
