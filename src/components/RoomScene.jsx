import {
  A11yAnnouncer,
  A11yUserPreferencesContext,
  useUserPreferences,
} from '@react-three/a11y'
import {
  forwardRef,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  memo,
  useCallback,
  useMemo,
  useImperativeHandle,
} from 'react'
import { gsap } from 'gsap'
import ObjectInfoPanel from './ObjectInfoPanel'
import ObjectViewer from './ObjectViewer'
import ProductImageCarouselUI from './ProductImageCarouselUI'
import ProductDetailPanel from './ProductDetailPanel'
import { ProductGlbViewerModal } from './ProductGlbViewerModal'
import RoomDetailLanding from './RoomDetailLanding'
import { PRODUCT_GLB_URLS } from '../data/productGlbUrls'
import { getCompanyById } from '../data/exhibitorsByZone'
import { PRODUCT_DETAIL_LIST } from '../data/productDetailCopy'
import { useBrowserWidthPx } from '../hooks/useBrowserWidthPx'

/** ProductDetailPanel.css 바텀시트 브레이크포인트와 동일 */
const PRODUCT_DETAIL_PANEL_MOBILE_MAX_PX = 767

const PRODUCT_DETAIL_NAV_ARROW_SVG = 34

/** `false`면 show_room2 부스 + 박스 전시물 비표시 — 제품 캐러셀만 사용 */
const SHOW_LEGACY_BOOTH_AND_EXHIBITS = false

const ROOM_SCENE_BACK_BUTTON_STYLE = {
  position: 'absolute',
  top: 'max(20px, env(safe-area-inset-top, 0px))',
  left: 'max(20px, env(safe-area-inset-left, 0px))',
  zIndex: 1000,
  padding: '12px 24px',
  background: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  pointerEvents: 'auto',
}

