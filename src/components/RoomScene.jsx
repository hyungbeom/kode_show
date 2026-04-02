import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls, Environment, Sky as SkyImpl, Outlines, useGLTF, Lightformer, Grid } from '@react-three/drei'
import {
  A11yAnnouncer,
  A11yUserPreferences,
  useUserPreferences,
} from '@react-three/a11y'
import {
  Suspense,
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  memo,
  createContext,
  useContext,
  useCallback,
  useMemo,
} from 'react'
import { Box } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import * as THREE from 'three'
import {
  maintainTransparentSceneBackground,
  syncTransparentWebGLCanvas,
} from '../utils/syncTransparentWebGLCanvas'
import {
  computeCarouselRoomCameraSettings,
  getCarouselOrbitTargetY,
} from '../utils/roomCarouselLayout'
import ObjectInfoPanel from './ObjectInfoPanel'
import ObjectViewer from './ObjectViewer'
import ObjectDetailButton from './ObjectDetailButton'
import ProductCarousel from './ProductCarousel'
import ProductDetailPanel from './ProductDetailPanel'
import RoomDetailLanding from './RoomDetailLanding'
import RoomCarouselIntro from './RoomCarouselIntro'
import { PRODUCT_DETAIL_LIST } from '../data/productDetailCopy'
import { useBrowserWidthPx } from '../hooks/useBrowserWidthPx'

/** ProductDetailPanel.css 바텀시트 브레이크포인트와 동일 */
const PRODUCT_DETAIL_PANEL_MOBILE_MAX_PX = 767

const PRODUCT_DETAIL_NAV_ARROW_SVG = 34

/** `false`면 show_room2 부스 + 박스 전시물 비표시 — 제품 캐러셀만 사용 */
const SHOW_LEGACY_BOOTH_AND_EXHIBITS = false

/**
 * 방 씬 컴포넌트
 * 업체 클릭 시 표시되는 3D 방
 *
 * @react-three/a11y: A11yUserPreferences + A11yAnnouncer (다크 모드는 우측 상단 스위치).
 * 주의: 라이브러리의 <A11y>/<A11ySection> 은 내부 Html(createRoot)가 React 18/19 Strict Mode에서
 * 언마운트 후 render를 호출해 크래시가 납니다. 전시 오브젝트는 HoverableObject만 쓰고,
 * 구역 안내는 Canvas 밖 스크린리더 전용 div로 제공합니다.
 */
