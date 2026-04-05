import { useEffect, useRef } from 'react'
import { useControls, button } from 'leva'
import { useMapStore } from '../store/useMapStore'
type LevaSet = (patch: Record<string, unknown>) => void

/**
 * 개발 전용 — Leva로 맵 OrthographicCamera pose를 조절하고, 채팅에 붙일 스니펫을 복사합니다.
 * 프로덕션 빌드에서는 MapScene이 이 청크를 로드하지 않으며, PROD 가드로 UI도 이중 차단합니다.
 */
export function MapCameraDevControls() {
  if (import.meta.env.PROD) return null
  return <MapCameraDevControlsImpl />
}

function MapCameraDevControlsImpl() {
  const setMapDefaultCameraLayout = useMapStore((s) => s.setMapDefaultCameraLayout)
  const setMapViewportOrthoZoom = useMapStore((s) => s.setMapViewportOrthoZoom)
  const setDevMapCameraLayoutLocked = useMapStore((s) => s.setDevMapCameraLayoutLocked)

  const initialFromStoreRef = useRef<{
    camX: number
    camY: number
    camZ: number
    targetX: number
    targetY: number
    targetZ: number
    orthoZoom: number
  } | null>(null)
  if (initialFromStoreRef.current === null) {
    const s = useMapStore.getState()
    initialFromStoreRef.current = {
      camX: s.mapDefaultOrthoPosition[0],
      camY: s.mapDefaultOrthoPosition[1],
      camZ: s.mapDefaultOrthoPosition[2],
      targetX: s.mapDefaultOrbitTarget[0],
      targetY: s.mapDefaultOrbitTarget[1],
      targetZ: s.mapDefaultOrbitTarget[2],
      orthoZoom: s.mapViewportOrthoZoom,
    }
  }
  const ini = initialFromStoreRef.current

  const setLevaRef = useRef<LevaSet>(() => {})
  const valuesRef = useRef({
    camX: ini.camX,
    camY: ini.camY,
    camZ: ini.camZ,
    targetX: ini.targetX,
    targetY: ini.targetY,
    targetZ: ini.targetZ,
    orthoZoom: ini.orthoZoom,
  })

  /**
   * Leva 0.10: 스키마가 **객체**이면 `useControls`는 값 객체만 반환하고,
   * **함수**로 넘기면 `[values, set, get]` 튜플을 반환합니다.
   */
  const [values, set] = useControls(
    () => ({
      lockLayout: {
        value: false,
        label: '리사이즈 시 자동 레이아웃 끄기',
      },
      applyToScene: {
        value: true,
        label: '슬라이더 → 스토어 적용',
      },
      camX: { value: ini.camX, min: -800, max: 800, step: 1 },
      camY: { value: ini.camY, min: -400, max: 400, step: 1 },
      camZ: { value: ini.camZ, min: -800, max: 800, step: 1 },
      targetX: { value: ini.targetX, min: -500, max: 500, step: 1 },
      targetY: { value: ini.targetY, min: -200, max: 200, step: 1 },
      targetZ: { value: ini.targetZ, min: -500, max: 500, step: 1 },
      orthoZoom: { value: ini.orthoZoom, min: 0.5, max: 20, step: 0.05 },
      pullFromStore: button(() => {
        const s = useMapStore.getState()
        setLevaRef.current({
          camX: s.mapDefaultOrthoPosition[0],
          camY: s.mapDefaultOrthoPosition[1],
          camZ: s.mapDefaultOrthoPosition[2],
          targetX: s.mapDefaultOrbitTarget[0],
          targetY: s.mapDefaultOrbitTarget[1],
          targetZ: s.mapDefaultOrbitTarget[2],
          orthoZoom: s.mapViewportOrthoZoom,
        })
      }),
      copySnippet: button(() => {
        const v = valuesRef.current
        const text = `ortho: [${v.camX}, ${v.camY}, ${v.camZ}] as const,
target: [${v.targetX}, ${v.targetY}, ${v.targetZ}] as const,
zoom: ${v.orthoZoom},`
        void navigator.clipboard?.writeText(text)
      }),
    }),
    [ini],
  )

  setLevaRef.current = set
  valuesRef.current = {
    camX: values.camX,
    camY: values.camY,
    camZ: values.camZ,
    targetX: values.targetX,
    targetY: values.targetY,
    targetZ: values.targetZ,
    orthoZoom: values.orthoZoom,
  }

  useEffect(() => {
    setDevMapCameraLayoutLocked(values.lockLayout)
  }, [values.lockLayout, setDevMapCameraLayoutLocked])

  useEffect(() => {
    if (!values.applyToScene) return
    setMapDefaultCameraLayout(
      [values.camX, values.camY, values.camZ],
      [values.targetX, values.targetY, values.targetZ],
    )
    setMapViewportOrthoZoom(values.orthoZoom)
  }, [
    values.applyToScene,
    values.camX,
    values.camY,
    values.camZ,
    values.targetX,
    values.targetY,
    values.targetZ,
    values.orthoZoom,
    setMapDefaultCameraLayout,
    setMapViewportOrthoZoom,
  ])

  return null
}

