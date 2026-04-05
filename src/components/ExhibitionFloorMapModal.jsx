import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useGesture } from '@use-gesture/react'
import Modal from './common/Modal'
import './ExhibitionFloorMapModal.css'

/** `base` 배포 경로 대응 — 파일은 `public/map.jpg` */
export const DEFAULT_HALL_MAP_SRC = `${import.meta.env.BASE_URL}map.jpg`

const MIN_SCALE = 0.35
const MAX_SCALE = 10
/** 모달을 열 때 기본 확대 배율 */
const INITIAL_SCALE = 10
/** props에 초점 미전달 시 (이미지 중앙 근처) */
const DEFAULT_FOCUS_NATURAL_X = 1800
const DEFAULT_FOCUS_NATURAL_Y = 1050

function clampScale(s) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))
}

function defaultMapView() {
  return { x: 0, y: 0, scale: clampScale(INITIAL_SCALE) }
}

/**
 * transform: translate(x,y) scale(s), origin 0 0 기준으로
 * 이미지 상의 (nx, ny) natural 좌표가 뷰포트 중앙에 오도록 (x, y, scale) 계산
 */
function transformCenteringNaturalPoint(viewportEl, imgEl, scale, nx, ny) {
  const vw = viewportEl.getBoundingClientRect().width
  const vh = viewportEl.getBoundingClientRect().height
  const nw = imgEl.naturalWidth
  const nh = imgEl.naturalHeight
  if (!nw || !nh || !vw || !vh) return null

  const rw = imgEl.offsetWidth
  const rh = imgEl.offsetHeight
  const fx = (nx / nw) * rw
  const fy = (ny / nh) * rh
  const sc = clampScale(scale)

  return {
    x: vw / 2 - sc * fx,
    y: vh / 2 - sc * fy,
    scale: sc,
  }
}

/**
 * ENVEX 1F Hall A 배치도 — 휠·핀치 확대/축소, 드래그 이동
 */