const RoomSceneInner = memo(function RoomSceneInner({ companyId, onBack }) {
  const roomSceneRootRef = useRef(null)
  const scrollRootRef = useRef(null)
  const fixedLayerRef = useRef(null)
  /** 제품 콜아웃 DOM — body가 아니라 고정 레이어에 두어 스크롤 랜딩(z-index 1)보다 아래에 쌓임 */
  const annotationPortalHostRef = useRef(null)
  const resetCameraRef = useRef(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [showModal, setShowModal] = useState(false)
  /** 제품 GLB 클릭 시 오른쪽 패널 + 캐러셀 상세 동기화 */
  const [productDetail, setProductDetail] = useState(null)
  /** /room/1 캐러셀 인트로 — EXPLORER 클릭 시 닫음 */
  const [carouselIntroDismissed, setCarouselIntroDismissed] = useState(false)
  const { a11yPrefersState } = useUserPreferences()
  const prefersDark = a11yPrefersState.prefersDarkScheme
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
    () =>
      prefersDark
        ? 'linear-gradient(to bottom, #0d1117 0%, #161b22 35%, #21262d 70%, #30363d 100%)'
        : 'linear-gradient(to bottom, #CCFFCC 0%, #B8E6CC 20%, #87CEEB 45%, #5F9EA0 70%, #4682B4 100%)',
    [prefersDark]
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

  /** 전체보기: 제품 확대/정보창·레거시 객체 패널·모달 해제 후 카메라 초기화 → 캐러셀 전체 뷰 */
  const handleViewAll = useCallback(() => {
    setProductDetail(null)
    setSelectedObject(null)
    setShowModal(false)
    resetCameraRef.current?.()
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

  const showCarouselIntro =
    companyId === 1 && !productDetail && !carouselIntroDismissed

  /** 제품 상세 스크롤 시: 첫 뷰포트 구간에서 캔버스 → 검은색으로 어둡게 */
  const [canvasDarken, setCanvasDarken] = useState(0)
  const updateCanvasDarkenFromScroll = useCallback(() => {
    const root = scrollRootRef.current
    if (!root) return
    const range = Math.max(1, typeof window !== 'undefined' ? window.innerHeight : 800)
    setCanvasDarken(Math.min(1, root.scrollTop / range))
  }, [])

  useEffect(() => {
    if (!detailPageScroll) {
      setCanvasDarken(0)
      return
    }
    const root = scrollRootRef.current
    updateCanvasDarkenFromScroll()
    root?.addEventListener('scroll', updateCanvasDarkenFromScroll, { passive: true })
    return () => root?.removeEventListener('scroll', updateCanvasDarkenFromScroll)
  }, [detailPageScroll, updateCanvasDarkenFromScroll])

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

  /** 제품 상세: 휠·터치 스와이프를 스크롤 루트로 전달 (모바일은 캔버스/고정 레이어가 터치를 가져가 기본 스크롤이 안 됨) */
  useEffect(() => {
    if (!detailPageScroll) return
    const fixed = fixedLayerRef.current
    const root = scrollRootRef.current
    if (!fixed || !root) return

    const onWheel = (e) => {
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

    root.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    root.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    root.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
    root.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true })

    return () => {
      fixed.removeEventListener('wheel', onWheel, capTrue)
      fixed.removeEventListener('touchstart', onTouchStart, capTrue)
      fixed.removeEventListener('touchmove', onTouchMove, capTrue)
      fixed.removeEventListener('touchend', onTouchEnd, capTrue)
      fixed.removeEventListener('touchcancel', onTouchEnd, capTrue)
      root.removeEventListener('touchstart', onTouchStart, capTrue)
      root.removeEventListener('touchmove', onTouchMove, capTrue)
      root.removeEventListener('touchend', onTouchEnd, capTrue)
      root.removeEventListener('touchcancel', onTouchEnd, capTrue)
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
      }}
    >
      {/* 3D·UI는 뷰포트에 고정 — 제품 상세 스크롤 시에도 화면에서 움직이지 않음 */}
      <div
        ref={fixedLayerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: sceneBackgroundGradient,
        }}
      >
      {/* < BACK — 상세 시 캐러셀만, 캐러셀 시 월드(맵) 루트 */}
      <button
        type="button"
        onClick={handleBackButtonClick}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        {'< BACK'}
      </button>

      {showCarouselIntro ? (
        <RoomCarouselIntro onExplore={() => setCarouselIntroDismissed(true)} />
      ) : null}

      {productDetail ? (
        <>
          <button
            type="button"
            aria-label="이전 제품 상세"
            disabled={productDetail.index <= 0}
            onClick={() => navigateProductDetailAdjacent(true)}
            style={{
              position: 'absolute',
              left: 16,
              ...(isProductDetailPanelMobileLayout
                ? { top: '40%', transform: 'translateY(-50%)' }
                : { top: '50%', transform: 'translateY(-50%)' }),
              zIndex: 1150,
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
            onClick={() => navigateProductDetailAdjacent(false)}
            style={{
              position: 'absolute',
              ...(isProductDetailPanelMobileLayout
                ? { top: '40%', transform: 'translateY(-50%)' }
                : { top: '50%', transform: 'translateY(-50%)' }),
              zIndex: 1150,
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

      <RoomDarkModeSwitch />

      {/* 캔버스보다 먼저 두어 ref가 ProductAnnotationCallouts 마운트 시 채워지게 */}
      <div
        ref={annotationPortalHostRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />

      <div
        role="region"
        aria-label="전시 부스 3D 뷰"
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
        3D 전시 공간입니다. 마우스로 전시 물체를 클릭하면 카메라가 이동하고 정보를 볼 수 있습니다. 왼쪽
        아래 패널에서 다크 모드·모션 감소 선호를 바꿀 수 있습니다.
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
        }}
      >
      <Canvas
        shadows
        style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        dpr={[1, 2]}
        onCreated={({ gl, scene }) => {
          syncTransparentWebGLCanvas(gl, scene)
        }}
      >
          <CameraControlProvider resetCameraRef={resetCameraRef}>
            <Suspense fallback={null}>
                {/* 배경을 투명하게 설정하여 div의 그라데이션이 보이도록 */}
                <BackgroundKeeper />
            
            {/* 카메라 설정 - PerspectiveCamera로 원근감 있는 아이소메트릭 뷰 */}
            <CameraSetup />
            
            {/* 조명 - 그림자가 잘 보이도록 강화 (선호 다크 모드 시 환경·환경광 적응) */}
          <AdaptiveEnvironment>
            <Lightformer
              form="rect"
              intensity={1}
              color="white"
              scale={[10, 5]}
              target={[0, 0, 0]}
            />
          </AdaptiveEnvironment>
          
          {/* 바닥 그리드 — 촘촘한 셀 + 굵은 선은 sectionSize 간격 */}
          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            infiniteGrid
            cellSize={0.45}
            cellThickness={0.65}
            cellColor="#c8ccd8"
            sectionSize={2.25}
            sectionThickness={1.25}
            sectionColor="#9ca8bc"
            fadeDistance={48}
            fadeStrength={0.85}
          />
          
          <AdaptiveAmbient />
          
          {/* 메인 태양광 (사선으로 비추는 빛) - 그림자 생성 */}
          <directionalLight
            position={[15, 12, 10]}
            intensity={2.5}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-bias={-0.0005}
          />
          
          {/* 보조 태양광 (반대편 사선에서) - 그림자 없이 채우기용 */}
          <directionalLight
            position={[-10, 10, -8]}
            intensity={0.8}
            color="#FFE5B4"
          />
          
          {/* 포인트 라이트 1 - 따뜻한 빛 */}
          <pointLight
            position={[-5, 8, -5]}
            intensity={1.5}
            color="#FFE5B4"
            distance={30}
            decay={1.5}
            castShadow
          />
          
          {/* 포인트 라이트 2 - 차가운 빛 */}
          <pointLight
            position={[5, 8, 5]}
            intensity={1.2}
            color="#B8E6FF"
            distance={30}
            decay={1.5}
          />
          
          {/* 포인트 라이트 3 - 중앙 위쪽 */}
          <pointLight
            position={[0, 10, 0]}
            intensity={1.8}
            color="#FFFFFF"
            distance={40}
            decay={1.5}
            castShadow
          />
          
          {/* 스팟 라이트 - 특정 영역 강조 */}
          <spotLight
            position={[0, 15, 0]}
            angle={0.4}
            penumbra={0.3}
            intensity={2.0}
            castShadow
            color="#FFFFFF"
            distance={40}
            decay={1.5}
          />
          
                {/* 방 구조 (부스·전시 박스) — SHOW_LEGACY_BOOTH_AND_EXHIBITS 가 true 일 때만 */}
                <RoomContent
                  onObjectClick={handleRoomObjectClick}
                  skipCameraAnimation={false}
                />

                {/* 제품 GLB 캐러셀 (public/product/product1~5.glb) — 좌우 다이아몬드로 회전 */}
                <Suspense fallback={null}>
                  <ProductCarousel
                    position={[0, 4, 0]}
                    showLightToggle={false}
                    openDetailIndex={productDetail?.index ?? null}
                    onProductSelect={setProductDetail}
                    scrollDarken={canvasDarken}
                    annotationPortalHostRef={annotationPortalHostRef}
                  />
                </Suspense>

                {/* 오빗 컨트롤 */}
                <OrbitControlsWrapper />
            </Suspense>
          </CameraControlProvider>
      </Canvas>

      <A11yAnnouncer />

      {/* 제품 상세 정보창 — 확대 모드: 고정 레이어 오른쪽 (embedded) */}
      <ProductDetailPanel
        product={productDetail}
        onClose={() => setProductDetail(null)}
        embedded={detailPageScroll}
      />
      </div>

      {/* 객체 정보 패널 (오른쪽) - 객체 클릭 시 바로 표시, 모달·제품 상세 열리면 숨김 */}
      {!showModal && !productDetail && (
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

      {/* 제품 상세 스크롤 시: 고정 레이어 전체(캔버스·HUD·버튼·패널 등) 동일 비율로 어둡게 — pointer-events 없음 */}
      {detailPageScroll ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10040,
            pointerEvents: 'none',
            background: '#000',
            opacity: canvasDarken,
          }}
        />
      ) : null}
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
          </div>
          <div style={{ pointerEvents: 'auto', position: 'relative' }}>
            <RoomDetailLanding product={productDetail} />
          </div>
        </div>
      ) : null}
    </div>
  )
})

RoomSceneInner.displayName = 'RoomScene'

/** 공식 데모와 같이 Provider 를 Canvas 상위에 둠 → Announcer·선호도 HUD·씬이 동일 컨텍스트 */
function RoomScene(props) {
  return (
    <A11yUserPreferences>
      <RoomSceneInner {...props} />
    </A11yUserPreferences>
  )
}

export default RoomScene

/** prefers-color-scheme / 수동 토글에 맞춰 Environment 프리셋 전환 */
function AdaptiveEnvironment({ children }) {
  const { a11yPrefersState } = useUserPreferences()
  const dark = a11yPrefersState.prefersDarkScheme
  return (
    <Environment preset={dark ? 'night' : 'sunset'} key={dark ? 'env-night' : 'env-sunset'}>
      {children}
    </Environment>
  )
}

function AdaptiveAmbient() {
  const { a11yPrefersState } = useUserPreferences()
  const dark = a11yPrefersState.prefersDarkScheme
  return <ambientLight intensity={dark ? 0.12 : 0.3} />
}

/** 룸 우측 상단 — A11y 컨텍스트의 다크 모드만 전환 (모션 감소 등은 시스템/기본값 유지) */
function RoomDarkModeSwitch() {
  const { a11yPrefersState, setA11yPrefersState } = useUserPreferences()
  const dark = a11yPrefersState.prefersDarkScheme
  const reducedMotion = a11yPrefersState.prefersReducedMotion

  const toggle = useCallback(() => {
    setA11yPrefersState({
      prefersDarkScheme: !dark,
      prefersReducedMotion: reducedMotion,
    })
  }, [dark, reducedMotion, setA11yPrefersState])

  const motion = !reducedMotion

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px 6px 14px',
        borderRadius: 999,
        background: dark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.9)',
        border: dark ? '1px solid rgba(148, 163, 184, 0.35)' : '1px solid rgba(15, 23, 42, 0.12)',
        boxShadow: dark ? '0 6px 24px rgba(0,0,0,0.35)' : '0 6px 20px rgba(15,23,42,0.12)',
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: dark ? '#e2e8f0' : '#0f172a',
          userSelect: 'none',
        }}
      >
        다크 모드
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label={dark ? '다크 모드 끄기' : '다크 모드 켜기'}
        onClick={toggle}
        style={{
          position: 'relative',
          width: 48,
          height: 28,
          borderRadius: 999,
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          background: dark ? 'rgba(56, 189, 248, 0.95)' : 'rgba(148, 163, 184, 0.55)',
          flexShrink: 0,
          transition: motion ? 'background 0.2s ease' : 'none',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 3,
            left: dark ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.28)',
            transition: motion ? 'left 0.2s ease' : 'none',
          }}
        />
      </button>
    </div>
  )
}

