import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { PRODUCT_DETAIL_LIST } from '../data/productDetailCopy'
import { PRODUCT_GLB_URLS } from '../data/productGlbUrls'
import './ProductImageCarouselUI.css'

const ProductFullscreenGlbCanvas = lazy(() => import('./ProductFullscreenGlbCanvas'))

/**
 * GLB 대신 2D 제품 이미지 캐러셀 — 검정 UI·회사 배지·진행 바·자세히 보기
 * @param {{
 *   companyName: string
 *   companyLogoUrl?: string | null
 *   onBack: () => void
 * }} props
 */
const SWIPE_MIN_PX = 48
const SCROLL_HANDLED_EPS = 10
/** 상세 시트 닫힘 — CSS transition·exit 애니와 맞춤 */
const SHEET_EXIT_MS = 400

/** 더보기 펼침 시 본문 아래 샘플 영역(실제 콘텐츠로 교체 가능) */
const SAMPLE_DETAIL_YOUTUBE_EMBEDS = [
  { id: 'M7lc1UVf-VE', title: '샘플 영상 1' },
  { id: 'jNQXAC9IVRw', title: '샘플 영상 2' },
  { id: '9bZkp7q19f0', title: '샘플 영상 3' },
]

function Icon2dStack({ active }) {
  const o = active ? '#ffffff' : 'rgba(255,255,255,0.38)'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="11" width="14" height="10" rx="2" stroke={o} strokeWidth="1.75" />
      <rect x="7" y="3" width="14" height="10" rx="2" stroke={o} strokeWidth="1.75" />
    </svg>
  )
}

