import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useDrag } from '@use-gesture/react'
import { useMapStore } from '../store/useMapStore'
import { getCompanyProductGlbUrls, getCompanyProductGlbTitles } from '../data/exhibitorsByZone'
import { ExhibitionFloorMapModal } from './ExhibitionFloorMapModal'
import { ProductGlbViewerModal } from './ProductGlbViewerModal'
import { ProductImageViewerModal } from './ProductImageViewerModal'
import ZoneCompanyCardGlbPreview from './ZoneCompanyCardGlbPreview'
import './ZoneCompanyCardStack.css'

function openCompanyUrl(url, emptyMessage) {
  const u = url?.trim()
  if (!u) {
    window.alert(emptyMessage)
    return
  }
  window.open(u, '_blank', 'noopener,noreferrer')
}

function closeKebabMenu(setId, setPlacement) {
  setId(null)
  setPlacement(null)
}

function hasCompanyLogo(imageUrl) {
  return typeof imageUrl === 'string' && imageUrl.trim().length > 0
}

function companyCardSubtitle(company) {
  const label = company.categoryLabel?.trim()
  if (label) return label
  return company.keywords?.[0] ?? ''
}

function companyDescriptionLead(description) {
  if (!description || typeof description !== 'string') return ''
  const first = description.split('\n\n')[0]?.trim() ?? ''
  return first || description.trim()
}

function companyGlbUrl(company) {
  const u = company.glbUrl
  return typeof u === 'string' && u.trim().length > 0 ? u.trim() : ''
}

