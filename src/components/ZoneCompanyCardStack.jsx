import { useState, useRef, useCallback, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import gsap from 'gsap'
import './ZoneCompanyCardStack.css'

const SWIPE_PX = 64
const VELOCITY_SWIPE = 0.22
const DRAG_CLICK_THRESHOLD = 14

function exitDistancePx() {
  if (typeof window === 'undefined') return 320
  return Math.min(420, Math.max(280, window.innerWidth * 0.5))
}

function entryOffsetPx() {
  if (typeof window === 'undefined') return 160
  return Math.min(220, Math.max(120, window.innerWidth * 0.28))
}

/**
 * 모바일 업체 리스트 — 스택 카드 + useDrag + GSAP 스와이프 연출
 */
export function ZoneCompanyCardStack({ companies, onOpenCompany, stackKey = '' }) {
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  /** GSAP이 dragX를 움직이는 동안 — CSS transition과 충돌 방지 */
  const [gestureAnimating, setGestureAnimating] = useState(false)
  const suppressClickRef = useRef(false)
  const dragXProxy = useRef({ x: 0 })
  const n = companies.length
  const nRef = useRef(n)
  nRef.current = n

  useEffect(() => {
    gsap.killTweensOf(dragXProxy.current)
    setIndex(0)
    setDragX(0)
    dragXProxy.current.x = 0
    suppressClickRef.current = false
    setGestureAnimating(false)
  }, [stackKey])

  const goNext = useCallback(() => {
    const len = nRef.current
    if (len <= 1) return
    setIndex((i) => (i + 1) % len)
  }, [])

  const goPrev = useCallback(() => {
    const len = nRef.current
    if (len <= 1) return
    setIndex((i) => (i - 1 + len) % len)
  }, [])

  const goNextRef = useRef(goNext)
  const goPrevRef = useRef(goPrev)
  goNextRef.current = goNext
  goPrevRef.current = goPrev

  const bind = useDrag(
    ({ first, active, last, tap, movement: [mx], velocity: [vx] }) => {
      if (nRef.current <= 1) return

      if (first && active) {
        gsap.killTweensOf(dragXProxy.current)
        setGestureAnimating(false)
        setDragX(dragXProxy.current.x)
      }

      if (last) {
        setDragging(false)
        if (tap) {
          setDragX(0)
          dragXProxy.current.x = 0
          return
        }
        if (Math.abs(mx) > DRAG_CLICK_THRESHOLD) {
          suppressClickRef.current = true
        }

        const exit = exitDistancePx()
        const entry = entryOffsetPx()

        const runSnapBack = () => {
          dragXProxy.current.x = mx
          setGestureAnimating(true)
          gsap.to(dragXProxy.current, {
            x: 0,
            duration: Math.min(0.42, 0.24 + Math.abs(mx) / 1400),
            ease: 'power3.out',
            onUpdate: () => setDragX(dragXProxy.current.x),
            onComplete: () => {
              setDragX(0)
              dragXProxy.current.x = 0
              setGestureAnimating(false)
            },
          })
        }

        if (mx < -SWIPE_PX || vx < -VELOCITY_SWIPE) {
          dragXProxy.current.x = mx
          setGestureAnimating(true)
          gsap.to(dragXProxy.current, {
            x: -exit,
            duration: 0.26,
            ease: 'power2.in',
            onUpdate: () => setDragX(dragXProxy.current.x),
            onComplete: () => {
              goNextRef.current()
              dragXProxy.current.x = entry
              setDragX(entry)
              gsap.to(dragXProxy.current, {
                x: 0,
                duration: 0.45,
                ease: 'power3.out',
                onUpdate: () => setDragX(dragXProxy.current.x),
                onComplete: () => {
                  setDragX(0)
                  dragXProxy.current.x = 0
                  setGestureAnimating(false)
                },
              })
            },
          })
          return
        }

        if (mx > SWIPE_PX || vx > VELOCITY_SWIPE) {
          dragXProxy.current.x = mx
          setGestureAnimating(true)
          gsap.to(dragXProxy.current, {
            x: exit,
            duration: 0.26,
            ease: 'power2.in',
            onUpdate: () => setDragX(dragXProxy.current.x),
            onComplete: () => {
              goPrevRef.current()
              dragXProxy.current.x = -entry
              setDragX(-entry)
              gsap.to(dragXProxy.current, {
                x: 0,
                duration: 0.45,
                ease: 'power3.out',
                onUpdate: () => setDragX(dragXProxy.current.x),
                onComplete: () => {
                  setDragX(0)
                  dragXProxy.current.x = 0
                  setGestureAnimating(false)
                },
              })
            },
          })
          return
        }

        runSnapBack()
        return
      }

      if (active) {
        setDragging(true)
        setDragX(mx)
        dragXProxy.current.x = mx
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      threshold: 6,
      /** 세로 스크롤(시트)과 충돌 시: 세로로 판단되면 드래그 취소, 가로는 즉시 인식 */
      preventScroll: 0,
      pointer: { touch: true },
    },
  )

  if (!n) return null

  const depths = n >= 3 ? [2, 1, 0] : n === 2 ? [1, 0] : [0]

  return (
    <div className={`zone-company-stack${n > 1 ? ' zone-company-stack--interactive' : ''}`}>
      <div className="zone-company-stack__swipe" {...(n > 1 ? bind() : {})}>
        {depths.map((depth) => {
          const ci = (index + depth) % n
          const company = companies[ci]
          const isFront = depth === 0
          const offsetX = depth * 16 + (isFront ? dragX : 0)
          const offsetY = depth * 8
          const scale = 1 - depth * 0.045
          const opacity = 1 - depth * 0.12

          return (
            <div
              key={`slot-${depth}`}
              className={`zone-company-stack__layer${isFront ? ' zone-company-stack__layer--front' : ''}${dragging && isFront ? ' zone-company-stack__layer--dragging' : ''}${gestureAnimating && isFront ? ' zone-company-stack__layer--gesture-anim' : ''}`}
              style={{
                zIndex: 5 - depth,
                transform: `translateX(${offsetX}px) translateY(${offsetY}px) scale(${scale})`,
                opacity,
              }}
              onClick={(e) => {
                if (!isFront) return
                if (suppressClickRef.current) {
                  e.preventDefault()
                  suppressClickRef.current = false
                  return
                }
                onOpenCompany?.(company)
              }}
              role={isFront ? 'button' : undefined}
              tabIndex={isFront ? 0 : undefined}
              onKeyDown={
                isFront
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpenCompany?.(company)
                      }
                    }
                  : undefined
              }
              aria-hidden={!isFront}
            >
              <article className="zone-company-stack-card" key={company.id}>
                <div className="zone-company-stack-card__media">
                  <img
                    src={company.imageUrl}
                    alt={`${company.name} 이미지`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  <div className="zone-company-stack-card__logo-badge">{company.name}</div>
                </div>
                <div className="zone-company-stack-card__panel">
                  <h3 className="zone-company-stack-card__title">{company.name}</h3>
                  <p className="zone-company-stack-card__category">{company.category}</p>
                  <p className="zone-company-stack-card__desc">{company.description}</p>
                </div>
              </article>
            </div>
          )
        })}
      </div>

      {n > 1 ? (
        <div className="zone-company-stack__dots" role="tablist" aria-label="업체 카드 위치">
          {companies.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-label={`${c.name} 카드로 이동`}
              aria-selected={i === index}
              className={`zone-company-stack__dot${i === index ? ' zone-company-stack__dot--active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                gsap.killTweensOf(dragXProxy.current)
                setGestureAnimating(false)
                setDragX(0)
                dragXProxy.current.x = 0
                setIndex(i)
              }}
            />
          ))}
        </div>
      ) : null}
      {n > 1 ? <p className="zone-company-stack__hint">좌우로 밀어 다른 업체를 볼 수 있어요</p> : null}
    </div>
  )
}
