/**
 * 첫 랜딩에서 ENTER 전에 호출 — 맵 3D 진입 시 추가 대기 최소화
 * - MapScene lazy 청크 선로드 (WorldModel 등 모듈의 preload 부수효과 포함)
 * - drei useGLTF / useTexture preload + suspend-react 캐시 완료까지 대기
 * - world.glb AABB 중심을 미리 스토어에 넣어, ENTER 직후 initialEntry 시점에도
 *   WorldModel의 rAF 이전과 동일한 mapDefault* / bounds 를 쓰게 함 (카메라 구도 안정화)
 */

import { useGLTF, useTexture } from '@react-three/drei'
import { peek } from 'suspend-react'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { GLTFLoader } from 'three-stdlib'
import { useMapStore } from '../store/useMapStore'
import { getMapInitialOrthoZoomForWidth, resolveMapCameraLayoutForViewport } from './mapCameraLayout'
import { readLayoutBrowserWidthPx } from './mapViewport'
import { MODEL_PATHS } from './constants'

const GLB_URLS = [
  '/models/world.glb',
  '/models/CH_Microscope.glb',
  '/models/CH_Air.glb',
  '/models/CH_Water.glb',
  MODEL_PATHS.PLAYER.AMONG_US,
  '/models/screen.glb',
] as const
const NEON_URL = '/neon.png'
const WORLD_GLB_URL = GLB_URLS[0]

async function warmMapStoreLayoutFromWorldGlb(): Promise<void> {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(WORLD_GLB_URL)
  const root = gltf.scene
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)

  let center: [number, number, number] | null = null
  if (!box.isEmpty()) {
    const c = new THREE.Vector3()
    box.getCenter(c)
    center = [c.x, c.y, c.z]
  }

  const w = readLayoutBrowserWidthPx()
  const {
    setMapLayoutBrowserWidthPx,
    setMapViewportOrthoZoom,
    setWorldGlbBoundsCenter,
    setMapDefaultCameraLayout,
  } = useMapStore.getState()

  setMapLayoutBrowserWidthPx(w)
  setMapViewportOrthoZoom(getMapInitialOrthoZoomForWidth(w))
  setWorldGlbBoundsCenter(center)

  const { orthoPosition, orbitTarget } = resolveMapCameraLayoutForViewport(w)
  setMapDefaultCameraLayout(orthoPosition, orbitTarget)
}

function waitForLoaderPeek(keys: readonly unknown[], timeoutMs = 120_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tick = () => {
      if (peek(keys as unknown[]) !== undefined) {
        resolve()
        return
      }
      if (Date.now() - t0 > timeoutMs) {
        reject(new Error('prepareMapViewEntry: preload timeout'))
        return
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export async function prepareMapViewEntry(): Promise<void> {
  await import('../components/MapScene')

  for (const url of GLB_URLS) {
    useGLTF.preload(url)
  }
  useTexture.preload(NEON_URL)

  await Promise.all([
    ...GLB_URLS.map((url) => waitForLoaderPeek([GLTFLoader, url])),
    waitForLoaderPeek([TextureLoader, NEON_URL]),
  ])

  await warmMapStoreLayoutFromWorldGlb()
}
