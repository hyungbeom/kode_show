import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { useDrag } from '@use-gesture/react'
import { ExhibitionFloorMapModal } from './ExhibitionFloorMapModal'
import { CompanyQuickActionsModal } from './CompanyQuickActionsModal'
import './ZoneCompanyCardStack.css'

function hasCompanyLogo(imageUrl) {
  return typeof imageUrl === 'string' && imageUrl.trim().length > 0
}

const SWIPE_PX = 56
const VELOCITY_SWIPE = 0.2
const DRAG_CLICK_THRESHOLD = 12
/** 양옆에 살짝 보이는 이전·다음 카드 폭 */
const PEEK_X = 26
const SLIDE_GAP = 12

function applyEdgeResistance(raw, index, len) {
  if (len <= 1) return raw
  let x = raw
  if (index === 0 && x > 0) x *= 0.28
  if (index === len - 1 && x < 0) x *= 0.28
  return x
}

/**
 * 모바일 업체 리스트 — 가로 스와이프 캐러셀 + 피크 + 페이지 도트
 */
export function ZoneCompanyCardStack({ companies, onOpenCompany, stackKey = '', initialCompanyId = null }) {
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [mapFocus, setMapFocus] = useState(null)
  const [quickActionsCompany, setQuickActionsCompany] = useState(null)
  const [viewportW, setViewportW] = useState(0)
  const [swipeMinHeight, setSwipeMinHeight] = useState(0)

  const viewportRef = useRef(null)
  const activeCardRef = useRef(null)
  const suppressClickRef = useRef(false)
  const indexRef = useRef(0)

  const n = companies.length
  const nRef = useRef(n)
  nRef.current = n

  const companyIdsKey = useMemo(() => companies.map((c) => c.id).join('\u001f'), [companies])

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    let nextIndex = 0
    if (initialCompanyId != null && companies.length > 0) {
      const idx = companies.findIndex((c) => c.id === initialCompanyId)
      if (idx >= 0) nextIndex = idx
    }
    setIndex(nextIndex)
    setDragX(0)
    suppressClickRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stackKey, initialCompanyId, companyIdsKey])

  useLayoutEffect(() => {
    const root = viewportRef.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      setViewportW(entry.contentRect.width)
    })
    ro.observe(root)
    setViewportW(root.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [stackKey])

  const frontCompanyId = companies[index]?.id

  useLayoutEffect(() => {
    const el = activeCardRef.current
    if (!el || typeof ResizeObserver === 'undefined') {
      if (el) {
        const h = Math.ceil(el.getBoundingClientRect().height)
        setSwipeMinHeight(h > 0 ? h : 320)
      }
      return
    }
    const measure = () => {
      const h = el.getBoundingClientRect().height
      const next = h > 0 ? Math.ceil(h) : 320
      setSwipeMinHeight((prev) => (next === prev ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [frontCompanyId, index, stackKey, n])

  const { slideW, stride, translateX, trackMinWidth } = useMemo(() => {
    if (viewportW <= 0) {
      return { slideW: 280, stride: 292, translateX: 0, trackMinWidth: 280 }
    }
    if (n <= 1) {
      const w = Math.max(260, viewportW - 20)
      return {
        slideW: w,
        stride: w,
        translateX: (viewportW - w) / 2 + dragX,
        trackMinWidth: w,
      }
    }
    const w = Math.max(252, viewportW - 2 * PEEK_X)
    const s = w + SLIDE_GAP
    return {
      slideW: w,
      stride: s,
      translateX: viewportW / 2 - w / 2 - index * s + dragX,
      trackMinWidth: n * w + (n - 1) * SLIDE_GAP,
    }
  }, [viewportW, n, index, dragX])

  const bind = useDrag(
    ({ active, last, tap, movement: [mx], velocity: [vx] }) => {
      const len = nRef.current
      if (len <= 1) return

      if (last) {
        setDragging(false)
        if (tap) {
          setDragX(0)
          return
        }
        if (Math.abs(mx) > DRAG_CLICK_THRESHOLD) {
          suppressClickRef.current = true
        }

        const idx = indexRef.current

        if (mx < -SWIPE_PX || vx < -VELOCITY_SWIPE) {
          if (idx < len - 1) {
            setIndex(idx + 1)
          }
          setDragX(0)
          return
        }
        if (mx > SWIPE_PX || vx > VELOCITY_SWIPE) {
          if (idx > 0) {
            setIndex(idx - 1)
          }
          setDragX(0)
          return
        }
        setDragX(0)
        return
      }

      if (active) {
        setDragging(true)
        setDragX(applyEdgeResistance(mx, indexRef.current, len))
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      threshold: 8,
      preventScroll: 0,
      pointer: { touch: true },
    },
  )

  if (!n) return null

  const openMap = (company, e) => {
    e.stopPropagation()
    setMapFocus({ nx: company.mapFocusX, ny: company.mapFocusY })
    setMapOpen(true)
  }

  const visit = (company, e) => {
    e.stopPropagation()
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    onOpenCompany?.(company)
  }

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

      <div className="zone-company-stack__carousel">
        <div
          ref={viewportRef}
          className="zone-company-stack__viewport"
          style={swipeMinHeight > 0 ? { minHeight: swipeMinHeight } : undefined}
          {...(n > 1 ? bind() : {})}
        >
          <div
            className="zone-company-stack__track"
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
              minWidth: trackMinWidth,
              gap: n > 1 ? SLIDE_GAP : 0,
            }}
          >
            {companies.map((company, i) => {
              const isCenter = i === index
              return (
                <div
                  key={company.id}
                  className={`zone-company-stack__slide${isCenter ? ' zone-company-stack__slide--center' : ''}`}
                  style={{
                    width: slideW,
                    flex: `0 0 ${slideW}px`,
                    opacity: n <= 1 ? 1 : isCenter ? 1 : 0.52,
                    transform: n <= 1 ? undefined : isCenter ? 'scale(1)' : 'scale(0.97)',
                  }}
                  onClick={() => {
                    if (!isCenter && n > 1) {
                      setIndex(i)
                      setDragX(0)
                    }
                  }}
                  role={n > 1 ? 'presentation' : undefined}
                >
                  <article
                    ref={isCenter ? activeCardRef : undefined}
                    className="zone-carousel-card"
                    aria-label={company.name}
                    aria-current={isCenter ? 'true' : undefined}
                  >
                    <div className="zone-carousel-card__ribbon" aria-hidden />

                    <header className="zone-carousel-card__head">
                      <button
                        type="button"
                        className="zone-carousel-card__kebab"
                        onClick={(e) => {
                          e.stopPropagation()
                          setQuickActionsCompany(company)
                        }}
                        aria-label={`${company.name} 더보기 메뉴`}
                        aria-haspopup="dialog"
                        aria-expanded={quickActionsCompany?.id === company.id}
                      >
                        <span className="zone-carousel-card__kebab-dot" />
                        <span className="zone-carousel-card__kebab-dot" />
                        <span className="zone-carousel-card__kebab-dot" />
                      </button>

                      <div className="zone-carousel-card__brand">
                        {hasCompanyLogo(company.imageUrl) ? (
                          <img
                            src={company.imageUrl}
                            alt=""
                            className="zone-carousel-card__logo"
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                          />
                        ) : null}
                        <h3 className="zone-carousel-card__name">{company.name}</h3>
                      </div>

                      {company.has3dRoom ? (
                        <span className="zone-carousel-card__badge-3d" aria-label="3D 전시 룸 제공">
                          3D
                        </span>
                      ) : null}
                    </header>

                    <p className="zone-carousel-card__desc">{company.description}</p>

                    {company.keywords.length > 0 ? (
                      <div className="zone-carousel-card__hashtags" aria-label="키워드">
                        {company.keywords.map((kw) => (
                          <span key={kw} className="zone-carousel-card__hash">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <footer className="zone-carousel-card__foot">
                      <button
                        type="button"
                        className="zone-carousel-card__pin"
                        onClick={(e) => openMap(company, e)}
                        aria-label="전시장 위치 찾기"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                          <path
                            fill="currentColor"
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="zone-carousel-card__visit"
                        onClick={(e) => visit(company, e)}
                      >
                        방문하기
                      </button>
                    </footer>
                  </article>
                </div>
              )
            })}
          </div>
        </div>
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
                setDragX(0)
                setIndex(i)
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
