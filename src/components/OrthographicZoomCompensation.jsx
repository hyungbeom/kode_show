import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getBrowserVisualScale } from '../utils/browserVisualScale'

/**
 * 브라우저 UI 확대/축소(scale 변화) 시에만 OrthographicCamera.zoom을 비율 보정해
 * 씬 체감 크기를 유지. 휠 줌·GSAP 트윈과는 같은 프레임에서 덮어쓰지 않는다.
 */
export default function OrthographicZoomCompensation() {
  const { camera } = useThree()
  const lastScaleRef = useRef(null)

  useFrame(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return
    const s = getBrowserVisualScale()
    if (lastScaleRef.current == null) {
      lastScaleRef.current = s
      return
    }
    if (Math.abs(s - lastScaleRef.current) > 1e-5) {
      camera.zoom *= lastScaleRef.current / s
      camera.updateProjectionMatrix()
      lastScaleRef.current = s
    }
  })

  return null
}
