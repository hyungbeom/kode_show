/**
 * 브라우저 페이지 확대·축소에 가까운 배율(대략 100% → 1).
 * visualViewport.scale(모바일 핀치 등) 또는 layout 대비 시각 뷰포트 폭 비율(일부 데스크톱 줌)을 사용한다.
 */
export function getBrowserVisualScale(): number {
  if (typeof window === 'undefined') return 1

  const vv = window.visualViewport
  if (!vv) return 1

  if (
    typeof vv.scale === 'number' &&
    vv.scale > 0.05 &&
    vv.scale < 20 &&
    Math.abs(vv.scale - 1) > 0.005
  ) {
    return vv.scale
  }

  const layoutW = document.documentElement?.clientWidth ?? window.innerWidth
  if (vv.width > 8 && layoutW > 8) {
    const ratio = layoutW / vv.width
    if (ratio > 0.3 && ratio < 3.5) return ratio
  }

  return 1
}
