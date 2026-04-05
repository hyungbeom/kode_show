import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, useGLTF } from '@react-three/drei'
import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useUserPreferences } from '@react-three/a11y'
import { gsap } from 'gsap'
import { PRODUCT_DETAIL_LIST } from '../data/productDetailCopy'
import { PRODUCT_ANNOTATIONS } from '../data/productAnnotations'
import ProductAnnotationCallouts from './ProductAnnotationCallouts'
import {
  getCarouselCaptionLocalY,
  getCarouselGroupScale,
  getCarouselGroupYOffset,
  getCarouselSideNavLocalX,
  getCarouselStripNavLocalY,
  getCarouselStripSlotSpacing,
  getRoomCarouselTier,
} from '../utils/roomCarouselLayout'

/** 모바일 제품 안내: Html transform off 시 스크린 좌표로 캔버스 하단 중앙에 고정 (scale=1) */
const MOBILE_CAPTION_HEIGHT_PX = 258

const COUNT = 5
/** 일열 뷰에서 동시에 보이는 슬롯 수 */
const VISIBLE_SLOTS = 3
/** 캐러셀: 선택 vs 비선택 스케일 (비선택은 더 작게) */
const CAROUSEL_ITEM_SCALE_ACTIVE = 2.55
const CAROUSEL_ITEM_SCALE_INACTIVE = 0.68

export const PRODUCT_GLB_URLS = [
  '/product/product1.glb',
  '/product/product2.glb',
  '/product/product3.glb',
  '/product/product4.glb',
  '/product/product5.glb',
];

function normalizeToUnit(scene) {
  const clone = scene.clone(true)
  clone.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(clone)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  clone.position.sub(center)
  const s = 1.65 / maxDim
  clone.scale.setScalar(s)
  return clone
}

function CarouselProductMesh({ url, active, onPick, pickingEnabled }) {
  const { scene } = useGLTF(url)
  const root = useRef(null)
  const object = useMemo(() => normalizeToUnit(scene), [scene])
  const { a11yPrefersState } = useUserPreferences()
  const motionDisabled = a11yPrefersState.prefersReducedMotion;

  useFrame((state, delta) => {
    if (!root.current) return
    const s = active ? CAROUSEL_ITEM_SCALE_ACTIVE : CAROUSEL_ITEM_SCALE_INACTIVE
    root.current.scale.lerp(new THREE.Vector3(s, s, s), motionDisabled ? 1 : 0.1)
    if (motionDisabled) {
      root.current.rotation.y = root.current.rotation.x = active ? 1.5 : 4
      root.current.position.y = 0
    } else {
      root.current.rotation.y += delta / (active ? 1.5 : 4)
      root.current.rotation.x += delta / (active ? 1.5 : 4)
      root.current.position.y = active ? Math.sin(state.clock.elapsedTime) / 2 : 0
    }
  })

  return (
    <group
      ref={root}
      onClick={(e) => {
        e.stopPropagation()
        if (pickingEnabled) onPick()
      }}
      onPointerOver={() => {
        if (pickingEnabled) document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        document.body.style.cursor = 'default'
      }}
    >
      <primitive object={object} />
    </group>
  )
}

function CarouselStrip({ active, onPickProduct, pickingEnabled }) {
  const size = useThree((s) => s.size)
  const tier = getRoomCarouselTier(size.width)
  const slotSpacing = getCarouselStripSlotSpacing(tier)
  const windowStart = Math.max(0, Math.min(active - 1, COUNT - VISIBLE_SLOTS))

  return (
    <group name="carousel-strip">
      {Array.from({ length: VISIBLE_SLOTS }, (_, slot) => {
        const idx = windowStart + slot
        if (idx >= COUNT) return null
        const x = (slot - 1) * slotSpacing
        return (
          <group key={`strip-${idx}`} position={[x, 0, 0]}>
            <Suspense fallback={null}>
              <CarouselProductMesh
                url={PRODUCT_GLB_URLS[idx]}
                active={active === idx}
                onPick={() => onPickProduct(idx)}
                pickingEnabled={pickingEnabled}
              />
            </Suspense>
          </group>
        )
      })}
    </group>
  )
}