const SWIPE_PX = 56
const VELOCITY_SWIPE = 0.2
const DRAG_CLICK_THRESHOLD = 12
/** GLB 썸네일 탭 vs 오빗 드래그 구분 — 이보다 많이 움직이면 전체화면 모달 안 띄움 */
const GLB_OPEN_TAP_SLOP_PX = 16
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
  const mapLayoutBrowserWidthPx = useMapStore((s) => s.mapLayoutBrowserWidthPx)
  const isMobileSheet = mapLayoutBrowserWidthPx < 768

  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [mapFocus, setMapFocus] = useState(null)
  const [kebabMenuCompanyId, setKebabMenuCompanyId] = useState(null)
  const [kebabMenuPlacement, setKebabMenuPlacement] = useState(null)
  const [viewportW, setViewportW] = useState(0)
  const [swipeMinHeight, setSwipeMinHeight] = useState(0)
  /** 전체화면 GLB — 같은 업체의 `productGlbUrls` / `glbUrl` 목록 안에서만 이동 */
  const [glbModal, setGlbModal] = useState(null)
  /** 히어로가 이미지뿐일 때 전체화면 보기 */
  const [imageViewer, setImageViewer] = useState(null)

  const glbModalCompany = useMemo(
    () => (glbModal ? companies.find((c) => c.id === glbModal.companyId) ?? null : null),
    [glbModal, companies],
  )

  const glbModalProductUrls = useMemo(
    () => getCompanyProductGlbUrls(glbModalCompany),
    [glbModalCompany],
  )

  const glbModalProductTitles = useMemo(
    () => getCompanyProductGlbTitles(glbModalCompany),
    [glbModalCompany],
  )

  const glbModalUrl =
    glbModal != null && glbModalProductUrls[glbModal.index]
      ? glbModalProductUrls[glbModal.index]
      : null

  const glbModalTitle =
    glbModal != null && glbModalProductTitles[glbModal.index]
      ? glbModalProductTitles[glbModal.index]
      : null

  const viewportRef = useRef(null)
  const activeCardRef = useRef(null)
  const suppressClickRef = useRef(false)
  const glbThumbTapRef = useRef({ ax: 0, ay: 0, moved: false })
  const heroImageTapRef = useRef({ ax: 0, ay: 0, moved: false })
  const indexRef = useRef(0)

  const n = companies.length
  const nRef = useRef(n)
  nRef.current = n

  const companyIdsKey = useMemo(() => companies.map((c) => c.id).join('\u001f'), [companies])

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    closeKebabMenu(setKebabMenuCompanyId, setKebabMenuPlacement)
  }, [index, stackKey])

  useEffect(() => {
    if (kebabMenuCompanyId == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeKebabMenu(setKebabMenuCompanyId, setKebabMenuPlacement)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kebabMenuCompanyId])

  useEffect(() => {
    if (kebabMenuCompanyId == null) return
    const onPointerDown = (e) => {
      if (e.target.closest?.('.zone-carousel-card__dropdown')) return
      if (e.target.closest?.('.zone-carousel-card__kebab')) return
      closeKebabMenu(setKebabMenuCompanyId, setKebabMenuPlacement)
    }
    const onScroll = () => closeKebabMenu(setKebabMenuCompanyId, setKebabMenuPlacement)
    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [kebabMenuCompanyId])

  const kebabMenuCompany = useMemo(
    () =>
      kebabMenuCompanyId != null ? companies.find((c) => c.id === kebabMenuCompanyId) ?? null : null,
    [companies, kebabMenuCompanyId],
  )

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
    if (isMobileSheet) {
      setSwipeMinHeight(0)
      return
    }
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
  }, [frontCompanyId, index, stackKey, n, isMobileSheet])

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

      <ProductGlbViewerModal
        open={glbModalUrl != null}
        glbUrl={glbModalUrl}
        productTitle={glbModalTitle}
        preloadGlbUrls={glbModalUrl != null ? glbModalProductUrls : null}
        onClose={() => setGlbModal(null)}
        {...(glbModalProductUrls.length > 1
          ? {
              onPrevGlb: () =>
                setGlbModal((m) =>
                  m && m.index > 0 ? { ...m, index: m.index - 1 } : m,
                ),
              onNextGlb: () =>
                setGlbModal((m) => {
                  if (!m) return m
                  const co = companies.find((c) => c.id === m.companyId)
                  const urls = getCompanyProductGlbUrls(co)
                  return m.index < urls.length - 1
                    ? { ...m, index: m.index + 1 }
                    : m
                }),
              canPrevGlb: glbModal != null && glbModal.index > 0,
              canNextGlb:
                glbModal != null &&
                glbModal.index < glbModalProductUrls.length - 1,
            }
          : {})}
      />

      <ProductImageViewerModal
        open={imageViewer != null}
        imageSrc={imageViewer?.src ?? null}
        title={imageViewer?.title ?? null}
        imageAlt={
          imageViewer?.title
            ? `${imageViewer.title} 대표 이미지`
            : '제품 이미지'
        }
        onClose={() => setImageViewer(null)}
      />

      {kebabMenuCompany && kebabMenuPlacement != null
        ? createPortal(
            <div
              className="zone-carousel-card__dropdown"
              style={{ top: kebabMenuPlacement.top, right: kebabMenuPlacement.right }}
              role="menu"
              aria-label={`${kebabMenuCompany.name} 추가 메뉴`}
            >
              <button
                type="button"
                role="menuitem"
                className="zone-carousel-card__dropdown-btn zone-carousel-card__dropdown-btn--outline"
                onClick={(e) => {
                  e.stopPropagation()
                  closeKebabMenu(setKebabMenuCompanyId, setKebabMenuPlacement)
                  window.alert('1:1 문의 신청은 준비 중입니다.')
                }}
              >
                1:1 문의 신청
              </button>
              <button
                type="button"
                role="menuitem"
                className="zone-carousel-card__dropdown-btn zone-carousel-card__dropdown-btn--fill"
                onClick={(e) => {
                  e.stopPropagation()
                  closeKebabMenu(setKebabMenuCompanyId, setKebabMenuPlacement)
                  openCompanyUrl(
                    kebabMenuCompany.brochureUrl,
                    '브로슈어 다운로드 링크는 준비 중입니다.',
                  )
                }}
              >
                브로슈어 다운로드
              </button>
            </div>,
            document.body,
          )
        : null}

      <div className="zone-company-stack__carousel">
        <div
          ref={viewportRef}
          className="zone-company-stack__viewport"
          style={
            !isMobileSheet && swipeMinHeight > 0 ? { minHeight: swipeMinHeight } : undefined
          }
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
              const subtitle = companyCardSubtitle(company)
              const foundedRaw = company.foundedYear
              const foundedDisplay =
                foundedRaw != null && String(foundedRaw).trim() !== ''
                  ? `${foundedRaw}년`
                  : null
              const metrics =
                foundedDisplay || company.employeeCount?.trim() || company.revenue?.trim()
                  ? [
                      { label: '설립연도', value: foundedDisplay ?? '—' },
                      { label: '직원 수', value: company.employeeCount?.trim() || '—' },
                      { label: '매출액', value: company.revenue?.trim() || '—' },
                    ]
                  : null
              const descLead = companyDescriptionLead(company.description)
              const glbUrl = companyGlbUrl(company)
              const showGlb = Boolean(glbUrl)
              const showHero = showGlb || hasCompanyLogo(company.imageUrl)

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
                    className={`zone-carousel-card${showHero ? ` zone-carousel-card--with-hero${showGlb ? ' zone-carousel-card--with-glb' : ''}` : ''}`}
                    aria-label={company.name}
                    aria-current={isCenter ? 'true' : undefined}
                  >
                    <header className="zone-carousel-card__head">
                      <div className="zone-carousel-card__ribbon" aria-hidden />
                      <div className="zone-carousel-card__title-block">
                        <div className="zone-carousel-card__title-row">
                          <h3 className="zone-carousel-card__name">{company.name}</h3>
                          {company.has3dRoom ? (
                            <span className="zone-carousel-card__badge-3d" aria-label="3D 전시 룸 제공">
                              3D
                            </span>
                          ) : null}
                        </div>
                        {subtitle ? <p className="zone-carousel-card__subtitle">{subtitle}</p> : null}
                      </div>
                      <button
                        type="button"
                        className="zone-carousel-card__kebab"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (kebabMenuCompanyId === company.id) {
                            closeKebabMenu(setKebabMenuCompanyId, setKebabMenuPlacement)
                            return
                          }
                          const btn = e.currentTarget
                          const r = btn.getBoundingClientRect()
                          setKebabMenuPlacement({
                            top: r.bottom + 6,
                            right: Math.max(12, window.innerWidth - r.right),
                          })
                          setKebabMenuCompanyId(company.id)
                        }}
                        aria-label={`${company.name} 더보기 메뉴`}
                        aria-haspopup="menu"
                        aria-expanded={kebabMenuCompanyId === company.id}
                      >
                        <span className="zone-carousel-card__kebab-dot" />
                        <span className="zone-carousel-card__kebab-dot" />
                        <span className="zone-carousel-card__kebab-dot" />
                      </button>
                    </header>

                    {metrics ? (
                      <div className="zone-carousel-card__metrics" aria-label="업체 요약">
                        {metrics.map((m) => (
                          <div key={m.label} className="zone-carousel-card__metric">
                            <span className="zone-carousel-card__metric-label">{m.label}</span>
                            <span className="zone-carousel-card__metric-value">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {showHero ? (
                      <div className="zone-carousel-card__split">
                        <p className="zone-carousel-card__desc zone-carousel-card__desc--lead">{descLead}</p>
                        <div
                          className={`zone-carousel-card__figure${showGlb ? ' zone-carousel-card__figure--glb' : ''}${isCenter && (showGlb || hasCompanyLogo(company.imageUrl)) ? ' zone-carousel-card__figure--glb-viewer' : ''}`}
                          onPointerDown={(e) => {
                            if (isCenter && (showGlb || hasCompanyLogo(company.imageUrl)))
                              e.stopPropagation()
                          }}
                          onTouchStart={(e) => {
                            if (isCenter && (showGlb || hasCompanyLogo(company.imageUrl)))
                              e.stopPropagation()
                          }}
                        >
                          {showGlb ? (
                            isCenter ? (
                              <button
                                type="button"
                                className="zone-carousel-card__glb-open"
                                aria-label={`${company.name} 제품 3D 전체 보기`}
                                onPointerDown={(e) => {
                                  e.stopPropagation()
                                  glbThumbTapRef.current = {
                                    ax: e.clientX,
                                    ay: e.clientY,
                                    moved: false,
                                  }
                                }}
                                onPointerMoveCapture={(e) => {
                                  const t = glbThumbTapRef.current
                                  if (t.moved) return
                                  const d = Math.hypot(e.clientX - t.ax, e.clientY - t.ay)
                                  if (d > GLB_OPEN_TAP_SLOP_PX) t.moved = true
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (suppressClickRef.current) {
                                    suppressClickRef.current = false
                                    return
                                  }
                                  if (glbThumbTapRef.current.moved) return
                                  const urls = getCompanyProductGlbUrls(company)
                                  const gi = urls.indexOf(glbUrl)
                                  if (urls.length === 0) return
                                  setGlbModal({
                                    companyId: company.id,
                                    index: gi >= 0 ? gi : 0,
                                  })
                                }}
                              >
                                <ZoneCompanyCardGlbPreview url={glbUrl} />
                              </button>
                            ) : hasCompanyLogo(company.imageUrl) ? (
                              <img
                                src={company.imageUrl}
                                alt=""
                                className="zone-carousel-card__photo"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                onDragStart={(e) => e.preventDefault()}
                              />
                            ) : (
                              <div className="zone-carousel-card__glb-ph" aria-hidden />
                            )
                          ) : isCenter && hasCompanyLogo(company.imageUrl) ? (
                            <button
                              type="button"
                              className="zone-carousel-card__glb-open"
                              aria-label={`${company.name} 이미지 크게 보기`}
                              onPointerDown={(e) => {
                                e.stopPropagation()
                                heroImageTapRef.current = {
                                  ax: e.clientX,
                                  ay: e.clientY,
                                  moved: false,
                                }
                              }}
                              onPointerMoveCapture={(e) => {
                                const t = heroImageTapRef.current
                                if (t.moved) return
                                const d = Math.hypot(e.clientX - t.ax, e.clientY - t.ay)
                                if (d > GLB_OPEN_TAP_SLOP_PX) t.moved = true
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (suppressClickRef.current) {
                                  suppressClickRef.current = false
                                  return
                                }
                                if (heroImageTapRef.current.moved) return
                                setImageViewer({
                                  src: company.imageUrl.trim(),
                                  title: company.name,
                                })
                              }}
                            >
                              <img
                                src={company.imageUrl}
                                alt={`${company.name} 대표 이미지`}
                                className="zone-carousel-card__photo"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                onDragStart={(ev) => ev.preventDefault()}
                              />
                            </button>
                          ) : (
                            <img
                              src={company.imageUrl}
                              alt=""
                              className="zone-carousel-card__photo"
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              onDragStart={(e) => e.preventDefault()}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="zone-carousel-card__desc">{company.description}</p>
                    )}

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
