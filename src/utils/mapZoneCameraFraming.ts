import type { ZoneCameraFraming } from './constants'
import {
  getZoneCameraFraming,
  ZONE_ID_AIR,
  ZONE_ID_CARBON,
  ZONE_ID_EARTH,
  ZONE_ID_INST,
  ZONE_ID_LAB,
  ZONE_ID_WATER,
} from './constants'
import { getMapWorldViewportTier } from './mapViewportLayout'

/**
 * PC 구도(ZONE_*_CAMERA_FRAMING)에 덧씌울 값만 적으면 됨.
 * 여기 없는 필드는 데스크톱과 동일.
 *
 * 모바일(세로)·태블릿에 맞게 targetZoom·cameraShift* 조절:
 * - targetZoom을 약간 낮추면 같은 건물이 화면에 더 넓게 잡힘.
 * - cameraShift는 데스크톱 대비 줄이면 프레임이 중앙에 가깝게.
 */
const ZONE_FRAMING_TABLET_PATCH: Partial<Record<string, Partial<ZoneCameraFraming>>> = {
  /** 수질관: 외국관과 유사하게 세로 화면에서 피사체를 위쪽으로 */
  [ZONE_ID_WATER]: {
    targetZoom: 10.6,
    offsetX: 6,
    offsetY: 86,
    offsetZ: 196,
    cameraShiftX: 40,
    cameraShiftY: -12,
    cameraShiftZ: 4,
  },
  [ZONE_ID_AIR]: { targetZoom: 9.35, cameraShiftX: -52, cameraShiftZ: 26 },
  [ZONE_ID_LAB]: { targetZoom: 9.35, cameraShiftX: 26, cameraShiftZ: 26 },
  [ZONE_ID_CARBON]: { targetZoom: 9.35 },
  /** 외국관: 세로 화면에서 지구·주변 랜드마크 클로즈업 (PC보다 줌↑·약간 하이앵글) */
  [ZONE_ID_EARTH]: {
    targetZoom: 11.2,
    offsetX: 188,
    offsetY: 172,
    offsetZ: 192,
    cameraShiftY: -14,
    cameraShiftZ: 6,
  },
  [ZONE_ID_INST]: { targetZoom: 9.35 },
}

const ZONE_FRAMING_MOBILE_PATCH: Partial<Record<string, Partial<ZoneCameraFraming>>> = {
  /**
   * 수질관 모바일 — 외국관과 같은 취지: 클로즈업 + cameraShiftY - 로 화면 위쪽 프레이밍
   * (PC 기준 offset 0,80,200 / shiftX 48 유지하면서 세로 뷰만 조정)
   */
  [ZONE_ID_WATER]: {
    targetZoom: 7,
    offsetX: 10,
    offsetY: 96,
    offsetZ: 182,
    cameraShiftX: 6,
    cameraShiftY: -30,
    cameraShiftZ: 10,
  },
  [ZONE_ID_AIR]: { targetZoom: 8.4, cameraShiftX: -44, cameraShiftZ: 22 },
  [ZONE_ID_LAB]: { targetZoom: 8.4, cameraShiftX: 22, cameraShiftZ: 22 },
  [ZONE_ID_CARBON]: { targetZoom: 8.4 },
  /**
   * 외국관 모바일 — 첨부 레퍼런스: 지구 상단~중앙 클로즈, 전경(피라미드·스핑크스 등) 하단 유지
   * Orthographic targetZoom ↑ = 피사체 확대. cameraShiftY - 로 시선 팬(지구가 화면 위쪽으로).
   */
  [ZONE_ID_EARTH]: {
    targetZoom: 8,
    offsetX: -85,
    offsetY: 90,
    offsetZ: 168,
    cameraShiftX: -10,
    cameraShiftY: -15,
    cameraShiftZ: 12,
  },
  [ZONE_ID_INST]: { targetZoom: 8.4 },
}

/** 480px 미만: 줌 살짝 완화 */
const MOBILE_NARROW_TARGET_ZOOM_FACTOR = 0.93
const MOBILE_NARROW_TARGET_ZOOM_MIN = 6.8

function mergeFraming(
  base: ZoneCameraFraming,
  patch: Partial<ZoneCameraFraming> | undefined,
): ZoneCameraFraming {
  if (!patch) return { ...base }
  return { ...base, ...patch }
}

/**
 * 브라우저 가로(px)에 따른 구역 줌인 카메라 구도.
 * mapLayoutBrowserWidthPx 와 동일한 값을 넘기면 맵 카메라·UI와 티어가 맞음.
 */
export function getZoneCameraFramingForWidth(
  zoneId: string | null | undefined,
  widthPx: number,
): ZoneCameraFraming {
  const base = getZoneCameraFraming(zoneId)
  const tier = getMapWorldViewportTier(widthPx)
  if (tier === 'desktop') return { ...base }

  const id = zoneId ?? ''
  const patch =
    tier === 'tablet' ? ZONE_FRAMING_TABLET_PATCH[id] : ZONE_FRAMING_MOBILE_PATCH[id]

  let merged = mergeFraming(base, patch)

  if (tier === 'mobile-narrow') {
    merged = {
      ...merged,
      targetZoom: Math.max(
        MOBILE_NARROW_TARGET_ZOOM_MIN,
        merged.targetZoom * MOBILE_NARROW_TARGET_ZOOM_FACTOR,
      ),
    }
  }

  return merged
}