const CAROUSEL_NAV_ARROW_BTN = 56
const CAROUSEL_NAV_ARROW_SVG = 34

function carouselArrowBtnStyle(enabled, prefersDark, motionDisabled, fg, fgMuted) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: CAROUSEL_NAV_ARROW_BTN,
    height: CAROUSEL_NAV_ARROW_BTN,
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
    boxShadow: prefersDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 20px rgba(15,23,42,0.12)',
    transition: motionDisabled ? 'none' : 'transform 0.15s ease, background 0.15s ease',
  }
}

/** 캐러셀 좌측 / 우측 — 각각 독립 Html */
function CarouselSideArrow({
  side,
  tier,
  prefersDark,
  motionDisabled,
  enabled,
  onPress,
  ariaLabel,
}) {
  const fg = prefersDark ? '#e2e8f0' : '#0f172a'
  const fgMuted = prefersDark ? 'rgba(226, 232, 240, 0.5)' : 'rgba(15, 23, 42, 0.45)'
  const x = getCarouselSideNavLocalX(tier) * (side === 'left' ? -1 : 1)
  const y = getCarouselStripNavLocalY(tier)

  return (
    <Html
      transform
      occlude={false}
      distanceFactor={5.5}
      position={[x, y, 0.15]}
      style={{
        pointerEvents: 'auto',
        userSelect: 'none',
        width: 'auto',
      }}
      zIndexRange={[50, 0]}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (enabled) onPress()
        }}
        disabled={!enabled}
        aria-label={ariaLabel}
        style={carouselArrowBtnStyle(enabled, prefersDark, motionDisabled, fg, fgMuted)}
      >
        {side === 'left' ? (
          <svg
            width={CAROUSEL_NAV_ARROW_SVG}
            height={CAROUSEL_NAV_ARROW_SVG}
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
        ) : (
          <svg
            width={CAROUSEL_NAV_ARROW_SVG}
            height={CAROUSEL_NAV_ARROW_SVG}
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
        )}
      </button>
    </Html>
  )
}

