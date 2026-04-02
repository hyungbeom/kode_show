/**
 * 맵 월드 그룹용 반응형 스케일·위치.
 * 인자는 보통 브라우저 가로(px): useBrowserWidthPx() 또는 visualViewport / innerWidth.
 */

export type MapWorldViewportTier = 'mobile-narrow' | 'mobile' | 'tablet' | 'desktop'

export function getMapWorldViewportTier(widthPx: number): MapWorldViewportTier {
  if (widthPx < 480) return 'mobile-narrow'
  if (widthPx < 768) return 'mobile'
  if (widthPx < 1024) return 'tablet'
  return 'desktop'
}

/** 직교 맵에서 프레임 안에 들어가도록 전체 월드 균등 스케일 (1 = 데스크톱 기준) */
export function getMapWorldResponsiveScale(widthPx: number): number {
  if (widthPx < 480) return 0.74
  if (widthPx < 768) return 0.82
  if (widthPx < 1024) return 0.9
  return 1
}

/**
 * 카메라·오빗 타깃은 유지한 채 씬만 미세 이동 (주로 Y: 아이소 뷰에서 아래로 살짝 내려 가시 영역 맞춤)
 */
export function getMapWorldResponsivePosition(widthPx: number): [number, number, number] {
  if (widthPx < 480) return [0, -80, 0]
  if (widthPx < 768) return [-40, -80, 0]
  if (widthPx < 1024) return [-20, -40, 0]
  return [0, 0, 0]
}

/** LandHover / NodeSpeechBubble 등 Html 오버레이 scale (1 = 데스크톱) */
export function getSpeechBubbleScaleForWidth(widthPx: number): number {
  if (widthPx < 480) return 0.7
  if (widthPx < 768) return 0.8
  if (widthPx < 1024) return 0.88
  return 1
}
