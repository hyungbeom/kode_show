import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  ContactShadows,
  PerspectiveCamera,
  Grid,
} from '@react-three/drei'
import { Suspense, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import './ProductGlbViewerModal.css'
import { normalizeProductGlbToUnit } from '../utils/productGlbNormalize'
import { DRACO_DECODER_URL } from '../utils/dracoDecoder'

function uniqueGlbUrls(urls: readonly string[] | null | undefined): string[] {
  if (!urls?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of urls) {
    const t = typeof u === 'string' ? u.trim() : ''
    if (t.length > 0 && !seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

function ViewerModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, DRACO_DECODER_URL)
  const object = useMemo(() => normalizeProductGlbToUnit(scene), [scene])
  return <primitive object={object} />
}

export type ProductGlbViewerModalProps = {
  open: boolean
  glbUrl: string | null
  onClose: () => void
  /** 상단 중앙에 표시할 제품명 */
  productTitle?: string | null
  /** 이전 GLB — 생략 시 좌측 화살표 미표시 */
  onPrevGlb?: () => void
  /** 다음 GLB */
  onNextGlb?: () => void
  canPrevGlb?: boolean
  canNextGlb?: boolean
  /** 모달에 쓰일 전체 GLB 경로 — 열릴 때 캐시 프리로드로 전환 시 Canvas 리마운트·서스펜스 깜빡임 완화 */
  preloadGlbUrls?: readonly string[] | null
}

function NavChevron({ flip }: { flip?: boolean }) {
  return (
    <svg
      className="product-glb-viewer-modal__nav-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path
        d="M14 18l-6-6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * 제품 GLB 전용 풀스크린 뷰어 — 회전·줌만 (패닝 없음). IBL 없이 조명만 사용해 로드·GPU 부담 감소.
 */
export function ProductGlbViewerModal({
  open,
  glbUrl,
  onClose,
  productTitle = null,
  onPrevGlb,
  onNextGlb,
  canPrevGlb = false,
  canNextGlb = false,
  preloadGlbUrls = null,
}: ProductGlbViewerModalProps) {
  const showPrev = Boolean(onPrevGlb)
  const showNext = Boolean(onNextGlb)

  const preloadKey = preloadGlbUrls?.length
    ? preloadGlbUrls.join('\u001f')
    : ''

  useEffect(() => {
    if (!open) return
    const toLoad = new Set<string>()
    const cur = typeof glbUrl === 'string' ? glbUrl.trim() : ''
    if (cur) toLoad.add(cur)
    for (const u of uniqueGlbUrls(preloadGlbUrls)) {
      toLoad.add(u)
    }
    for (const u of toLoad) {
      useGLTF.preload(u, DRACO_DECODER_URL)
    }
  }, [open, glbUrl, preloadKey, preloadGlbUrls])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && showPrev && canPrevGlb) {
        e.preventDefault()
        onPrevGlb?.()
      }
      if (e.key === 'ArrowRight' && showNext && canNextGlb) {
        e.preventDefault()
        onNextGlb?.()
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, onPrevGlb, onNextGlb, showPrev, showNext, canPrevGlb, canNextGlb])

  if (!open || !glbUrl) return null

  const titleTrimmed = typeof productTitle === 'string' ? productTitle.trim() : ''
  const ariaLabel = titleTrimmed.length > 0 ? `${titleTrimmed} 3D 뷰` : '제품 3D 뷰'

  return createPortal(
    <div
      className="product-glb-viewer-modal"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {titleTrimmed.length > 0 ? (
        <p id="product-glb-viewer-modal-title" className="product-glb-viewer-modal__title">
          {titleTrimmed}
        </p>
      ) : null}
      <button
        type="button"
        className="product-glb-viewer-modal__close"
        onClick={onClose}
        aria-label="3D 뷰 닫기"
      >
        닫기
      </button>
      <div className="product-glb-viewer-modal__backdrop" aria-hidden />
      {showPrev ? (
        <button
          type="button"
          className="product-glb-viewer-modal__nav product-glb-viewer-modal__nav--prev"
          onClick={() => canPrevGlb && onPrevGlb?.()}
          disabled={!canPrevGlb}
          aria-label="이전 제품 3D"
        >
          <NavChevron />
        </button>
      ) : null}
      {showNext ? (
        <button
          type="button"
          className="product-glb-viewer-modal__nav product-glb-viewer-modal__nav--next"
          onClick={() => canNextGlb && onNextGlb?.()}
          disabled={!canNextGlb}
          aria-label="다음 제품 3D"
        >
          <NavChevron flip />
        </button>
      ) : null}
      <div className="product-glb-viewer-modal__canvas-wrap">
        <Canvas
          className="product-glb-viewer-modal__canvas"
          shadows
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
        >
          <PerspectiveCamera makeDefault position={[2.4, 1.35, 2.35]} fov={42} near={0.1} far={200} />
          <color attach="background" args={['#0b0f14']} />
          <hemisphereLight args={['#f0f6ff', '#4a5870', 0.42]} />
          <ambientLight intensity={0.32} />
           <Grid
            renderOrder={-1}
            position={[0, -0.88, 0]}
            side={THREE.DoubleSide}
            infiniteGrid
            args={[120, 120]}
            cellSize={0.38}
            cellThickness={0.72}
            cellColor="#9eb6d4"
            sectionSize={1.9}
            sectionThickness={1.05}
            sectionColor="#c8daf2"
            fadeDistance={48}
            fadeStrength={0.55}
          />
          <ContactShadows
            rotation-x={Math.PI / 2}
            position={[0, -0.835, 0]}
            opacity={0.35}
            width={12}
            height={12}
            blur={2.2}
            far={8}
          />
          <Suspense fallback={null}>
            <group position={[0, -0.02, 0]}>
              <ViewerModel url={glbUrl} />
            </group>
          </Suspense>
          <OrbitControls
            makeDefault
            enablePan={false}
            enableZoom
            enableRotate
            minPolarAngle={0.15}
            maxPolarAngle={Math.PI - 0.12}
            minDistance={1.1}
            maxDistance={14}
            enableDamping
            dampingFactor={0.08}
            zoomSpeed={0.85}
            rotateSpeed={0.9}
          />
        </Canvas>
      </div>
      <p className="product-glb-viewer-modal__hint">드래그로 회전 · 스크롤 또는 핀치로 확대/축소</p>
    </div>,
    document.body,
  )
}
