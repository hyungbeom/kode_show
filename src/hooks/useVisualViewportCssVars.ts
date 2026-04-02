import { useEffect } from 'react'

/**
 * 모바일 브라우저 주소창·하단 툴바로 100vh와 실제 가시 영역이 어긋날 때,
 * visualViewport 크기를 px로 :root에 올려 레이아웃·시트 높이에 사용합니다.
 */
export function useVisualViewportCssVars() {
  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      const vv = window.visualViewport
      if (!vv) return
      root.style.setProperty('--vv-height', `${vv.height}px`)
      root.style.setProperty('--vv-width', `${vv.width}px`)
      root.style.setProperty('--vv-offset-top', `${vv.offsetTop}px`)
    }

    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      root.style.removeProperty('--vv-height')
      root.style.removeProperty('--vv-width')
      root.style.removeProperty('--vv-offset-top')
    }
  }, [])
}
