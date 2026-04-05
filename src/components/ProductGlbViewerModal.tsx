import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  ContactShadows,
  PerspectiveCamera,
} from '@react-three/drei'
import { Suspense, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './ProductGlbViewerModal.css'
import { normalizeProductGlbToUnit } from '../utils/productGlbNormalize'

function ViewerModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const object = useMemo(() => normalizeProductGlbToUnit(scene), [scene])
  return <primitive object={object} />
}

export type ProductGlbViewerModalProps = {
  open: boolean
  glbUrl: string | null
  onClose: () => void
}

/**
 * 제품 GLB 전용 풀스크린 뷰어 — 회전·줌만 (패닝 없음). IBL 없이 조명만 사용해 로드·GPU 부담 감소.
 */
export function ProductGlbViewerModal({ open, glbUrl, onClose }: ProductGlbViewerModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !glbUrl) return null

  return createPortal(
    <div
      className="product-glb-viewer-modal"
      role="dialog"
      aria-modal="true"
      aria-label="제품 3D 뷰"
    >
      <button
        type="button"
        className="product-glb-viewer-modal__close"
        onClick={onClose}
        aria-label="3D 뷰 닫기"
      >
        닫기
      </button>
      <div className="product-glb-viewer-modal__backdrop" aria-hidden />
      <div className="product-glb-viewer-modal__canvas-wrap">
        <Canvas
          className="product-glb-viewer-modal__canvas"
          shadows
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 2)]}
        >
          <PerspectiveCamera makeDefault position={[2.4, 1.35, 2.35]} fov={42} near={0.1} far={200} />
          <color attach="background" args={['#0b0f14']} />
          <hemisphereLight args={['#e8eefc', '#1a1f2e', 0.65]} />
          <ambientLight intensity={0.22} />
          <directionalLight position={[6, 10, 5]} intensity={1.15} castShadow />
          <directionalLight position={[-4, 6, -3]} intensity={0.4} color="#b8c5ff" />
          <Suspense fallback={null}>
            <group position={[0, -0.02, 0]}>
              <ViewerModel url={glbUrl} />
            </group>
            <ContactShadows
              rotation-x={Math.PI / 2}
              position={[0, -0.06, 0]}
              opacity={0.5}
              width={12}
              height={12}
              blur={2.2}
              far={8}
            />
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