/**
 * 배경을 투명하게 유지하는 컴포넌트
 */
function BackgroundKeeper() {
  const { scene, gl } = useThree()

  useEffect(() => {
    syncTransparentWebGLCanvas(gl, scene)
  }, [scene, gl])

  useFrame(() => {
    maintainTransparentSceneBackground(gl, scene)
  })

  return null
}

/**
 * 카메라 설정 컴포넌트
 * 캐러셀 룸: X=0 정면(+Z)에서 타겟을 보면 링·그리드가 화면 기준 좌우 대칭에 가깝다.
 * (대각선 (x,z)=(d,d) 배치는 시야가 돌아간 듯 보이고 그리드 소실점이 한쪽으로 쏠린다.)
 */
/**
 * 카메라 설정 컴포넌트 (메모이제이션됨)
 * 초기 마운트 시에만 카메라를 설정하고, 이후에는 카메라 위치를 변경하지 않음
 */
const CameraSetup = memo(function CameraSetup() {
  const { camera, size, gl } = useThree()
  const isInitializedRef = useRef(false)
  const initialSizeRef = useRef(null)
  
  const calculateCameraSettings = (currentSize) => {
    const targetSize = currentSize || size
    const w = targetSize?.width ?? 0
    const h = targetSize?.height ?? 0
    return computeCarouselRoomCameraSettings(w, h)
  }
  
  // 초기 카메라 설정만 수행 (한 번만 실행)
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera && !isInitializedRef.current && size.width > 0 && size.height > 0) {
      const settings = calculateCameraSettings(size)
      if (settings) {
        camera.position.set(...settings.position)
        camera.lookAt(...settings.lookAt)
        camera.fov = settings.fov
        camera.aspect = size.width / size.height
        camera.near = 0.1
        camera.far = 500000
        camera.updateProjectionMatrix()
        isInitializedRef.current = true
        initialSizeRef.current = { width: size.width, height: size.height }
      }
    }
  }, [camera, size])
  
  // 화면 크기 변경 시에만 aspect 업데이트 (위치는 유지)
  useEffect(() => {
    if (!isInitializedRef.current) return
    
    const handleResize = () => {
      if (camera instanceof THREE.PerspectiveCamera && gl.domElement) {
        // 화면 크기 변경 시에는 aspect만 업데이트 (카메라 위치는 유지)
        camera.aspect = gl.domElement.width / gl.domElement.height
        camera.updateProjectionMatrix()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [camera, gl])
  
  // 초기 카메라 설정
  const initialSettings = calculateCameraSettings(size)
  
  return (
    <PerspectiveCamera
      makeDefault
      position={initialSettings.position}
      fov={initialSettings.fov}
      near={0.1}
      far={500000}
    />
  )
})

// 카메라 컨트롤 컨텍스트
const CameraControlContext = createContext(null)

// OrbitControls 래퍼 컴포넌트 (ref를 Context에 전달) - 메모이제이션
// 마우스로 직접 카메라 조작 비활성화 (객체 클릭 시에만 카메라 이동)
const OrbitControlsWrapper = memo(function OrbitControlsWrapper() {
  const { controlsRef } = useContext(CameraControlContext) || {}
  const { size, camera } = useThree()
  const { a11yPrefersState } = useUserPreferences()
  const reduceMotion = a11yPrefersState.prefersReducedMotion
  const targetY = getCarouselOrbitTargetY(size.width || 0)

  useEffect(() => {
    const ctrl = controlsRef?.current
    if (!ctrl) return
    ctrl.target.set(0, targetY, 0)
    ctrl.update()
    if (camera && 'updateProjectionMatrix' in camera) {
      camera.updateProjectionMatrix()
    }
  }, [controlsRef, targetY, camera])

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableRotate={false}
      enableZoom={false}
      target={[0, targetY, 0]}
      minDistance={5}
      maxDistance={50}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      enableDamping={!reduceMotion}
      dampingFactor={reduceMotion ? 1 : 0.05}
    />
  )
})

