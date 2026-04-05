import { useEffect, useRef } from 'react'
import { mapCameraDebugBridge } from '../utils/mapCameraDebugBridge'

function fmt(n) {
  const t = Math.round(n * 100) / 100
  return Number.isInteger(t) ? `${t}` : t.toFixed(2)
}

const ENABLE = import.meta.env.DEV === true

/**
 * 뷰포트 좌측 상단 고정 — 캔버스와 무관한 실제 화면 좌표.
 * 임시 디버그용(ENABLE false 시 미렌더).
 */
export function MapCameraDebugOverlay() {
  const preRef = useRef(null)

  useEffect(() => {
    if (!ENABLE) return
    const el = preRef.current
    if (!el) return

    let raf = 0
    const tick = () => {
      const b = mapCameraDebugBridge
      if (b.valid) {
        el.textContent = [
          `camX: ${fmt(b.camX)}`,
          `camY: ${fmt(b.camY)}`,
          `camZ: ${fmt(b.camZ)}`,
          `targetX: ${fmt(b.targetX)}`,
          `targetY: ${fmt(b.targetY)}`,
          `targetZ: ${fmt(b.targetZ)}`,
          `orthoZoom: ${fmt(b.orthoZoom)}`,
        ].join('\n')
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!ENABLE) return null

  return (
    <pre
      ref={preRef}
      className="map-camera-debug-overlay"
      style={{
        position: 'fixed',
        top: 'max(8px, env(safe-area-inset-top, 0px))',
        left: 'max(8px, env(safe-area-inset-left, 0px))',
        zIndex: 2147483646,
        margin: 0,
        padding: '10px 12px',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        fontSize: 11,
        lineHeight: 1.45,
        color: 'rgba(235, 240, 245, 0.92)',
        background: 'rgba(12, 14, 18, 0.82)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        whiteSpace: 'pre',
        textAlign: 'left',
        userSelect: 'text',
        cursor: 'text',
        pointerEvents: 'auto',
      }}
    />
  )
}
