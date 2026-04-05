/**
 * /room/* ENTER 전에 호출 — 룸 청크·제품 GLB 프리로드로 진입 후 대기 최소화
 */

import { useGLTF } from '@react-three/drei'
import { peek } from 'suspend-react'
import { GLTFLoader } from 'three-stdlib'
import { PRODUCT_GLB_URLS } from '../components/ProductCarousel'

function waitForLoaderPeek(keys: readonly unknown[], timeoutMs = 120_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tick = () => {
      if (peek(keys as unknown[]) !== undefined) {
        resolve()
        return
      }
      if (Date.now() - t0 > timeoutMs) {
        reject(new Error('prepareRoomViewEntry: preload timeout'))
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export async function prepareRoomViewEntry(): Promise<void> {
  await import('../components/RoomScene')

  for (const url of PRODUCT_GLB_URLS) {
    useGLTF.preload(url)
  }

  await Promise.all(PRODUCT_GLB_URLS.map((url) => waitForLoaderPeek([GLTFLoader, url])))
}