/** 룸 상단 크롬 — 제품 상세 시 스크롤 레이어(z-index:1)보다 위에 두기 위해 분리 */
function RoomSceneTopBar({
  onBack,
  productDetail,
  isProductDetailPanelMobileLayout,
  onPrevProduct,
  onNextProduct,
  productDetailNavBtnStyle,
  onOpenProduct3dView,
}) {
  return (
    <>
      <button type="button" onClick={onBack} style={ROOM_SCENE_BACK_BUTTON_STYLE}>
        {'< BACK'}
      </button>

      {productDetail && onOpenProduct3dView ? (
        <button
          type="button"
          onClick={onOpenProduct3dView}
          style={{
            position: 'absolute',
            top: 'max(16px, env(safe-area-inset-top, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            pointerEvents: 'auto',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          3D VIEW
        </button>
      ) : null}

      {productDetail ? (
        <>
          <button
            type="button"
            aria-label="이전 제품 상세"
            disabled={productDetail.index <= 0}
            onClick={onPrevProduct}
            style={{
              position: 'absolute',
              left: 16,
              ...(isProductDetailPanelMobileLayout
                ? { top: '40%', transform: 'translateY(-50%)' }
                : { top: '50%', transform: 'translateY(-50%)' }),
              zIndex: 1150,
              pointerEvents: 'auto',
              ...productDetailNavBtnStyle(productDetail.index > 0),
            }}
          >
            <svg
              width={PRODUCT_DETAIL_NAV_ARROW_SVG}
              height={PRODUCT_DETAIL_NAV_ARROW_SVG}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="다음 제품 상세"
            disabled={productDetail.index >= PRODUCT_DETAIL_LIST.length - 1}
            onClick={onNextProduct}
            style={{
              position: 'absolute',
              ...(isProductDetailPanelMobileLayout
                ? { top: '40%', transform: 'translateY(-50%)' }
                : { top: '50%', transform: 'translateY(-50%)' }),
              zIndex: 1150,
              pointerEvents: 'auto',
              ...(isProductDetailPanelMobileLayout
                ? { right: 16, left: 'auto' }
                : {
                    left: 'max(16px, calc(100vw - min(1040px, 78vw) - 72px))',
                    right: 'auto',
                  }),
              ...productDetailNavBtnStyle(
                productDetail.index < PRODUCT_DETAIL_LIST.length - 1,
              ),
            }}
          >
            <svg
              width={PRODUCT_DETAIL_NAV_ARROW_SVG}
              height={PRODUCT_DETAIL_NAV_ARROW_SVG}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : null}
    </>
  )
}

/**
 * 방 씬 컴포넌트 — 업체 클릭 시 표시되는 전시 룸(2D 제품 캐러셀 + 상세).
 *
 * @react-three/a11y: 룸 전용 Provider(prefersDarkScheme 고정) + A11yAnnouncer.
 */
const RoomSceneInner = memo(
  forwardRef(function RoomSceneInner({ companyId, onBack }, ref) {
  const roomSceneRootRef = useRef(null)
  const scrollRootRef = useRef(null)
  const fixedLayerRef = useRef(null)
  const productCarouselRef = useRef(null)
  const productDetailRef = useRef(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [showModal, setShowModal] = useState(false)
  /** 제품 GLB 클릭 시 오른쪽 패널 + 캐러셀 상세 동기화 */
  const [productDetail, setProductDetail] = useState(null)
  productDetailRef.current = productDetail

  useImperativeHandle(
    ref,
    () => ({
      resetProductCarouselOverview: () => {
        let consumed = productCarouselRef.current?.resetToOverview?.() ?? false
        if (productDetailRef.current) {
          setProductDetail(null)
          consumed = true
        }
        return consumed
      },
    }),
    [],
  )

  const exhibitor = useMemo(() => getCompanyById(companyId ?? null), [companyId])
  const [productGlbViewerOpen, setProductGlbViewerOpen] = useState(false)
  const { a11yPrefersState } = useUserPreferences()

  const productGlbUrl = useMemo(() => {
    if (!productDetail || productDetail.index < 0) return null
    return PRODUCT_GLB_URLS[productDetail.index] ?? null
  }, [productDetail])

  const openProductGlbViewer = useCallback(() => setProductGlbViewerOpen(true), [])
  const closeProductGlbViewer = useCallback(() => setProductGlbViewerOpen(false), [])
  /** /room/* 는 Provider에서 다크 고정 — OS 라이트여도 라이트 테마 없음 */
  const prefersDark = true
  const prefersReducedMotion = a11yPrefersState.prefersReducedMotion
  const browserWidthPx = useBrowserWidthPx()
  const isProductDetailPanelMobileLayout =
    browserWidthPx <= PRODUCT_DETAIL_PANEL_MOBILE_MAX_PX

  /** App 이 lazy Room 을 50ms 만에 querySelector 하면 노드가 없어 opacity:0 에 고착됨 → 마운트 시 여기서 페이드인 */
  useLayoutEffect(() => {
    const el = roomSceneRootRef.current
    if (!el) return
    if (prefersReducedMotion) {
      el.style.opacity = '1'
      return
    }
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.65, ease: 'power2.out' })
  }, [prefersReducedMotion])

  const sceneBackgroundGradient = useMemo(
    () => 'linear-gradient(to bottom, #0d1117 0%, #161b22 35%, #21262d 70%, #30363d 100%)',
    [],
  )
  
  // 객체 정보 데이터 (예시) - useMemo로 메모이제이션하여 불필요한 재생성 방지
  const objectInfoMap = useMemo(() => ({
    'desk': {
      category: 'WORKSPACE',
      title: 'Creative Desk',
      subtitle: 'Workspace',
      description: 'This desk serves as the foundation for countless ideas and projects. It\'s where creativity meets productivity, where concepts transform into reality.',
      icons: [
        { 
          component: '💀', 
          active: true,
          title: 'Creative Desk',
          subtitle: 'Workspace',
          description: 'This desk serves as the foundation for countless ideas and projects. It\'s where creativity meets productivity, where concepts transform into reality.'
        },
        { 
          component: '💡', 
          active: false,
          title: 'Inspiration Hub',
          subtitle: 'Ideas',
          description: 'Every great project starts with a single idea. This desk has been the birthplace of countless innovations and creative solutions that shaped our journey.'
        },
        { 
          component: '⚙️', 
          active: false,
          title: 'Productivity Engine',
          subtitle: 'Efficiency',
          description: 'Designed for optimal workflow and organization. This workspace adapts to different projects, from design mockups to code development, ensuring maximum productivity.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Launch Platform',
          subtitle: 'Innovation',
          description: 'From concept to launch, this desk has witnessed the entire lifecycle of products. It\'s where prototypes become reality and dreams take flight.'
        },
      ]
    },
    'monitor': {
      category: 'DISPLAY',
      title: 'Vision Screen',
      subtitle: 'Monitor',
      description: 'A window to digital worlds and creative visions. This monitor displays the results of countless hours of work and innovation.',
      icons: [
        { 
          component: '💀', 
          active: false,
          title: 'Vision Screen',
          subtitle: 'Monitor',
          description: 'A window to digital worlds and creative visions. This monitor displays the results of countless hours of work and innovation.'
        },
        { 
          component: '💡', 
          active: true,
          title: 'Creative Canvas',
          subtitle: 'Visualization',
          description: 'Where pixels come alive and designs take shape. This screen has showcased everything from wireframes to final products, bringing ideas to visual reality.'
        },
        { 
          component: '⚙️', 
          active: false,
          title: 'Technical Display',
          subtitle: 'Development',
          description: 'Perfect for coding, debugging, and technical work. The high resolution and color accuracy make it ideal for both development and design tasks.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Presentation Hub',
          subtitle: 'Showcase',
          description: 'The screen where we present our work to clients and stakeholders. Every pixel matters when showcasing the results of our creative and technical efforts.'
        },
      ]
    },
    'arcade': {
      category: 'ENTERTAINMENT',
      title: 'Arcade Machine',
      subtitle: 'Gaming',
      description: 'A tribute to the games we developed but didn\'t reach millions. We treasure the wisdom and learnings they brought us.',
      icons: [
        { 
          component: '💀', 
          active: true,
          title: 'Arcade Machine',
          subtitle: 'Gaming',
          description: 'A tribute to the games we developed but didn\'t reach millions. We treasure the wisdom and learnings they brought us.'
        },
        { 
          component: '💡', 
          active: false,
          title: 'Creative Experiments',
          subtitle: 'Innovation',
          description: 'This machine represents our experimental projects - games that pushed boundaries and explored new gameplay mechanics, even if they didn\'t achieve commercial success.'
        },
        { 
          component: '⚙️', 
          active: false,
          title: 'Technical Learning',
          subtitle: 'Growth',
          description: 'Every game taught us something valuable. From optimization techniques to player psychology, these projects were our greatest teachers in game development.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Future Dreams',
          subtitle: 'Aspiration',
          description: 'These games may not have reached millions, but they fuel our passion for creating the next big hit. Every failure is a stepping stone to success.'
        },
      ]
    },
    'chair': {
      category: 'FURNITURE',
      title: 'Comfort Seat',
      subtitle: 'Chair',
      description: 'Where ideas take shape. This chair has witnessed countless brainstorming sessions and creative breakthroughs.',
      icons: [
        { 
          component: '💀', 
          active: false,
          title: 'Comfort Seat',
          subtitle: 'Chair',
          description: 'Where ideas take shape. This chair has witnessed countless brainstorming sessions and creative breakthroughs.'
        },
        { 
          component: '💡', 
          active: false,
          title: 'Brainstorming Station',
          subtitle: 'Ideation',
          description: 'The perfect spot for deep thinking and creative sessions. Many breakthrough ideas were born while sitting here, contemplating solutions to complex problems.'
        },
        { 
          component: '⚙️', 
          active: true,
          title: 'Ergonomic Design',
          subtitle: 'Comfort',
          description: 'Designed for long hours of focused work. The ergonomic design ensures comfort during extended coding sessions, design work, and creative endeavors.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Productivity Throne',
          subtitle: 'Focus',
          description: 'Where productivity meets comfort. This chair has been the command center for launching products, writing code, and bringing visions to life.'
        },
      ]
    },
    'bookshelf': {
      category: 'STORAGE',
      title: 'Knowledge Archive',
      subtitle: 'Bookshelf',
      description: 'A collection of knowledge and inspiration. Books, references, and memories stored in this shelf.',
      icons: [
        { 
          component: '📚', 
          active: true,
          title: 'Knowledge Archive',
          subtitle: 'Bookshelf',
          description: 'A collection of knowledge and inspiration. Books, references, and memories stored in this shelf.'
        },
      ]
    },
    'lamp': {
      category: 'LIGHTING',
      title: 'Creative Light',
      subtitle: 'Lamp',
      description: 'Illuminating ideas and projects. This lamp has been a constant companion during late-night work sessions.',
      icons: [
        { 
          component: '💡', 
          active: true,
          title: 'Creative Light',
          subtitle: 'Lamp',
          description: 'Illuminating ideas and projects. This lamp has been a constant companion during late-night work sessions.'
        },
      ]
    },
    'table': {
      category: 'FURNITURE',
      title: 'Collaboration Table',
      subtitle: 'Table',
      description: 'Where teams gather to discuss, plan, and create together. Many successful projects started here.',
      icons: [
        { 
          component: '🤝', 
          active: true,
          title: 'Collaboration Table',
          subtitle: 'Table',
          description: 'Where teams gather to discuss, plan, and create together. Many successful projects started here.'
        },
      ]
    },
    'shelf': {
      category: 'STORAGE',
      title: 'Display Shelf',
      subtitle: 'Shelf',
      description: 'Showcasing achievements, prototypes, and memorable items from our journey.',
      icons: [
        { 
          component: '🏆', 
          active: true,
          title: 'Display Shelf',
          subtitle: 'Shelf',
          description: 'Showcasing achievements, prototypes, and memorable items from our journey.'
        },
      ]
    },
  }), []) // 빈 의존성 배열로 한 번만 생성

  /** 조건부 JSX 안에서 훅을 쓰면 productDetail 등으로 분기 시 훅 개수가 달라져 크래시 남 */
  const objectInfoForPanel = useMemo(
    () => (selectedObject ? { ...objectInfoMap[selectedObject], id: selectedObject } : null),
    [selectedObject, objectInfoMap]
  )
  const handleRoomObjectClick = useCallback((objectId) => {
    setSelectedObject(objectId)
  }, [])
  const handleCloseObjectInfo = useCallback(() => setSelectedObject(null), [])
  const handleOpenObjectModal = useCallback(() => setShowModal(true), [])
  const handleCloseObjectModal = useCallback(() => {
    setShowModal(false)
  }, [])

  /** 전체보기: 제품 확대/정보창·레거시 객체 패널·모달 해제 → 캐러셀 전체 뷰 */
  const handleViewAll = useCallback(() => {
    setProductDetail(null)
    setSelectedObject(null)
    setShowModal(false)
  }, [])

  /**
   * 좌상단 < BACK: 상세 제품 설명 중이면 캐러셀 뷰만 복귀, 아니면 App onBack(월드/맵 루트)
   */
  const handleBackButtonClick = useCallback(() => {
    if (productDetail) {
      handleViewAll()
      return
    }
    onBack()
  }, [productDetail, onBack, handleViewAll])

  /** 제품 상세 — 화면 고정 좌·우 화살표(Glb 트래킹 없음) */
  const navigateProductDetailAdjacent = useCallback(
    (left) => {
      if (!productDetail) return
      const max = PRODUCT_DETAIL_LIST.length - 1
      const idx = productDetail.index
      const next = left ? Math.max(0, idx - 1) : Math.min(max, idx + 1)
      if (next === idx) return
      const copy = PRODUCT_DETAIL_LIST[next]
      setProductDetail({ index: next, copy })
    },
    [productDetail],
  )

  const productDetailNavBtnStyle = useCallback(
    (enabled) => {
      const fg = prefersDark ? '#e2e8f0' : '#0f172a'
      const fgMuted = prefersDark ? 'rgba(226, 232, 240, 0.5)' : 'rgba(15, 23, 42, 0.45)'
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
        borderRadius: 14,
        border: 'none',
        cursor: enabled ? 'pointer' : 'not-allowed',
        background: enabled
          ? prefersDark
            ? 'rgba(51, 65, 85, 0.88)'
            : 'rgba(241, 245, 249, 0.96)'
          : prefersDark
            ? 'rgba(30, 41, 59, 0.5)'
            : 'rgba(226, 232, 240, 0.55)',
        color: enabled ? fg : fgMuted,
        opacity: enabled ? 1 : 0.4,
        boxShadow: prefersDark
          ? '0 8px 24px rgba(0,0,0,0.35)'
          : '0 8px 20px rgba(15,23,42,0.12)',
        transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease, background 0.15s ease',
        padding: 0,
      }
    },
    [prefersDark, prefersReducedMotion],
  )

  /** 제품 GLB 확대 시: 3D는 화면에 고정, 그 위 스크롤 레이어에서 랜딩만 올라옴 */
  const detailPageScroll = !!productDetail

  /** 모바일: 첫 화면에서 아래 랜딩 유도 문구 (스크롤하면 숨김) — RoomDetailLanding.css */
  const [showMobileLandingHint, setShowMobileLandingHint] = useState(true)

  useEffect(() => {
    if (!productDetail) setProductGlbViewerOpen(false)
  }, [productDetail])

  useEffect(() => {
    if (!detailPageScroll || !isProductDetailPanelMobileLayout) {
      setShowMobileLandingHint(true)
      return
    }
    setShowMobileLandingHint(true)
    const root = scrollRootRef.current
    if (!root) return
    const onScroll = () => {
      if (root.scrollTop > 56) setShowMobileLandingHint(false)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [detailPageScroll, isProductDetailPanelMobileLayout, productDetail?.index])

  /**
   * 제품 상세: 고정 레이어 위 스와이프만 스크롤 루트로 연결.
   * data-room-scroll 안(랜딩·스페이서)은 터치 리스너를 거치지 않고 브라우저 네이티브 스크롤(관성) 사용 — 수동 scrollTop 조작과 겹치면 덜컹거림.
   */
  useEffect(() => {
    if (!detailPageScroll) return
    const fixed = fixedLayerRef.current
    const root = scrollRootRef.current
    if (!fixed || !root) return

    const onWheel = (e) => {
      if (
        typeof e.target?.closest === 'function' &&
        e.target.closest('.product-detail-panel__inner')
      ) {
        return
      }
      root.scrollTop += e.deltaY
      e.preventDefault()
    }

    let lastTouchY = /** @type {number | null} */ (null)
    const onTouchStart = (e) => {
      if (e.touches?.length === 1) lastTouchY = e.touches[0].clientY
    }
    const onTouchEnd = () => {
      lastTouchY = null
    }
    const onTouchMove = (e) => {
      if (lastTouchY == null || e.touches?.length !== 1) return
      if (typeof e.target?.closest === 'function' && e.target.closest('.product-detail-panel__inner')) {
        lastTouchY = e.touches[0].clientY
        return
      }
      const y = e.touches[0].clientY
      const dy = lastTouchY - y
      lastTouchY = y
      root.scrollTop += dy
      e.preventDefault()
    }

    const capTrue = { capture: true }
    fixed.addEventListener('wheel', onWheel, { passive: false, capture: true })
    fixed.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    fixed.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    fixed.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
    fixed.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true })

    return () => {
      fixed.removeEventListener('wheel', onWheel, capTrue)
      fixed.removeEventListener('touchstart', onTouchStart, capTrue)
      fixed.removeEventListener('touchmove', onTouchMove, capTrue)
      fixed.removeEventListener('touchend', onTouchEnd, capTrue)
      fixed.removeEventListener('touchcancel', onTouchEnd, capTrue)
    }
  }, [detailPageScroll])

  return (
    <div
      ref={roomSceneRootRef}
      data-room-scene
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        opacity: 0,
        overflow: 'hidden',
        colorScheme: 'dark',
      }}
    >
      {/* UI는 뷰포트에 고정 — 제품 상세 스크롤 시에도 화면에서 움직이지 않음 */}
      <div
        ref={fixedLayerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: productDetail ? sceneBackgroundGradient : '#000000',
          transition: 'background 0.35s ease',
        }}
      >
      {/* 뒤로: 제품 목록은 ProductImageCarouselUI 헤더 — 상세는 RoomSceneTopBar */}

      <div
        role="region"
        aria-label="제품 전시"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        제품 이미지 캐러셀에서 항목을 선택하면 상세 정보를 볼 수 있습니다. 왼쪽 아래 패널에서 다크
        모드·모션 감소 선호를 바꿀 수 있습니다.
      </div>

      {!productDetail ? (
        <ProductImageCarouselUI
          ref={productCarouselRef}
          companyName={exhibitor?.name ?? '전시 업체'}
          companyLogoUrl={exhibitor?.imageUrl}
          onBack={handleBackButtonClick}
        />
      ) : null}

      <A11yAnnouncer />

      {/* 제품 상세 정보창 — 확대 모드: 고정 레이어 오른쪽 (embedded) */}
      <ProductDetailPanel
        product={productDetail}
        onClose={() => setProductDetail(null)}
        embedded={detailPageScroll}
      />

      {/* 객체 정보 패널 (오른쪽) - 객체 클릭 시 바로 표시, 모달·제품 상세 열리면 숨김 */}
      {!showModal && !productDetail && SHOW_LEGACY_BOOTH_AND_EXHIBITS && (
        <ObjectInfoPanel
          objectInfo={objectInfoForPanel}
          onClose={handleCloseObjectInfo}
          onOpenModal={handleOpenObjectModal}
        />
      )}

      {/* 객체 뷰어 (중앙) - 제품 상세보기 버튼 클릭 시 표시 */}
      {showModal && (
        <ObjectViewer objectInfo={objectInfoForPanel} onClose={handleCloseObjectModal} />
      )}
      </div>

      {detailPageScroll ? (
        <div
          ref={scrollRootRef}
          data-room-scroll
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            pointerEvents: 'none',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="room-detail-scroll-hint-wrap">
            {showMobileLandingHint && isProductDetailPanelMobileLayout ? (
              <p
                className="room-detail-scroll-hint"
                role="status"
                aria-live="polite"
              >
                <span className="room-detail-scroll-hint__chev" aria-hidden>
                  ↑
                </span>
                아래 &quot;제품 추가 소개&quot;를 보려면 화면을 위로 밀어 올리세요
              </p>
            ) : null}
            {/* 모바일: 하단 ~제품 패널 높이만큼은 터치 통과 → 3D/패널 조작 가능. 그 위는 스크롤 루트가 스와이프 수신 */}
            <div className="room-detail-scroll-hint-pass-panel" aria-hidden />
          </div>
          <div style={{ pointerEvents: 'auto', position: 'relative' }}>
            <RoomDetailLanding product={productDetail} />
          </div>
        </div>
      ) : null}

      {detailPageScroll ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            /* 스크롤 랜딩(z-index:1)·캔버스 고정층보다 확실히 위 — 투명 플랫폼이 포인터를 빼앗는 경우 방지 */
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <RoomSceneTopBar
            onBack={handleBackButtonClick}
            productDetail={productDetail}
            isProductDetailPanelMobileLayout={isProductDetailPanelMobileLayout}
            onPrevProduct={() => navigateProductDetailAdjacent(true)}
            onNextProduct={() => navigateProductDetailAdjacent(false)}
            productDetailNavBtnStyle={productDetailNavBtnStyle}
            onOpenProduct3dView={openProductGlbViewer}
          />
        </div>
      ) : null}

      <ProductGlbViewerModal
        open={productGlbViewerOpen}
        glbUrl={productGlbUrl}
        productTitle={
          productDetail != null
            ? PRODUCT_DETAIL_LIST[productDetail.index]?.title ?? null
            : null
        }
        preloadGlbUrls={productGlbViewerOpen ? PRODUCT_GLB_URLS : null}
        onClose={closeProductGlbViewer}
        {...(PRODUCT_DETAIL_LIST.length > 1
          ? {
              onPrevGlb: () => navigateProductDetailAdjacent(true),
              onNextGlb: () => navigateProductDetailAdjacent(false),
              canPrevGlb: productDetail != null && productDetail.index > 0,
              canNextGlb:
                productDetail != null &&
                productDetail.index < PRODUCT_DETAIL_LIST.length - 1,
            }
          : {})}
      />
    </div>
  )
}),
)

RoomSceneInner.displayName = 'RoomScene'

/**
 * 룸(/room/*) 전용 A11y 컨텍스트 — 다크 스킴 고정(OS prefers-color-scheme 무시).
 * 리듀스드 모션만 미디어쿼리와 동기화.
 */
const RoomScene = forwardRef(function RoomScene(props, ref) {
  const [a11yPrefersState, setA11yPrefersState] = useState({
    prefersReducedMotion: false,
    prefersDarkScheme: true,
  })

  const setRoomA11yPrefersState = useCallback((update) => {
    setA11yPrefersState((prev) => {
      const next = typeof update === 'function' ? update(prev) : { ...prev, ...update }
      return { ...next, prefersDarkScheme: true }
    })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setA11yPrefersState((prev) => ({
        ...prev,
        prefersReducedMotion: mq.matches,
        prefersDarkScheme: true,
      }))
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <A11yUserPreferencesContext.Provider
      value={{ a11yPrefersState, setA11yPrefersState: setRoomA11yPrefersState }}
    >
      <RoomSceneInner {...props} ref={ref} />
    </A11yUserPreferencesContext.Provider>
  )
})

RoomScene.displayName = 'RoomScene'

export default RoomScene