/** 하단 — 현재 제품 제목·설명 + 도트 */
function CarouselCaptionBar({
  tier,
  active,
  prefersDark,
  motionDisabled,
  onSelectIndex,
  /** GLB 클릭과 동일하게 상세 화면 열기 */
  onOpenDetail,
}) {
  const copy = PRODUCT_DETAIL_LIST[active]
  if (!copy) return null

  const { width: canvasWidthPx } = useThree((s) => s.size)
  const bg = prefersDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.92)'
  const border = prefersDark ? '1px solid rgba(148, 163, 184, 0.35)' : '1px solid rgba(15, 23, 42, 0.12)'
  const fg = prefersDark ? '#e2e8f0' : '#0f172a'
  const fgMuted = prefersDark ? 'rgba(226, 232, 240, 0.55)' : 'rgba(15, 23, 42, 0.5)'
  const dotActive = prefersDark ? '#38bdf8' : '#0369a1'
  const y = getCarouselCaptionLocalY(tier)
  const isMobileTier = tier === 'mobile'
  /** 모바일·태블릿: 화면 가로·세로를 거의 채우고 양끝·상하에만 소량 여백 */
  const isCompactCaption = tier === 'mobile' || tier === 'tablet'
  const captionEdgeInsetPx = 24
  const captionCardHeightStyle = isCompactCaption ? `${MOBILE_CAPTION_HEIGHT_PX}px` : '246px'

  const mobileCaptionScreenPos = useCallback(
    (_el, _camera, size) => {
      const w = size.width
      const h = size.height
      const cx = w / 2
      /* center 기준: 카드 하단 = 캔버스 하단. 홈 인디케이터는 padding + env(safe-area) */
      const cy = h - MOBILE_CAPTION_HEIGHT_PX / 2
      return [cx, cy]
    },
    [],
  )

  return (
    <Html
      transform={!isMobileTier}
      occlude={false}
      center={isMobileTier}
      distanceFactor={isMobileTier ? undefined : 5.5}
      calculatePosition={isMobileTier ? mobileCaptionScreenPos : undefined}
      position={[0, y, 0.15]}
      style={{
        pointerEvents: 'auto',
        userSelect: 'none',
        width: isMobileTier
          ? `${canvasWidthPx}px`
          : isCompactCaption
            ? `calc(100vw - ${captionEdgeInsetPx}px)`
            : 'min(92vw, 520px)',
        maxWidth: isMobileTier
          ? `${canvasWidthPx}px`
          : isCompactCaption
            ? `calc(100vw - ${captionEdgeInsetPx}px)`
            : undefined,
      }}
      zIndexRange={[50, 0]}
    >
      <div
        role="region"
        aria-label="제품 안내"
        style={{
          background: bg,
          border,
          borderLeft: isMobileTier ? 'none' : undefined,
          borderRight: isMobileTier ? 'none' : undefined,
          borderBottom: isMobileTier ? 'none' : undefined,
          borderRadius: isMobileTier ? '16px 16px 0 0' : 16,
          padding: isMobileTier
            ? '12px 14px calc(14px + env(safe-area-inset-bottom, 0px))'
            : '14px 16px 12px',
          boxSizing: 'border-box',
          height: captionCardHeightStyle,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isCompactCaption ? 'flex-start' : undefined,
          boxShadow: prefersDark
            ? '0 10px 30px rgba(0,0,0,0.45)'
            : '0 10px 28px rgba(15,23,42,0.12)',
        }}
      >
        <div
          role="tablist"
          aria-label="제품 번호"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
            flexShrink: 0,
            marginBottom: isMobileTier ? 11 : 10,
          }}
        >
          {Array.from({ length: COUNT }, (_, i) => {
            const on = i === active
            const dotOn = isMobileTier ? 13 : 12
            const dotOff = isMobileTier ? 10 : 9
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={`${i + 1}번 제품`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectIndex(i)
                }}
                style={{
                  width: on ? dotOn : dotOff,
                  height: on ? dotOn : dotOff,
                  borderRadius: 999,
                  padding: 0,
                  border: on ? `2px solid ${dotActive}` : `1px solid ${fgMuted}`,
                  background: on ? dotActive : 'transparent',
                  cursor: 'pointer',
                  transform: on ? 'scale(1.12)' : 'scale(1)',
                  transition: motionDisabled ? 'none' : '0.15s ease',
                }}
              />
            )
          })}
        </div>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: isMobileTier
              ? 'clamp(1.08rem, 4.2vw, 1.36rem)'
              : 'clamp(1rem, 2.8vw, 1.2rem)',
            fontWeight: 700,
            color: fg,
            lineHeight: 1.3,
            fontFamily: 'var(--font-sans)',
            flexShrink: 0,
          }}
        >
          {copy.title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: isMobileTier ? '0.98rem' : '0.875rem',
            lineHeight: isMobileTier ? 1.65 : 1.65,
            color: fgMuted,
            fontFamily: 'var(--font-sans)',
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
          }}
        >
          {copy.description}
        </p>
        {typeof onOpenDetail === 'function' ? (
          <button
            type="button"
            aria-label={`${copy.title} 자세히 보기`}
            onClick={(e) => {
              e.stopPropagation()
              onOpenDetail()
            }}
            style={{
              flexShrink: 0,
              marginTop: isMobileTier ? 11 : 10,
              width: '100%',
              padding: isMobileTier ? '11px 14px' : '10px 16px',
              borderRadius: 12,
              border: `1px solid ${dotActive}`,
              background: prefersDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(3, 105, 161, 0.08)',
              color: dotActive,
              fontSize: isMobileTier ? '0.94rem' : '0.875rem',
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: motionDisabled ? 'none' : 'background 0.15s ease, transform 0.15s ease',
            }}
          >
            자세히 보기
          </button>
        ) : null}
      </div>
    </Html>
  )
}

