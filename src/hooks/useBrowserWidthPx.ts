import { useEffect, useState } from 'react'
import { readLayoutBrowserWidthPx } from '../utils/mapViewport'

/**
 * 브라우저(또는 visual viewport) 가로 픽셀 — resize 시 갱신.
 * 캔버스 DOM보다 좁은 경우와 무관하게 창 너비 브레이크포인트에 맞출 때 사용.
 */
export function useBrowserWidthPx(): number {
  const [w, setW] = useState(readLayoutBrowserWidthPx)

  useEffect(() => {
    const sync = () => setW(readLayoutBrowserWidthPx())
    sync()
    window.addEventListener('resize', sync)
    window.visualViewport?.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('resize', sync)
      window.visualViewport?.removeEventListener('resize', sync)
    }
  }, [])

  return w
}
