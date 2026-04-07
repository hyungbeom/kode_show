import { useLayoutEffect, useRef, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { useMapStore } from '../store/useMapStore'

/** 캐릭터 시점 클릭 이동 허용 메시만 `userData[CHARACTER_NAV_PICK_USERDATA_KEY] = true` (예: LandHover `characterNavPickable`) */
export const CHARACTER_NAV_PICK_USERDATA_KEY = 'allowCharacterNavPick'

/**
 * 캐릭터 시점(followPhysicsBox)일 때 이 플래그가 없는 Object3D는 `raycast` noop 처리.
 * 화이트리스트: `LandHover` characterNavPickable(Measurement_Land 등) — 별도 바닥 픽 메시 없음.
 */
export function CharacterNavRaycastMode() {
  const followPhysicsBox = useMapStore((s) => s.followPhysicsBox)
  const { scene } = useThree()
  const restoresRef = useRef([])

  const restoreAll = useCallback(() => {
    restoresRef.current.forEach((fn) => fn())
    restoresRef.current = []
  }, [])

  const applyPickFilter = useCallback(() => {
    restoreAll()
    if (!followPhysicsBox) return

    scene.traverse((obj) => {
      if (obj.userData?.[CHARACTER_NAV_PICK_USERDATA_KEY]) return
      const orig = obj.raycast
      if (typeof orig !== 'function') return
      obj.raycast = function noopRaycast() {}
      restoresRef.current.push(() => {
        obj.raycast = orig
      })
    })
  }, [followPhysicsBox, scene, restoreAll])

  useLayoutEffect(() => {
    applyPickFilter()
    let innerRaf = 0
    const outerRaf = requestAnimationFrame(() => {
      applyPickFilter()
      innerRaf = requestAnimationFrame(() => applyPickFilter())
    })
    return () => {
      cancelAnimationFrame(outerRaf)
      if (innerRaf) cancelAnimationFrame(innerRaf)
      restoreAll()
    }
  }, [applyPickFilter])

  return null
}