const PITCH_LIMIT = Math.PI / 2 - 0.15
/** NDC 오차 저역 통과 — 트림 적분과 함께 쓰여 떨림 억제 */
const DETAIL_NDC_SMOOTH_TAU_SEC = 0.42
/** NDC 오차 → 월드 트림 적분 게인 (rad/s 스케일 느낌으로 완만하게) */
const DETAIL_FRAMING_TRIM_GAIN = 6.2

/** ProductDetailPanel.css 과 동일해야 함: min(1040px, 78vw) */
const DETAIL_PANEL_MAX_PX = 1040
const DETAIL_PANEL_VW = 0.78
/** ProductDetailPanel.css embedded 바텀시트와 맞춤 */
const DETAIL_PANEL_MOBILE_MAX_PX = 767

const _worldCenter = new THREE.Vector3()

/** 상세 뷰: 확대 등장 + 드래그 회전 + 점선 콜아웃 */
function ProductDetailStage({
  url,
  progressRef,
  prefersDark,
  productIndex,
  scrollDarken = 0,
  annotationPortalHostRef,
}) {
  const { scene } = useGLTF(url)
  const { camera, gl } = useThree()
  const root = useRef(null)
  const object = useMemo(() => normalizeToUnit(scene), [scene])
  const groupRef = useRef(null)
  const rotY = useRef(0)
  const rotX = useRef(0)
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const ndcErrSmooth = useRef({ x: 0, y: 0 })
  /** baseX/baseY에 더하는 누적 보정(매 프레임 리셋하지 않아 덜컹거림 감소) */
  const framingTrim = useRef({ x: 0, y: 0 })
  const panelPxCacheRef = useRef({ px: 520, at: 0 })
  const { a11yPrefersState } = useUserPreferences()
  const motionDisabled = a11yPrefersState.prefersReducedMotion

  const annotations = useMemo(() => {
    if (productIndex == null || productIndex < 0) return []
    return PRODUCT_ANNOTATIONS[productIndex] ?? []
  }, [productIndex])

  useEffect(() => {
    rotY.current = 0
    rotX.current = 0
    ndcErrSmooth.current.x = 0
    ndcErrSmooth.current.y = 0
    framingTrim.current.x = 0
    framingTrim.current.y = 0
    panelPxCacheRef.current.at = 0
  }, [url])

  const onPointerDown = useCallback((e) => {
    e.stopPropagation()
    dragging.current = true
    lastPointer.current = { x: e.clientX, y: e.clientY }
    document.body.style.cursor = 'grabbing'
    const sens = 0.006
    const onMove = (ev) => {
      if (!dragging.current) return
      ev.preventDefault()
      const dx = ev.clientX - lastPointer.current.x
      const dy = ev.clientY - lastPointer.current.y
      lastPointer.current = { x: ev.clientX, y: ev.clientY }
      rotY.current += dx * sens
      rotX.current = THREE.MathUtils.clamp(rotX.current + dy * sens, -PITCH_LIMIT, PITCH_LIMIT)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current || !root.current) return
    const t = progressRef.current.value
    const vw = gl.domElement.getBoundingClientRect().width
    const isMobile = vw <= DETAIL_PANEL_MOBILE_MAX_PX
    const dt = Math.min(delta, 0.05)

    const baseZ = THREE.MathUtils.lerp(0, 0.4, t)
    let baseX
    let baseY
    if (isMobile) {
      baseX = THREE.MathUtils.lerp(0.42, 0.04, Math.pow(t, 0.85))
      /* 상단·중앙 쪽으로 — 바텀시트와 겹침 줄임 */
      baseY = THREE.MathUtils.lerp(-0.62, 0.72, t)
    } else {
      baseX = THREE.MathUtils.lerp(0.55, -5.55, Math.pow(t, 0.85))
      baseY = THREE.MathUtils.lerp(-0.75, -0.22, t)
    }

    groupRef.current.position.set(
      baseX + framingTrim.current.x,
      baseY + framingTrim.current.y,
      baseZ,
    )

    const targetScale = THREE.MathUtils.lerp(
      0.08,
      isMobile ? 2.55 : 3.2,
      Math.pow(t, 0.85),
    )
    root.current.scale.setScalar(targetScale)

    /* 확대(말풍선·상세) 구간에서는 자동 회전 없음 — 사용자 드래그만 적용 */
    root.current.rotation.y = rotY.current
    root.current.rotation.x = rotX.current

    if (t > 0.04) {
      groupRef.current.getWorldPosition(_worldCenter)
      _worldCenter.project(camera)
      const smoothAlpha = 1 - Math.exp(-dt / DETAIL_NDC_SMOOTH_TAU_SEC)

      if (isMobile) {
        const targetNdcX = 0
        const targetNdcY = 0.34
        const errX = targetNdcX - _worldCenter.x
        const errY = targetNdcY - _worldCenter.y
        ndcErrSmooth.current.x = THREE.MathUtils.lerp(ndcErrSmooth.current.x, errX, smoothAlpha)
        ndcErrSmooth.current.y = THREE.MathUtils.lerp(ndcErrSmooth.current.y, errY, smoothAlpha)
        framingTrim.current.x += ndcErrSmooth.current.x * DETAIL_FRAMING_TRIM_GAIN * dt
        framingTrim.current.y += ndcErrSmooth.current.y * DETAIL_FRAMING_TRIM_GAIN * 0.92 * dt
        framingTrim.current.x = THREE.MathUtils.clamp(framingTrim.current.x, -1.25, 1.25)
        framingTrim.current.y = THREE.MathUtils.clamp(framingTrim.current.y, -1.05, 1.05)
      } else {
        const now = typeof performance !== 'undefined' ? performance.now() : 0
        if (now - panelPxCacheRef.current.at > 200) {
          panelPxCacheRef.current.at = now
          const panelEl = typeof document !== 'undefined' ? document.querySelector('.product-detail-panel') : null
          let panelPx = Math.min(DETAIL_PANEL_MAX_PX, vw * DETAIL_PANEL_VW)
          if (panelEl) {
            const pw = panelEl.getBoundingClientRect().width
            if (pw > 12) panelPx = pw
          }
          panelPxCacheRef.current.px = panelPx
        }
        const panelPx = panelPxCacheRef.current.px
        const f = Math.min(panelPx / vw, 0.95)
        const targetNdcX = -f - 0.18
        const err = targetNdcX - _worldCenter.x
        ndcErrSmooth.current.x = THREE.MathUtils.lerp(ndcErrSmooth.current.x, err, smoothAlpha)
        framingTrim.current.x += ndcErrSmooth.current.x * DETAIL_FRAMING_TRIM_GAIN * dt
        framingTrim.current.x = THREE.MathUtils.clamp(framingTrim.current.x, -1.45, 1.45)
        framingTrim.current.y = 0
      }
    }
  })

  return (
    <group ref={groupRef}>
      <group
        ref={root}
        onPointerDown={onPointerDown}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (!dragging.current) document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          if (!dragging.current) document.body.style.cursor = ''
        }}
      >
        <primitive object={object} />
      </group>
      <ProductAnnotationCallouts
        annotations={annotations}
        progressRef={progressRef}
        modelRootRef={root}
        scrollDarken={scrollDarken}
        portalHostRef={annotationPortalHostRef}
      />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color={prefersDark ? '#0f172a' : '#e8eefc'}
          transparent
          opacity={0.35}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      <ContactShadows
        rotation-x={Math.PI / 2}
        position={[0, 0.02, 0]}
        opacity={0.55}
        width={14}
        height={14}
        blur={2.2}
        far={12}
      />
    </group>
  )
}