export function ExhibitionFloorMapModal({
  isOpen,
  onClose,
  imageSrc = DEFAULT_HALL_MAP_SRC,
  alt = 'ENVEX 환경전 1층 A홀 부스 배치도',
  /** 원본 이미지 픽셀 좌표 — 이 지점이 뷰 중앙에 오도록 시작 */
  focusNaturalX = DEFAULT_FOCUS_NATURAL_X,
  focusNaturalY = DEFAULT_FOCUS_NATURAL_Y,
  /** 마이페이지 등 z-index 높은 오버레이 위에 올릴 때 */
  elevated = false,
}) {
  const viewportRef = useRef(null)
  const imgRef = useRef(null)
  const transformRef = useRef(defaultMapView())
  const pinchStartRef = useRef(null)
  const [{ x, y, scale }, setTransformState] = useState(() => defaultMapView())

  const setTransform = useCallback((next) => {
    const v = typeof next === 'function' ? next(transformRef.current) : next
    transformRef.current = v
    setTransformState(v)
  }, [])

  useEffect(() => {
    transformRef.current = { x, y, scale }
  }, [x, y, scale])

  const applyInitialFocus = useCallback(() => {
    const vp = viewportRef.current
    const img = imgRef.current
    if (!vp || !img || !img.naturalWidth) return
    const t = transformCenteringNaturalPoint(vp, img, INITIAL_SCALE, focusNaturalX, focusNaturalY)
    if (t) setTransform(t)
  }, [setTransform, focusNaturalX, focusNaturalY])

  useEffect(() => {
    if (!isOpen) pinchStartRef.current = null
  }, [isOpen])

  /** 열릴 때 기본 스케일 적용 후, 이미지·뷰포트 크기 기준으로 (FOCUS_NATURAL_*)를 화면 중앙에 */
  useLayoutEffect(() => {
    if (!isOpen) return
    const v = defaultMapView()
    transformRef.current = v
    setTransformState(v)
    let cancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) applyInitialFocus()
      })
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, imageSrc, focusNaturalX, focusNaturalY, applyInitialFocus])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const applyWheelZoom = useCallback((e) => {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { x: px, y: py, scale: sc } = transformRef.current
    const delta = -e.deltaY * 0.0012
    const nextScale = clampScale(sc * (1 + delta))
    if (nextScale === sc) return
    const ratio = nextScale / sc
    setTransform({
      scale: nextScale,
      x: mx - (mx - px) * ratio,
      y: my - (my - py) * ratio,
    })
  }, [setTransform])

  useEffect(() => {
    const el = viewportRef.current
    if (!isOpen || !el) return
    const handler = (e) => {
      e.preventDefault()
      applyWheelZoom(e)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [isOpen, applyWheelZoom])

  const zoomByButton = useCallback(
    (dir) => {
      const el = viewportRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const mx = rect.width / 2
      const my = rect.height / 2
      const { x: px, y: py, scale: sc } = transformRef.current
      const nextScale = clampScale(sc * (dir > 0 ? 1.2 : 1 / 1.2))
      if (nextScale === sc) return
      const ratio = nextScale / sc
      setTransform({
        scale: nextScale,
        x: mx - (mx - px) * ratio,
        y: my - (my - py) * ratio,
      })
    },
    [setTransform],
  )

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], first, pinching, memo }) => {
        if (pinching) return memo
        if (first) {
          return {
            bx: transformRef.current.x,
            by: transformRef.current.y,
          }
        }
        if (!memo) return memo
        const { bx, by } = memo
        setTransform({
          ...transformRef.current,
          x: bx + mx,
          y: by + my,
        })
        return memo
      },
      onPinch: ({ first, last, offset: [dist], origin }) => {
        const el = viewportRef.current
        if (!el || dist == null) return
        const rect = el.getBoundingClientRect()
        const px = origin[0] - rect.left
        const py = origin[1] - rect.top

        if (first) {
          pinchStartRef.current = {
            dist0: Math.max(dist, 1e-6),
            scale0: transformRef.current.scale,
            x0: transformRef.current.x,
            y0: transformRef.current.y,
          }
          return
        }

        const start = pinchStartRef.current
        if (!start) return

        const nextScale = clampScale(start.scale0 * (dist / start.dist0))
        const ratio = nextScale / start.scale0
        setTransform({
          scale: nextScale,
          x: px - (px - start.x0) * ratio,
          y: py - (py - start.y0) * ratio,
        })

        if (last) {
          pinchStartRef.current = null
        }
      },
    },
    {
      drag: { pointer: { touch: true } },
      pinch: { pointer: { touch: true } },
    },
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="exhibition-floor-map-modal__dialog"
      overlayClassName={`exhibition-floor-map-modal__overlay${elevated ? ' exhibition-floor-map-modal__overlay--elevated' : ''}`}
    >
      <div className="exhibition-floor-map-modal">
        <div className="exhibition-floor-map-modal__toolbar">
          <button
            type="button"
            className="exhibition-floor-map-modal__tool"
            onClick={() => zoomByButton(1)}
            aria-label="확대"
          >
            +
          </button>
          <button
            type="button"
            className="exhibition-floor-map-modal__tool"
            onClick={() => zoomByButton(-1)}
            aria-label="축소"
          >
            −
          </button>
          <button type="button" className="exhibition-floor-map-modal__tool" onClick={() => setTransform({ x: 0, y: 0, scale: 1 })} aria-label="화면 맞춤">
            전체
          </button>
          <button type="button" className="exhibition-floor-map-modal__close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div ref={viewportRef} className="exhibition-floor-map-modal__viewport" {...bind()} role="presentation">
          <div
            className="exhibition-floor-map-modal__content"
            style={{
              transform: `translate(${x}px, ${y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt={alt}
              className="exhibition-floor-map-modal__img"
              draggable={false}
              decoding="async"
              onLoad={applyInitialFocus}
            />
          </div>
        </div>

        <p className="exhibition-floor-map-modal__hint">휠 또는 핀치로 확대·축소, 드래그로 이동할 수 있어요</p>
      </div>
    </Modal>
  )
}