// Context Provider 컴포넌트
function CameraControlProvider({ children, resetCameraRef }) {
  const { camera, size } = useThree()
  const controlsRef = useRef(null)
  const moveToTargetRef = useRef(null)
  
  const resetCameraToInitial = useCallback(() => {
    if (!camera || !(camera instanceof THREE.PerspectiveCamera)) return
    if (!controlsRef?.current) return
    
    // 기존 애니메이션 취소
    if (moveToTargetRef.current) {
      moveToTargetRef.current.kill()
    }
    
    const controls = controlsRef.current
    
    const calculateInitialSettings = () =>
      computeCarouselRoomCameraSettings(size.width || 0, size.height || 0)
    
    const initialSettings = calculateInitialSettings()
    const initialPosition = new THREE.Vector3(...initialSettings.position)
    const initialTarget = new THREE.Vector3(...initialSettings.lookAt)
    
    // GSAP 애니메이션
    moveToTargetRef.current = gsap.timeline({
      onComplete: () => {
        moveToTargetRef.current = null
      },
    })
      .to(camera.position, {
        x: initialPosition.x,
        y: initialPosition.y,
        z: initialPosition.z,
        duration: 1.2,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: initialTarget.x,
          y: initialTarget.y,
          z: initialTarget.z,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            controls.update()
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
      .to(
        camera,
        {
          fov: initialSettings.fov,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
  }, [camera, controlsRef, size])
  
  const moveCameraToTarget = (targetPosition, skipAnimation = false) => {
    if (!camera || !(camera instanceof THREE.PerspectiveCamera)) return
    if (!controlsRef?.current) return
    
    // 기존 애니메이션 취소
    if (moveToTargetRef.current) {
      moveToTargetRef.current.kill()
    }
    
    const controls = controlsRef.current
    
    // 정면 뷰: 타겟 대비 카메라 오프셋(X≈0)을 유지해 제품 줌인 시에도 좌우 대칭 유지
    const currentPosition = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    )
    
    const currentTarget = new THREE.Vector3(
      controls.target.x,
      controls.target.y,
      controls.target.z
    )
    
    const currentOffset = new THREE.Vector3().subVectors(currentPosition, currentTarget)
    
    let offsetToUse = currentOffset
    if (currentOffset.length() < 0.1) {
      const defaultDistance = 15
      const defaultHeight = 0.5
      offsetToUse = new THREE.Vector3(0, defaultHeight, defaultDistance * 0.7 * Math.SQRT2)
    }
    
    // 아이소메트릭 각도 비율 유지하면서 거리만 조정 (줌인)
    const zoomRatio = 0.4 // 40% 거리로 줌인
    const newOffset = offsetToUse.clone().multiplyScalar(zoomRatio)
    
    // 새로운 카메라 위치: 객체 위치 + 조정된 오프셋
    const newPosition = new THREE.Vector3(...targetPosition).add(newOffset)
    
    // OrbitControls의 target을 객체 위치로 설정 (센터로 오게)
    const targetControlsTarget = {
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2],
    }
    
    // 애니메이션 스킵 옵션이 있으면 즉시 이동
    if (skipAnimation) {
      camera.position.set(newPosition.x, newPosition.y, newPosition.z)
      controls.target.set(targetControlsTarget.x, targetControlsTarget.y, targetControlsTarget.z)
      controls.update()
      camera.updateProjectionMatrix()
      return
    }
    
    // GSAP 애니메이션
    moveToTargetRef.current = gsap.timeline({
      onComplete: () => {
        moveToTargetRef.current = null
      },
    })
      .to(camera.position, {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
        duration: 1.2,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: targetControlsTarget.x,
          y: targetControlsTarget.y,
          z: targetControlsTarget.z,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            controls.update()
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
  }
  
  // resetCameraRef에 함수 할당
  useEffect(() => {
    if (resetCameraRef) {
      resetCameraRef.current = resetCameraToInitial
    }
    return () => {
      if (resetCameraRef) {
        resetCameraRef.current = null
      }
    }
  }, [resetCameraRef, resetCameraToInitial])
  
  return (
    <CameraControlContext.Provider value={{ moveCameraToTarget, controlsRef, resetCameraToInitial }}>
      {children}
    </CameraControlContext.Provider>
  )
}

/**
 * 호버 가능한 Box 컴포넌트 (outline 효과 포함)
 */
const HoverableBox = memo(function HoverableBox({ args, position, color, opacity, transparent, children, objectId, onObjectClick, skipCameraAnimation, ...props }) {
  const [hovered, setHovered] = useState(false)
  const { moveCameraToTarget, controlsRef } = useContext(CameraControlContext) || {}
  
  const handleClick = (e) => {
    e.stopPropagation()
    if (moveCameraToTarget && position) {
      // 객체의 중심 위치 계산 (Box의 position이 중심이므로 그대로 사용)
      const objectCenter = Array.isArray(position) ? position : [position.x || 0, position.y || 0, position.z || 0]
      moveCameraToTarget(objectCenter, skipCameraAnimation)
    }
    // 객체 정보 패널 표시
    if (onObjectClick && objectId) {
      onObjectClick(objectId)
    }
  }
  
  return (
    <Box 
      args={args} 
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
      {...props}
    >
      <meshStandardMaterial color={color} opacity={opacity} transparent={transparent} />
      {hovered && (
        <Outlines 
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
      {children}
    </Box>
  )
})

/**
 * 개별 메시 컴포넌트 (outline 효과 포함)
 */
const MeshWithOutline = memo(function MeshWithOutline({ mesh, isHovered, onPointerEnter, onPointerLeave, onClick }) {
  const meshRef = useRef()
  
  useEffect(() => {
    if (!meshRef.current) return
    
    const currentMesh = meshRef.current
    
    // 이벤트 리스너 추가
    currentMesh.addEventListener('pointerenter', onPointerEnter)
    currentMesh.addEventListener('pointerleave', onPointerLeave)
    currentMesh.addEventListener('click', onClick)
    
    return () => {
      currentMesh.removeEventListener('pointerenter', onPointerEnter)
      currentMesh.removeEventListener('pointerleave', onPointerLeave)
      currentMesh.removeEventListener('click', onClick)
    }
  }, [onPointerEnter, onPointerLeave, onClick])
  
  // 메시의 위치, 회전, 스케일을 부모로부터 가져옴
  const position = useMemo(() => {
    const pos = new THREE.Vector3()
    mesh.getWorldPosition(pos)
    return [pos.x, pos.y, pos.z]
  }, [mesh])
  
  const rotation = useMemo(() => {
    const quat = new THREE.Quaternion()
    mesh.getWorldQuaternion(quat)
    const euler = new THREE.Euler().setFromQuaternion(quat)
    return [euler.x, euler.y, euler.z]
  }, [mesh])
  
  const scale = useMemo(() => {
    const scl = new THREE.Vector3()
    mesh.getWorldScale(scl)
    return [scl.x, scl.y, scl.z]
  }, [mesh])
  
  return (
    <mesh
      ref={meshRef}
      geometry={mesh.geometry}
      material={mesh.material}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    >
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </mesh>
  )
})

/**
 * 호버 가능한 3D 객체 컴포넌트 (outline 효과 포함)
 */
const HoverableObject = memo(function HoverableObject({
  position,
  rotation,
  scale,
  renderFunction,
  isHovered,
  onPointerEnter,
  onPointerLeave,
  onClick,
}) {
  const groupRef = useRef()
  const highlight = isHovered

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {renderFunction(highlight)}
    </group>
  )
})

/**
 * 3D 객체 렌더링 함수들 (isHovered prop 추가)
 */
const renderDesk = (isHovered = false) => (
  <group position={[0, 0.05, 0]}>
    <Box args={[3, 0.1, 1.5]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="white" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[3, 0.1, 0.05]} position={[0, -0.05, 0.2]} castShadow receiveShadow>
      <meshStandardMaterial color="#E8D5B7" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderMonitor = (isHovered = false) => (
  <Box args={[0.8, 0.6, 0.1]} position={[0, 0.3, 0]} castShadow receiveShadow>
    <meshStandardMaterial color="#2C2C2C" />
    {isHovered && (
      <Outlines
        thickness={10}
        color="white"
        screenspace={false}
        opacity={1}
        transparent={false}
      />
    )}
  </Box>
)

const renderArcade = (isHovered = false) => (
  <group position={[0, 1, 0]}>
    <Box args={[1, 2, 0.8]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FF8C42" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[1.2, 0.3, 0.9]} position={[0, 1.15, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FF8C42" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.3, 0.3, 0.3]} position={[-0.3, 0.5, 0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#4ECDC4" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderChair = (isHovered = false) => (
  <group position={[0, 0.5, 0]}>
    <Box args={[0.6, 1, 0.6]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FF8C42" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.6, 0.1, 0.6]} position={[0, 0.55, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="white" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderBookshelf = (isHovered = false) => (
  <group position={[0, 1.5, 0]}>
    <Box args={[0.8, 2, 0.4]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.8, 0.05, 0.4]} position={[0, 0.6, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#654321" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.8, 0.05, 0.4]} position={[0, -0.6, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#654321" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderLamp = (isHovered = false) => (
  <group position={[0, 0.8, 0]}>
    <Box args={[0.1, 0.8, 0.1]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#2C2C2C" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.4, 0.1, 0.4]} position={[0, 0.45, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FFD700" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderTable = (isHovered = false) => (
  <group position={[0, 0.4, 0]}>
    <Box args={[1.5, 0.1, 1]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#D2691E" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[-0.7, -0.25, -0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[0.7, -0.25, -0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[-0.7, -0.25, 0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[0.7, -0.25, 0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderShelf = (isHovered = false) => (
  <group position={[0, 1, 0]}>
    <Box args={[1.2, 0.05, 0.5]} position={[0, 0.5, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#A0522D" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[1.2, 0.05, 0.5]} position={[0, -0.5, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#A0522D" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 1, 0.5]} position={[-0.575, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 1, 0.5]} position={[0.575, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

/** Html(createRoot) 없이 호버·클릭만 처리 (라이브러리 A11y 래퍼는 Strict Mode에서 크래시 유발) */
const AccessibleExhibitObject = memo(function AccessibleExhibitObject({ objectId: _id, ...rest }) {
  return <HoverableObject {...rest} />
})
AccessibleExhibitObject.displayName = 'AccessibleExhibitObject'

/**
 * GLB 모델 로더 컴포넌트
 * hover 시 아웃라인, 클릭 시 줌인 및 모달 표시
 */
const ShowRoomModel = memo(function ShowRoomModel({ onObjectClick }) {
  const [hoveredMeshUuid, setHoveredMeshUuid] = useState(null)
  const [hoveredObjectId, setHoveredObjectId] = useState(null)
  const { moveCameraToTarget } = useContext(CameraControlContext) || {}
  const meshesRef = useRef([])
  
  // useGLTF Hook은 항상 같은 순서로 호출되어야 합니다 (Hook 규칙 준수)
  // useGLTF는 Suspense를 사용하므로 로딩 중일 때 컴포넌트가 일시 중단될 수 있습니다
  // 하지만 모든 Hook은 일시 중단 전에 호출되어야 합니다
  // useGLTF가 로딩 중이면 Promise를 던져 Suspense가 처리하므로, 여기서는 항상 scene이 있습니다
  const { scene: roomScene } = useGLTF('/models/show_room2.glb')
  
  // 모델을 복제하여 사용 (원본을 수정하지 않도록)
  const clonedScene = useMemo(() => {
    if (!roomScene) {
      console.warn('방 모델이 로드되지 않았습니다.')
      return null
    }
      
    console.log('GLB 모델 로드 성공:', { room: roomScene })
    
    // 부스 모델 복제
    const roomClone = roomScene.clone(true) // 깊은 복사로 매터리얼/텍스처도 복사
    
    // 부스 모델의 바운딩 박스 계산
    const roomBox = new THREE.Box3().setFromObject(roomClone)
    const roomCenter = roomBox.getCenter(new THREE.Vector3())
    const roomSize = roomBox.getSize(new THREE.Vector3())
    
    console.log('부스 모델 바운딩 박스:', { center: roomCenter, size: roomSize })
    
    // 부스 모델을 원점으로 이동
    roomClone.position.sub(roomCenter)
    
    // 부스 모델을 위로 올림
    roomClone.position.y += 2
    
    // 부스 모델 스케일 설정
    roomClone.scale.setScalar(1.5)
    
    console.log('부스 모델 위치/스케일 적용 완료:', { 
      position: roomClone.position, 
      scale: roomClone.scale 
    })
    
    // 모든 메시 추출 및 원본 메시 숨기기
    meshesRef.current = []
    roomClone.traverse((child) => {
      if (child.isMesh) {
        meshesRef.current.push(child)
        // 원본 메시는 숨김 (개별 메시로 렌더링할 예정)
        child.visible = false
        // 그림자 속성 추가
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    return roomClone
  }, [roomScene])
  
  // 호버 이벤트 핸들러 (GLB 메시용)
  const handlePointerEnter = useCallback((e) => {
    e.stopPropagation()
    if (e.object && e.object.isMesh) {
      setHoveredMeshUuid(e.object.uuid)
      // 마우스 커서 변경
      document.body.style.cursor = 'pointer'
    }
  }, [])
  
  const handlePointerLeave = useCallback((e) => {
    if (e.object && e.object.isMesh) {
      setHoveredMeshUuid(null)
      document.body.style.cursor = 'default'
    }
  }, [])
  
  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (e.object && e.object.isMesh) {
      // 클릭한 메시의 월드 위치 계산
      const worldPosition = new THREE.Vector3()
      e.object.getWorldPosition(worldPosition)
      
      console.log('메시 클릭:', { 
        meshName: e.object.name,
        worldPosition: worldPosition 
      })
      
      // 카메라 줌인
      if (moveCameraToTarget) {
        moveCameraToTarget([worldPosition.x, worldPosition.y, worldPosition.z], false)
      }
      
      // 정보 모달 표시
      if (onObjectClick) {
        // 메시 이름을 기반으로 objectId 결정
        const meshName = e.object.name?.toLowerCase() || 'unknown'
        let objectId = 'desk' // 기본값
        
        if (meshName.includes('desk') || meshName.includes('table')) {
          objectId = 'desk'
        } else if (meshName.includes('monitor') || meshName.includes('screen') || meshName.includes('tv')) {
          objectId = 'monitor'
        } else if (meshName.includes('arcade') || meshName.includes('game')) {
          objectId = 'arcade'
        } else if (meshName.includes('chair') || meshName.includes('seat')) {
          objectId = 'chair'
        }
        
        onObjectClick(objectId)
      }
    }
  }, [moveCameraToTarget, onObjectClick])
  
  // 3D 객체용 호버/클릭 핸들러
  const handleObjectPointerEnter = useCallback((objectId) => (e) => {
    e.stopPropagation()
    setHoveredObjectId(objectId)
    document.body.style.cursor = 'pointer'
  }, [])
  
  const handleObjectPointerLeave = useCallback((objectId) => (e) => {
    e.stopPropagation()
    setHoveredObjectId(null)
    document.body.style.cursor = 'default'
  }, [])
  
  const handleObjectClick = useCallback((objectId, position) => (e) => {
    e.stopPropagation()
    
    console.log('3D 객체 클릭:', { objectId, position })
    
    // 카메라 줌인
    if (moveCameraToTarget && position) {
      moveCameraToTarget(position, false)
    }
    
    // 정보 모달 표시
    if (onObjectClick) {
      onObjectClick(objectId)
    }
  }, [moveCameraToTarget, onObjectClick])
  
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])
  
  // 모든 Hook을 호출한 후 조건부 렌더링
  if (!clonedScene) {
    console.warn('GLB 모델 복제 실패')
    return null
  }
  
  // 메시가 없는 경우 primitive로 렌더링
  if (meshesRef.current.length === 0) {
    return <primitive object={clonedScene} />
  }
  
  // 각 메시를 개별적으로 렌더링하여 outline 효과 적용
  return (
    <>
      {/* 메시가 아닌 다른 객체들 (Group, Light 등) 렌더링 */}
      <primitive object={clonedScene} />
        {/* 각 메시를 개별적으로 렌더링하여 outline 효과 적용 */}
        {meshesRef.current.map((mesh) => (
          <MeshWithOutline
            key={mesh.uuid}
            mesh={mesh}
            isHovered={hoveredMeshUuid === mesh.uuid}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
          />
        ))}
        
        {/* 기존 3D 객체들을 부스 안에 배치 - 높이를 더 위로 올림 */}
        {/* 책상 - 중앙 앞쪽 */}
        <AccessibleExhibitObject
          objectId="desk"
          position={[0, 2.5, -2]}
          rotation={[0, 0, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderDesk}
          isHovered={hoveredObjectId === 'desk'}
          onPointerEnter={handleObjectPointerEnter('desk')}
          onPointerLeave={handleObjectPointerLeave('desk')}
          onClick={handleObjectClick('desk', [0, 3, -2])}
        />
        
        {/* 모니터 - 책상 위 */}
        <AccessibleExhibitObject
          objectId="monitor"
          position={[0, 3.3, -2]}
          rotation={[0, 0, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderMonitor}
          isHovered={hoveredObjectId === 'monitor'}
          onPointerEnter={handleObjectPointerEnter('monitor')}
          onPointerLeave={handleObjectPointerLeave('monitor')}
          onClick={handleObjectClick('monitor', [0, 3.6, -2])}
        />
        
        {/* 아케이드 기계 - 오른쪽 */}
        <AccessibleExhibitObject
          objectId="arcade"
          position={[3, 2.5, 0]}
          rotation={[0, -Math.PI / 4, 0]}
          scale={[0.6, 0.6, 0.6]}
          renderFunction={renderArcade}
          isHovered={hoveredObjectId === 'arcade'}
          onPointerEnter={handleObjectPointerEnter('arcade')}
          onPointerLeave={handleObjectPointerLeave('arcade')}
          onClick={handleObjectClick('arcade', [3, 4, 0])}
        />
        
        {/* 의자 - 책상 앞 */}
        <AccessibleExhibitObject
          objectId="chair"
          position={[0, 2.5, -4]}
          rotation={[0, 0, 0]}
          scale={[0.6, 0.6, 0.6]}
          renderFunction={renderChair}
          isHovered={hoveredObjectId === 'chair'}
          onPointerEnter={handleObjectPointerEnter('chair')}
          onPointerLeave={handleObjectPointerLeave('chair')}
          onClick={handleObjectClick('chair', [0, 3, -4])}
        />
        
        {/* 책장 - 왼쪽 벽 */}
        <AccessibleExhibitObject
          objectId="bookshelf"
          position={[-3.5, 2.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderBookshelf}
          isHovered={hoveredObjectId === 'bookshelf'}
          onPointerEnter={handleObjectPointerEnter('bookshelf')}
          onPointerLeave={handleObjectPointerLeave('bookshelf')}
          onClick={handleObjectClick('bookshelf', [-3.5, 4, 0])}
        />
        
        {/* 램프 - 책상 옆 */}
        <AccessibleExhibitObject
          objectId="lamp"
          position={[1.5, 2.5, -2]}
          rotation={[0, 0, 0]}
          scale={[0.6, 0.6, 0.6]}
          renderFunction={renderLamp}
          isHovered={hoveredObjectId === 'lamp'}
          onPointerEnter={handleObjectPointerEnter('lamp')}
          onPointerLeave={handleObjectPointerLeave('lamp')}
          onClick={handleObjectClick('lamp', [1.5, 3.3, -2])}
        />
        
        {/* 테이블 - 왼쪽 */}
        <AccessibleExhibitObject
          objectId="table"
          position={[-2, 2.5, 2]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderTable}
          isHovered={hoveredObjectId === 'table'}
          onPointerEnter={handleObjectPointerEnter('table')}
          onPointerLeave={handleObjectPointerLeave('table')}
          onClick={handleObjectClick('table', [-2, 2.9, 2])}
        />
        
        {/* 선반 - 뒤쪽 벽 */}
        <AccessibleExhibitObject
          objectId="shelf"
          position={[0, 3.5, 3]}
          rotation={[0, 0, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderShelf}
          isHovered={hoveredObjectId === 'shelf'}
          onPointerEnter={handleObjectPointerEnter('shelf')}
          onPointerLeave={handleObjectPointerLeave('shelf')}
          onClick={handleObjectClick('shelf', [0, 4.5, 3])}
        />
      </>
    )
})

ShowRoomModel.displayName = 'ShowRoomModel'

if (SHOW_LEGACY_BOOTH_AND_EXHIBITS) {
  useGLTF.preload('/models/show_room2.glb')
}

/**
 * 방 내부 컨텐츠 (메모이제이션됨)
 * show_room2.glb 모델 로드 (group 해제, car.glb 제거)
 */
const RoomContent = memo(function RoomContent({ onObjectClick, skipCameraAnimation }) {
  if (!SHOW_LEGACY_BOOTH_AND_EXHIBITS) return null
  return (
    <Suspense fallback={null}>
      <ShowRoomModel onObjectClick={onObjectClick} />
    </Suspense>
  )
})