/**
 * @param {[number,number,number]} [position]
 * @param {(payload: { index: number; copy: import('../data/productDetailCopy').ProductDetailCopy }) => void} [onProductSelect]
 * @param {number | null} openDetailIndex — 부모가 제어: null 이면 상세 닫힘
 * @param {number} [scrollDarken] — 제품 상세 스크롤 시 캔버스와 동일 0~1 (콜아웃 포털 어두움)
 * @param {React.RefObject<HTMLElement | null>} [annotationPortalHostRef] — 콜아웃 ReactDOM 루트 (없으면 document.body)
 */
export default function ProductCarousel({
  position = [0, 0, 0],
  showLightToggle = true,
  onProductSelect,
  openDetailIndex,
  scrollDarken = 0,
  annotationPortalHostRef,
}) {
  const [active, setActive] = useState(0)
  const { a11yPrefersState } = useUserPreferences()
  const motionDisabled = a11yPrefersState.prefersReducedMotion
  const prefersDark = a11yPrefersState.prefersDarkScheme
  const size = useThree((s) => s.size)
  const tier = getRoomCarouselTier(size.width)
  const yOffset = getCarouselGroupYOffset(tier)
  const carouselScale = getCarouselGroupScale(tier)
  const windowStart = useMemo(
    () => Math.max(0, Math.min(active - 1, COUNT - VISIBLE_SLOTS)),
    [active],
  )

  const detailProgress = useRef({ value: 0 })
  const carouselVis = useRef({ value: 1 })
  const carouselGroupRef = useRef(null)

  /** 상세 GLB는 닫힘 애니메이션 끝까지 유지 */
  const [displayIdx, setDisplayIdx] = useState(null)
  /** 이미 상세가 열린 상태에서 제품만 바꿀 때는 줌 인 애니를 다시 켜지 않음 */
  const prevOpenDetailRef = useRef(
    /** @type {number | null | undefined} */ (undefined),
  )

  useEffect(() => {
    if (openDetailIndex !== null && openDetailIndex !== undefined) {
      const wasAlreadyOpen =
        prevOpenDetailRef.current !== null && prevOpenDetailRef.current !== undefined
      prevOpenDetailRef.current = openDetailIndex
      setDisplayIdx(openDetailIndex)

      if (!wasAlreadyOpen) {
        gsap.killTweensOf(detailProgress.current)
        gsap.killTweensOf(carouselVis.current)
        detailProgress.current.value = 0
        carouselVis.current.value = 1
        gsap.to(detailProgress.current, {
          value: 1,
          duration: motionDisabled ? 0.35 : 0.9,
          ease: 'power2.out',
        })
        gsap.to(carouselVis.current, {
          value: 0,
          duration: 0.35,
          ease: 'power2.in',
        })
      }
    } else {
      prevOpenDetailRef.current = null
    }
  }, [openDetailIndex, motionDisabled])

  useEffect(() => {
    if (openDetailIndex !== null && openDetailIndex !== undefined) {
      setActive(openDetailIndex)
    }
  }, [openDetailIndex])

  useEffect(() => {
    if (openDetailIndex === null || openDetailIndex === undefined) {
      if (displayIdx === null) return
      gsap.killTweensOf(detailProgress.current)
      gsap.killTweensOf(carouselVis.current)
      gsap.to(detailProgress.current, {
        value: 0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => setDisplayIdx(null),
      })
      gsap.to(carouselVis.current, {
        value: 1,
        duration: 0.55,
        delay: 0.12,
        ease: 'power2.out',
      })
    }
  }, [openDetailIndex, displayIdx])

  useFrame(() => {
    if (carouselGroupRef.current) {
      const v = carouselVis.current.value
      carouselGroupRef.current.visible = v > 0.02
      carouselGroupRef.current.scale.setScalar(Math.max(0.001, v))
    }
  })

  const onNavigate = useCallback((left) => {
    setActive((a) => {
      if (left) return Math.max(0, a - 1)
      return Math.min(COUNT - 1, a + 1)
    })
  }, [])

  const onSelectCarouselIndex = useCallback((i) => {
    setActive(Math.max(0, Math.min(COUNT - 1, i)))
  }, [])

  const handlePickProduct = useCallback(
    (index) => {
      const copy = PRODUCT_DETAIL_LIST[index]
      if (copy && onProductSelect) {
        onProductSelect({ index, copy })
      }
    },
    [onProductSelect]
  )

  const detailUrl = displayIdx !== null ? PRODUCT_GLB_URLS[displayIdx] : null
  const pickingEnabled = displayIdx === null

  const onDetailNavigate = useCallback(
    (left) => {
      if (
        openDetailIndex === null ||
        openDetailIndex === undefined ||
        !onProductSelect
      ) {
        return
      }
      const next = left
        ? Math.max(0, openDetailIndex - 1)
        : Math.min(COUNT - 1, openDetailIndex + 1)
      if (next === openDetailIndex) return
      const copy = PRODUCT_DETAIL_LIST[next]
      onProductSelect({ index: next, copy })
    },
    [openDetailIndex, onProductSelect],
  )

  useEffect(() => {
    if (!pickingEnabled) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onNavigate(true)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNavigate(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickingEnabled, onNavigate])

  useEffect(() => {
    if (pickingEnabled) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onDetailNavigate(true)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        onDetailNavigate(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickingEnabled, onDetailNavigate])

  return (
    <group position={[position[0], position[1] + yOffset, position[2]]}>
      <group ref={carouselGroupRef} scale={carouselScale}>
        <CarouselStrip
          active={active}
          onPickProduct={handlePickProduct}
          pickingEnabled={pickingEnabled}
        />
        {pickingEnabled ? (
          <>
            <CarouselSideArrow
              side="left"
              tier={tier}
              prefersDark={prefersDark}
              motionDisabled={motionDisabled}
              enabled={active > 0}
              onPress={() => onNavigate(true)}
              ariaLabel="이전 제품"
            />
            <CarouselSideArrow
              side="right"
              tier={tier}
              prefersDark={prefersDark}
              motionDisabled={motionDisabled}
              enabled={active < COUNT - 1}
              onPress={() => onNavigate(false)}
              ariaLabel="다음 제품"
            />
            <CarouselCaptionBar
              tier={tier}
              active={active}
              prefersDark={prefersDark}
              motionDisabled={motionDisabled}
              onSelectIndex={onSelectCarouselIndex}
              onOpenDetail={
                onProductSelect ? () => handlePickProduct(active) : undefined
              }
            />
          </>
        ) : null}
        <ContactShadows
          rotation-x={Math.PI / 2}
          position={[0, -5, 0]}
          opacity={0.4}
          width={30}
          height={30}
          blur={1}
          far={15}
        />
      </group>

      {detailUrl !== null && (
        <Suspense fallback={null}>
          <ProductDetailStage
            url={detailUrl}
            productIndex={displayIdx}
            progressRef={detailProgress}
            prefersDark={prefersDark}
            scrollDarken={scrollDarken}
            annotationPortalHostRef={annotationPortalHostRef}
          />
        </Suspense>
      )}

      {showLightToggle && displayIdx === null && (
        <LightToggleRing position={[0, -3, 9]} />
      )}
    </group>
  )
}

function LightToggleRing({ position }) {
  const { a11yPrefersState, setA11yPrefersState } = useUserPreferences()
  const dark = a11yPrefersState.prefersDarkScheme
  const reduced = a11yPrefersState.prefersReducedMotion
  const [hover, setHover] = useState(false)
  const [pressed, setPressed] = useState(false)

  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        setA11yPrefersState({
          prefersDarkScheme: !dark,
          prefersReducedMotion: reduced,
        })
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerOver={() => {
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerLeave={() => {
        setHover(false)
        document.body.style.cursor = 'default'
      }}
    >
      <torusGeometry args={[0.5, pressed ? 0.28 : 0.25, 16, 32]} />
      <meshStandardMaterial
        metalness={1}
        roughness={0.8}
        color="#ffffff"
        emissive={hover ? '#44bb44' : '#0088ee'}
      />
    </mesh>
  )
}

PRODUCT_GLB_URLS.forEach((u) => useGLTF.preload(u))
