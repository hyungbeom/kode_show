import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { useDrag } from '@use-gesture/react'
import gsap from 'gsap'
import { ExhibitionFloorMapModal } from './ExhibitionFloorMapModal'
import { CompanyQuickActionsModal } from './CompanyQuickActionsModal'
import './ZoneCompanyCardStack.css'

function hasCompanyLogo(imageUrl) {
  return typeof imageUrl === 'string' && imageUrl.trim().length > 0
}

const SWIPE_PX = 64
const VELOCITY_SWIPE = 0.22
const DRAG_CLICK_THRESHOLD = 14

function exitDistancePx() {
  if (typeof window === 'undefined') return 320
  return Math.min(420, Math.max(280, window.innerWidth * 0.5))
}

/** 스와이프·도트 공통 — 마지막 다음은 0, 0 이전은 마지막 */
function wrapIndex(i, delta, len) {
  if (len <= 0) return 0
  return ((i + delta) % len + len) % len
}

/**
 * 모바일 업체 리스트 — 스택 카드 + useDrag + GSAP 스와이프 연출
 */
export function ZoneCompanyCardStack({ companies, onOpenCompany, stackKey = '', initialCompanyId = null }) {
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  /** GSAP이 dragX를 움직이는 동안 — CSS transition과 충돌 방지 */
  const [gestureAnimating, setGestureAnimating] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  /** 위치찾기로 연 배치도 초점 (원본 이미지 natural 좌표) */
  const [mapFocus, setMapFocus] = useState(null)
  const [quickActionsCompany, setQuickActionsCompany] = useState(null)
  /** 앞면 카드 높이 — 절대 배치 레이어가 패널까지 포함하도록 */
  const [swipeMinHeight, setSwipeMinHeight] = useState(400)
  const frontCardRef = useRef(null)
  const suppressClickRef = useRef(false)
  const dragXProxy = useRef({ x: 0 })
  const n = companies.length
  const nRef = useRef(n)
  nRef.current = n

  /** 배열 참조만 바뀌면 인덱스를 리셋하지 않도록 (순환 스와이프 유지) */
  const companyIdsKey = useMemo(() => companies.map((c) => c.id).join('\u001f'), [companies])

  /* 초기 인덱스: zone/포커스/목록(id 순서) 변경 시만. companies 참조만 바뀌면 리셋하지 않음 → 순환 스와이프 유지 */
  useEffect(() => {
    gsap.killTweensOf(dragXProxy.current)
    let nextIndex = 0
    if (initialCompanyId != null && companies.length > 0) {
      const idx = companies.findIndex((c) => c.id === initialCompanyId)
      if (idx >= 0) nextIndex = idx
    }
    setIndex(nextIndex)
    setDragX(0)
    dragXProxy.current.x = 0
    suppressClickRef.current = false
    setGestureAnimating(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- companies는 companyIdsKey와 함께 갱신됨
  }, [stackKey, initialCompanyId, companyIdsKey])

  const frontCompanyId = companies[index]?.id

  useLayoutEffect(() => {
    const el = frontCardRef.current
    if (!el || typeof ResizeObserver === 'undefined') {
      if (el) setSwipeMinHeight(Math.max(320, Math.ceil(el.getBoundingClientRect().height)))
      return
    }
    const measure = () => {
      const h = el.getBoundingClientRect().height
      setSwipeMinHeight((prev) => {
        const next = Math.max(320, Math.ceil(h))
        return next === prev ? prev : next
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [frontCompanyId, index, stackKey, n])

  const goNext = useCallback(() => {
    const len = nRef.current
    if (len <= 1) return
    setIndex((i) => wrapIndex(i, 1, len))
  }, [])

  const goPrev = useCallback(() => {
    const len = nRef.current
    if (len <= 1) return
    setIndex((i) => wrapIndex(i, -1, len))
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
              dragXProxy.current.x = 0
              setDragX(0)
              setGestureAnimating(false)
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
              dragXProxy.current.x = 0
              setDragX(0)
              setGestureAnimating(false)
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

  /**
   * DOM 순서: 뒤 → 앞 (맨 위 그리기). key=company.id 로 같은 카드 요소가
   * 가운데 → 앞면으로 승격될 때 transform transition이 이어짐 (옆에서 끼워 넣는 느낌 방지).
   */
  const visibleLayers = useMemo(() => {
    if (n === 1) return [companies[index]]
    if (n === 2) return [companies[(index + 1) % n], companies[index]]
    return [companies[(index + 2) % n], companies[(index + 1) % n], companies[index]]
  }, [companies, index, n])

  return (
    <div className={`zone-company-stack${n > 1 ? ' zone-company-stack--interactive' : ''}`}>
      <ExhibitionFloorMapModal
        isOpen={mapOpen}
        onClose={() => {
          setMapOpen(false)
          setMapFocus(null)
        }}
        focusNaturalX={mapFocus?.nx}
        focusNaturalY={mapFocus?.ny}
      />

      <CompanyQuickActionsModal
        isOpen={quickActionsCompany != null}
        company={quickActionsCompany}
        onClose={() => setQuickActionsCompany(null)}
      />

      <div
        className="zone-company-stack__swipe"
        style={{ minHeight: swipeMinHeight }}
        {...(n > 1 ? bind() : {})}
      >
        {visibleLayers.map((company, i) => {
          const depthFromFront = visibleLayers.length - 1 - i
          const isFront = depthFromFront === 0
          const offsetX = depthFromFront * 16 + (isFront ? dragX : 0)
          const offsetY = depthFromFront * 8
          const scale = 1 - depthFromFront * 0.045
          const opacity = 1 - depthFromFront * 0.12

          return (
            <div
              key={company.id}
              className={`zone-company-stack__layer${isFront ? ' zone-company-stack__layer--front' : ''}${dragging && isFront ? ' zone-company-stack__layer--dragging' : ''}${gestureAnimating && isFront ? ' zone-company-stack__layer--gesture-anim' : ''}`}
              style={{
                zIndex: 3 + i,
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
              <article
                ref={isFront ? frontCardRef : undefined}
                className="zone-company-stack-card"
                aria-label={company.name}
              >
                <div
                  className={`zone-company-stack-card__media${hasCompanyLogo(company.imageUrl) ? '' : ' zone-company-stack-card__media--no-logo'}`}
                >
                  {hasCompanyLogo(company.imageUrl) ? (
                    <img
                      src={company.imageUrl}
                      alt={`${company.name} 로고`}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="zone-company-stack-card__logo-img"
                    />
                  ) : (
                    <p className="zone-company-stack-card__logo-text">{company.name}</p>
                  )}
                  {company.has3dRoom ? (
                    <span className="zone-company-stack-card__3d-badge" aria-label="3D 전시 룸 제공">
                      3D
                    </span>
                  ) : null}
                  {company.keywords.length ? (
                    <div className="zone-company-stack-card__keyword-tags" aria-label="키워드">
                      {company.keywords.map((kw) => (
                        <span key={kw} className="zone-company-stack-card__keyword-tag">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="zone-company-stack-card__more-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setQuickActionsCompany(company)
                    }}
                    aria-label={`${company.name} 더보기 메뉴`}
                    aria-haspopup="dialog"
                    aria-expanded={quickActionsCompany?.id === company.id}
                  >
                    <span className="zone-company-stack-card__more-icon" aria-hidden>
                      <span className="zone-company-stack-card__more-dot" />
                      <span className="zone-company-stack-card__more-dot" />
                      <span className="zone-company-stack-card__more-dot" />
                    </span>
                  </button>
                  <button
                    type="button"
                    className="zone-company-stack-card__logo-badge"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMapFocus({ nx: company.mapFocusX, ny: company.mapFocusY })
                      setMapOpen(true)
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={mapOpen}
                  >
                    위치찾기
                  </button>
                </div>
                <div className="zone-company-stack-card__panel">
                  <p className="zone-company-stack-card__desc" title={company.description}>
                    {company.description}
                  </p>
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
    </div>
  )
}