function Icon3dCube({ active }) {
  const o = active ? '#ffffff' : 'rgba(255,255,255,0.38)'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
        stroke={o}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke={o} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

const ProductImageCarouselUI = forwardRef(function ProductImageCarouselUI(
  { companyName, companyLogoUrl, onBack },
  ref,
) {
  const viewportRef = useRef(null)
  const sheetCloseTimerRef = useRef(0)
  const [active, setActive] = useState(0)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  /** 닫기 애니 중에도 시트·푸터 토글 유지 */
  const [sheetExiting, setSheetExiting] = useState(false)
  const [detailOpenSession, setDetailOpenSession] = useState(0)
  /** 상세 시트 안에서 화면 전체를 3D 캔버스(오빗 조작)로 전환 */
  const [inlineGlb, setInlineGlb] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const items = PRODUCT_DETAIL_LIST
  const n = items.length

  const activeRef = useRef(0)
  activeRef.current = active

  const touchStartRef = useRef({ x: 0, y: 0 })
  const scrollLeftStartRef = useRef(0)
  const progressTrackRef = useRef(null)
  const [progressDragging, setProgressDragging] = useState(false)

  const overlayStateRef = useRef({
    detailSheetOpen: false,
    sheetExiting: false,
    inlineGlb: false,
    descriptionExpanded: false,
    progressDragging: false,
  })
  overlayStateRef.current = {
    detailSheetOpen,
    sheetExiting,
    inlineGlb,
    descriptionExpanded,
    progressDragging,
  }

  useImperativeHandle(
    ref,
    () => ({
      resetToOverview: () => {
        const s = overlayStateRef.current
        const had =
          s.detailSheetOpen ||
          s.sheetExiting ||
          s.inlineGlb ||
          s.descriptionExpanded ||
          s.progressDragging
        window.clearTimeout(sheetCloseTimerRef.current)
        sheetCloseTimerRef.current = 0
        setSheetExiting(false)
        setDetailSheetOpen(false)
        setInlineGlb(false)
        setDescriptionExpanded(false)
        setProgressDragging(false)
        return had
      },
    }),
    [],
  )

  const scrollSlideIntoView = useCallback((index) => {
    const v = viewportRef.current
    if (!v || index < 0 || index >= n) return
    const slides = v.querySelectorAll('[data-carousel-slide]')
    const slide = slides[index]
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [n])

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return
    const v = viewportRef.current
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    scrollLeftStartRef.current = v?.scrollLeft ?? 0
  }, [])

  const onTouchEnd = useCallback(
    (e) => {
      const v = viewportRef.current
      const t = e.changedTouches[0]
      if (!v || !t) return
      const dx = t.clientX - touchStartRef.current.x
      const dy = t.clientY - touchStartRef.current.y
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.05) return
      const scrolled = Math.abs(v.scrollLeft - scrollLeftStartRef.current)
      if (scrolled > SCROLL_HANDLED_EPS) return
      const cur = activeRef.current
      if (dx < 0 && cur < n - 1) scrollSlideIntoView(cur + 1)
      else if (dx > 0 && cur > 0) scrollSlideIntoView(cur - 1)
    },
    [n, scrollSlideIntoView],
  )

  const snapCarouselToNearestSlide = useCallback(() => {
    const el = viewportRef.current
    if (!el || n <= 1) return
    const slides = el.querySelectorAll('[data-carousel-slide]')
    if (slides.length === 0) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    let best = 0
    let bestDist = Infinity
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect()
      const c = r.left + r.width / 2
      const d = Math.abs(c - centerX)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    scrollSlideIntoView(best)
  }, [n, scrollSlideIntoView])

  const applyProgressClientX = useCallback(
    (clientX) => {
      const track = progressTrackRef.current
      const v = viewportRef.current
      if (!track || !v || n <= 1) return
      const twPct = 100 / n
      const tr = track.getBoundingClientRect()
      const W = tr.width
      const w = (twPct / 100) * W
      const maxSlide = v.scrollWidth - v.clientWidth
      if (W <= w || maxSlide <= 0) return
      const cx = Math.min(tr.right - w / 2, Math.max(tr.left + w / 2, clientX))
      const thumbLeft = cx - w / 2 - tr.left
      const u = thumbLeft / (W - w)
      v.scrollLeft = u * maxSlide
    },
    [n],
  )

  const onProgressThumbPointerDown = useCallback(
    (e) => {
      if (n <= 1) return
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      setProgressDragging(true)
      applyProgressClientX(e.clientX)
    },
    [n, applyProgressClientX],
  )

  const onProgressThumbPointerMove = useCallback(
    (e) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
      applyProgressClientX(e.clientX)
    },
    [applyProgressClientX],
  )

  const onProgressThumbPointerUp = useCallback(
    (e) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      setProgressDragging(false)
      requestAnimationFrame(() => snapCarouselToNearestSlide())
    },
    [snapCarouselToNearestSlide],
  )

  const onProgressThumbKeyDown = useCallback(
    (e) => {
      if (n <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollSlideIntoView(Math.max(0, active - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        scrollSlideIntoView(Math.min(n - 1, active + 1))
      }
    },
    [n, active, scrollSlideIntoView],
  )

  const updateActiveFromScroll = useCallback(() => {
    const el = viewportRef.current
    if (!el || n === 0) return
    const slides = el.querySelectorAll('[data-carousel-slide]')
    if (slides.length === 0) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    let best = 0
    let bestDist = Infinity
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect()
      const c = r.left + r.width / 2
      const d = Math.abs(c - centerX)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    setActive((prev) => (prev === best ? prev : best))
  }, [n])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    updateActiveFromScroll()
    el.addEventListener('scroll', updateActiveFromScroll, { passive: true })
    return () => el.removeEventListener('scroll', updateActiveFromScroll)
  }, [updateActiveFromScroll, n])

  useEffect(() => {
    setDescriptionExpanded(false)
  }, [active])

  useEffect(() => {
    return () => {
      window.clearTimeout(sheetCloseTimerRef.current)
    }
  }, [])

  const thumbWidthPct = n <= 1 ? 100 : 100 / n
  const maxTravel = 100 - thumbWidthPct
  const thumbLeftPct = n <= 1 ? 0 : (active / Math.max(1, n - 1)) * maxTravel

  const copy = items[active]
  const highlightLine = copy?.specs?.[0] ?? null
  const expandedSpecRows = copy ? (highlightLine ? copy.specs.slice(1) : copy.specs) : []

  const sheetVisible = (detailSheetOpen || sheetExiting) && !!copy

  useEffect(() => {
    if (!sheetVisible) setInlineGlb(false)
  }, [sheetVisible])

  const openDetailSheet = useCallback(() => {
    window.clearTimeout(sheetCloseTimerRef.current)
    setSheetExiting(false)
    setInlineGlb(false)
    setDescriptionExpanded(false)
    setDetailOpenSession((s) => s + 1)
    setDetailSheetOpen(true)
  }, [])

  const closeDetailSheet = useCallback(() => {
    if (!detailSheetOpen || sheetExiting) return
    setSheetExiting(true)
    window.clearTimeout(sheetCloseTimerRef.current)
    sheetCloseTimerRef.current = window.setTimeout(() => {
      setDetailSheetOpen(false)
      setSheetExiting(false)
      setDescriptionExpanded(false)
    }, SHEET_EXIT_MS)
  }, [detailSheetOpen, sheetExiting])

  const fullscreenGlb = sheetVisible && inlineGlb
  const glbUrl = PRODUCT_GLB_URLS[active]
  const detailBodyExpanded =
    sheetVisible && !fullscreenGlb && !sheetExiting && descriptionExpanded

  const rootMods = [
    sheetVisible ? 'product-image-carousel-ui--detail-sheet' : '',
    sheetExiting ? 'product-image-carousel-ui--sheet-leaving' : '',
    fullscreenGlb ? 'product-image-carousel-ui--fullscreen-glb' : '',
    detailBodyExpanded ? 'product-image-carousel-ui--detail-desc-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const collapseDescription = useCallback(() => setDescriptionExpanded(false), [])

  return (
    <div
      className={`product-image-carousel-ui${rootMods ? ` ${rootMods}` : ''}`}
      data-product-image-carousel
    >
      <header className="product-image-carousel-ui__header">
        <button type="button" className="product-image-carousel-ui__back" onClick={onBack} aria-label="뒤로">
          ←
        </button>
        <div className="product-image-carousel-ui__badge">
          {companyLogoUrl ? (
            <img
              src={companyLogoUrl}
              alt=""
              className="product-image-carousel-ui__badge-logo"
              loading="lazy"
            />
          ) : null}
          <p className="product-image-carousel-ui__badge-name">{companyName}</p>
        </div>
        <span className="product-image-carousel-ui__header-spacer" aria-hidden />
      </header>

      <div className="product-image-carousel-ui__carousel-column">
        <div
          ref={viewportRef}
          className={`product-image-carousel-ui__viewport${fullscreenGlb ? ' product-image-carousel-ui__viewport--concealed' : ''}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="product-image-carousel-ui__track">
            {items.map((item, i) => {
              const isCenter = i === active
              return (
                <div
                  key={item.title + i}
                  data-carousel-slide
                  className={`product-image-carousel-ui__slide ${
                    isCenter ? 'product-image-carousel-ui__slide--center' : 'product-image-carousel-ui__slide--side'
                  }`}
                >
                  <div className="product-image-carousel-ui__img-wrap">
                    <img
                      src={item.imageUrl}
                      alt=""
                      draggable={false}
                      className="product-image-carousel-ui__hero-img"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {copy && !fullscreenGlb ? (
          <div
            className={`product-image-carousel-ui__meta${sheetVisible ? ' product-image-carousel-ui__meta--concealed' : ''}`}
          >
            <h2 className="product-image-carousel-ui__title">{copy.title}</h2>
            <p className="product-image-carousel-ui__subtitle">{copy.subtitle}</p>
          </div>
        ) : null}

        {!fullscreenGlb ? (
          <div ref={progressTrackRef} className="product-image-carousel-ui__progress">
            <div
              role="slider"
              className={`product-image-carousel-ui__progress-thumb${
                progressDragging ? ' product-image-carousel-ui__progress-thumb--dragging' : ''
              }`}
              style={{
                width: `${thumbWidthPct}%`,
                left: `${thumbLeftPct}%`,
              }}
              tabIndex={n <= 1 ? -1 : 0}
              aria-label="슬라이드 위치 — 드래그하거나 좌우 화살표로 이동"
              aria-valuemin={1}
              aria-valuemax={Math.max(1, n)}
              aria-valuenow={active + 1}
              aria-orientation="horizontal"
              onPointerDown={onProgressThumbPointerDown}
              onPointerMove={onProgressThumbPointerMove}
              onPointerUp={onProgressThumbPointerUp}
              onPointerCancel={onProgressThumbPointerUp}
              onKeyDown={onProgressThumbKeyDown}
            />
          </div>
        ) : null}
      </div>

      {fullscreenGlb && glbUrl ? (
        <div
          className="product-image-carousel-ui__fullscreen-glb"
          role="application"
          aria-label="3D 제품 — 드래그하여 회전"
        >
          <Suspense
            fallback={<div className="product-image-carousel-ui__glb-fallback product-image-carousel-ui__glb-fallback--fullscreen" aria-hidden />}
          >
            <ProductFullscreenGlbCanvas key={`${active}-${glbUrl}`} glbUrl={glbUrl} />
          </Suspense>
        </div>
      ) : null}

      {sheetVisible && !inlineGlb ? (
        descriptionExpanded ? (
          <div className="product-image-carousel-ui__sheet-scrim" aria-hidden />
        ) : (
          <button
            type="button"
            className="product-image-carousel-ui__sheet-scrim product-image-carousel-ui__sheet-scrim--close"
            aria-label="상세 시트 닫기"
            onClick={closeDetailSheet}
          />
        )
      ) : null}

      {sheetVisible && !fullscreenGlb ? (
        <section
          className={`product-image-carousel-ui__detail-sheet${
            sheetExiting ? ' product-image-carousel-ui__detail-sheet--exiting' : ''
          }${descriptionExpanded ? ' product-image-carousel-ui__detail-sheet--body-expanded' : ''}`}
          aria-labelledby="product-detail-sheet-title"
        >
          <div className="product-image-carousel-ui__detail-sheet-body">
            <div className="product-image-carousel-ui__detail-sheet-head">
              <div className="product-image-carousel-ui__detail-sheet-titles">
                <h2 id="product-detail-sheet-title" className="product-image-carousel-ui__detail-sheet-title">
                  {copy.title}
                </h2>
                <p className="product-image-carousel-ui__detail-sheet-subtitle">{copy.subtitle}</p>
              </div>
            </div>
            <div className="product-image-carousel-ui__detail-sheet-divider" aria-hidden />
            {highlightLine ? (
              <p className="product-image-carousel-ui__detail-sheet-highlight">{highlightLine}</p>
            ) : null}
            <p
              className={`product-image-carousel-ui__detail-sheet-desc${
                descriptionExpanded ? ' product-image-carousel-ui__detail-sheet-desc--expanded' : ''
              }`}
            >
              {copy.description}
            </p>
            {descriptionExpanded ? (
              <div
                className="product-image-carousel-ui__detail-embeds"
                aria-label="샘플 동영상"
              >
                {SAMPLE_DETAIL_YOUTUBE_EMBEDS.map(({ id, title }) => (
                  <div key={id} className="product-image-carousel-ui__detail-embed">
                    <div className="product-image-carousel-ui__detail-embed-frame">
                      <iframe
                        title={title}
                        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {!descriptionExpanded ? (
              <button
                type="button"
                className="product-image-carousel-ui__detail-sheet-more"
                onClick={() => setDescriptionExpanded(true)}
                aria-expanded={false}
              >
                <span>더보기</span>
                <span className="product-image-carousel-ui__detail-sheet-more-chev" aria-hidden>
                  ▼
                </span>
              </button>
            ) : null}
            {descriptionExpanded && expandedSpecRows.length > 0 ? (
              <ul
                key={`${active}-specs`}
                className="product-image-carousel-ui__detail-sheet-specs product-image-carousel-ui__detail-sheet-specs--enter"
                aria-label="주요 사양"
              >
                {expandedSpecRows.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {detailBodyExpanded ? (
        <button
          type="button"
          className="product-image-carousel-ui__detail-collapse-fixed"
          onClick={collapseDescription}
          aria-label="상세 본문 접기"
        >
          <span>닫기</span>
          <span className="product-image-carousel-ui__detail-collapse-fixed-chev" aria-hidden>
            ▲
          </span>
        </button>
      ) : null}

      <div
        className={`product-image-carousel-ui__footer${
          sheetVisible ? ' product-image-carousel-ui__footer--toggle-only' : ''
        }${detailBodyExpanded ? ' product-image-carousel-ui__footer--concealed' : ''}`}
      >
        <div className="product-image-carousel-ui__footer-stack">
          <div
            className={`product-image-carousel-ui__footer-layer${
              sheetVisible ? ' product-image-carousel-ui__footer-layer--hidden' : ''
            }`}
          >
            <button type="button" className="product-image-carousel-ui__cta" onClick={openDetailSheet}>
              자세히 보기
            </button>
          </div>
          <div
            className={`product-image-carousel-ui__footer-layer${
              sheetVisible && !descriptionExpanded ? '' : ' product-image-carousel-ui__footer-layer--hidden'
            }`}
          >
            <div
              key={detailOpenSession}
              className="product-image-carousel-ui__view-pill"
              role="group"
              aria-label="보기 전환"
            >
              <button
                type="button"
                className={`product-image-carousel-ui__view-pill-btn${!inlineGlb ? ' product-image-carousel-ui__view-pill-btn--active' : ''}`}
                aria-pressed={!inlineGlb}
                aria-label="2D 이미지 보기"
                onClick={() => setInlineGlb(false)}
              >
                <Icon2dStack active={!inlineGlb} />
              </button>
              <span className="product-image-carousel-ui__view-pill-dot" aria-hidden>
                ·
              </span>
              <button
                type="button"
                className={`product-image-carousel-ui__view-pill-btn${inlineGlb ? ' product-image-carousel-ui__view-pill-btn--active' : ''}`}
                aria-pressed={inlineGlb}
                aria-label="3D 모델로 보기"
                onClick={() => setInlineGlb(true)}
              >
                <Icon3dCube active={inlineGlb} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

ProductImageCarouselUI.displayName = 'ProductImageCarouselUI'

export default ProductImageCarouselUI
