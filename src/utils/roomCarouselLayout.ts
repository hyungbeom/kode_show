/**
 * /room/:id — 제품 GLB 캐러셀 뷰 반응형 (Canvas 픽셀 기준, 맵과 동일 브레이크포인트)
 */

export type RoomCarouselTier = 'mobile' | 'tablet' | 'desktop'

export function getRoomCarouselTier(canvasWidthPx: number): RoomCarouselTier {
  if (canvasWidthPx < 768) return 'mobile'
  if (canvasWidthPx < 1024) return 'tablet'
  return 'desktop'
}

/** 일열 캐러셀 — 인접 슬롯 중심 간격 (world units) */
export function getCarouselStripSlotSpacing(tier: RoomCarouselTier): number {
  switch (tier) {
    case 'mobile':
      return 2.35
    case 'tablet':
      return 2.72
    default:
      return 3.1
  }
}

/** 좌·우 화살표 — CarouselStrip 과 동일 Y(일열 GLB 중심선 y=0) */
export function getCarouselStripNavLocalY(_tier: RoomCarouselTier): number {
  return 0
}

/** 좌·우 화살표 X — 슬롯 간격과 동일 스케일로 바깥줄 정렬 (±1슬롯 바깥 여백) */
export function getCarouselSideNavLocalX(tier: RoomCarouselTier): number {
  const spacing = getCarouselStripSlotSpacing(tier)
  return spacing * 1.22 + 0.55
}

/** 하단 제품 설명 카드 — Y (캐러셀 그룹 로컬, GLB 줄 아래) */
export function getCarouselCaptionLocalY(tier: RoomCarouselTier): number {
  switch (tier) {
    case 'mobile':
      return -3.52
    case 'tablet':
      return -3.22
    default:
      return -3.36
  }
}

/** 캐러셀 그룹 전체 Y 이동(+) / 스케일 — 세로 화면에서 프레이밍 보정 */
export function getCarouselGroupYOffset(tier: RoomCarouselTier): number {
  switch (tier) {
    case 'mobile':
      return -0.98
    case 'tablet':
      return -0.32
    default:
      return 0
  }
}

export function getCarouselGroupScale(tier: RoomCarouselTier): number {
  switch (tier) {
    case 'mobile':
      return 0.9
    case 'tablet':
      return 0.96
    default:
      return 1
  }
}

export interface CarouselCameraSettings {
  position: [number, number, number]
  lookAt: [number, number, number]
  fov: number
}

/**
 * 캐러셀 룸 PerspectiveCamera 초기값 (RoomScene CameraSetup / 리셋과 동일 로직)
 */
export function computeCarouselRoomCameraSettings(
  widthPx: number,
  heightPx: number,
): CarouselCameraSettings {
  if (!widthPx || !heightPx) {
    return { position: [0, 4.0, 15.5], lookAt: [0, 3, 0], fov: 32 }
  }

  const tier = getRoomCarouselTier(widthPx)
  const roomSize = 10
  const roomHeight = 6
  const lookAtYBase = roomHeight * 0.5
  const diagonal = Math.sqrt(roomSize * roomSize + roomSize * roomSize)
  const minDistance = diagonal * 1.3 + roomHeight * 0.7
  const cameraDistance = minDistance

  let cameraHeight = 4.0
  let cameraZ = cameraDistance * 0.7 * Math.SQRT2

  const baseFOV = 32
  const screenArea = widthPx * heightPx
  const referenceArea = 1920 * 1080
  let fov = baseFOV * Math.max(0.95, Math.min(1.2, referenceArea / screenArea))

  if (tier === 'mobile') {
    fov = Math.min(fov * 1.32, 54)
    cameraZ *= 0.86
    cameraHeight = 3.58
  } else if (tier === 'tablet') {
    fov = Math.min(fov * 1.14, 48)
    cameraZ *= 0.94
    cameraHeight = 3.82
  }

  const fovMin = tier === 'mobile' ? 36 : tier === 'tablet' ? 34 : 30
  const fovMax = tier === 'mobile' ? 54 : tier === 'tablet' ? 48 : 42
  fov = Math.min(Math.max(fov, fovMin), fovMax)

  const lookAtY =
    tier === 'mobile' ? lookAtYBase + 0.22 : tier === 'tablet' ? lookAtYBase + 0.1 : lookAtYBase

  return {
    position: [0, cameraHeight, cameraZ],
    lookAt: [0, lookAtY, 0],
    fov,
  }
}

/** OrbitControls 타깃 Y — CameraSetup lookAt 과 동기화 */
export function getCarouselOrbitTargetY(widthPx: number): number {
  const s = computeCarouselRoomCameraSettings(widthPx, 800)
  return s.lookAt[1]
}
