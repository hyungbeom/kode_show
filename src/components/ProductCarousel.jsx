import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, useGLTF } from '@react-three/drei'
import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { useUserPreferences } from '@react-three/a11y'
import { gsap } from 'gsap'
import { PRODUCT_DETAIL_LIST } from '../data/productDetailCopy'
import { PRODUCT_ANNOTATIONS } from '../data/productAnnotations'
import ProductAnnotationCallouts from './ProductAnnotationCallouts'

const COUNT = 5
export const PRODUCT_GLB_URLS = [
  '/product/product1.glb',
  '/product/product2.glb',
  '/product/product3.glb',
  '/product/product4.glb',
  '/product/product5.glb',
]

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
  const motionDisabled = a11yPrefersState.prefersReducedMotion

  useFrame((state, delta) => {
    if (!root.current) return
    const s = active ? 2 : 1
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

function NavDiamond({ left, navRadius, onNavigate }) {
  const [hover, setHover] = useState(false)
  const x = left ? -navRadius : navRadius
  return (
    <group position={[x, 0, 0]}>
      <group scale={left ? [1, 1, 1] : [-1, 1, 1]}>
        <mesh
          rotation={[0, 0, -Math.PI / 4]}
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(left)
          }}
          onPointerOver={() => {
            setHover(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerLeave={() => {
            setHover(false)
            document.body.style.cursor = 'default'
          }}
        >
          <tetrahedronGeometry />
          <meshStandardMaterial
            metalness={1}
            roughness={0.8}
            color={hover ? '#cc66dd' : '#ffffff'}
            emissive={hover ? '#339922' : '#003399'}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
}

function CarouselRing({ rotation, active, motionDisabled, onPickProduct, pickingEnabled }) {
  const viewport = useThree((s) => s.viewport)
  const group = useRef(null)
  const rotationRef = useRef(rotation)
  rotationRef.current = rotation
  const radius = Math.min(6, viewport.width / 5)

  useFrame(() => {
    if (!group.current) return
    const target = rotationRef.current - Math.PI / 2
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, target, motionDisabled ? 1 : 0.1)
  })

  return (
    <group ref={group}>
      {PRODUCT_GLB_URLS.map((url, i) => (
        <group
          key={url}
          position={[
            radius * Math.cos(i * ((Math.PI * 2) / COUNT)),
            0,
            radius * Math.sin(i * ((Math.PI * 2) / COUNT)),
          ]}
        >
          <Suspense fallback={null}>
            <CarouselProductMesh
              url={url}
              active={active === i}
              onPick={() => onPickProduct(i)}
              pickingEnabled={pickingEnabled}
            />
          </Suspense>
        </group>
      ))}
    </group>
  )
}

const PITCH_LIMIT = Math.PI / 2 - 0.15

/** ProductDetailPanel.css 과 동일해야 함: min(1040px, 78vw) */
const DETAIL_PANEL_MAX_PX = 1040
const DETAIL_PANEL_VW = 0.78

const _worldCenter = new THREE.Vector3()

/** 상세 뷰: 확대 등장 + 드래그 회전 + 점선 콜아웃 */
function ProductDetailStage({ url, progressRef, prefersDark, productIndex }) {
  const { scene } = useGLTF(url)
  const { camera, gl } = useThree()
  const root = useRef(null)
  const object = useMemo(() => normalizeToUnit(scene), [scene])
  const groupRef = useRef(null)
  const rotY = useRef(0)
  const rotX = useRef(0)
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const { a11yPrefersState } = useUserPreferences()
  const motionDisabled = a11yPrefersState.prefersReducedMotion

  const annotations = useMemo(() => {
    if (productIndex == null || productIndex < 0) return []
    return PRODUCT_ANNOTATIONS[productIndex] ?? []
  }, [productIndex])

  useEffect(() => {
    rotY.current = 0
    rotX.current = 0
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
    const targetScale = THREE.MathUtils.lerp(0.08, 3.2, Math.pow(t, 0.85))
    /** 등장 애니메이션용 기본 X (이후 NDC 보정으로 왼쪽으로) */
    const baseX = THREE.MathUtils.lerp(0.55, -5.55, Math.pow(t, 0.85))
    groupRef.current.position.x = baseX
    groupRef.current.position.y = THREE.MathUtils.lerp(-0.75, -0.22, t)
    groupRef.current.position.z = THREE.MathUtils.lerp(0, 0.4, t)
    root.current.scale.setScalar(targetScale)
    if (!dragging.current && !motionDisabled && t > 0.2) {
      rotY.current += 0.006
    }
    root.current.rotation.y = rotY.current
    root.current.rotation.x = rotX.current

    /**
     * 오른쪽 정보 패널을 제외한 왼쪽 띠의 수평 중앙에 모델(그룹 원점)이 오도록 보정.
     * 패널 너비 비율 f = panelPx / viewportWidth 일 때, 그 구간의 화면 중앙 NDC x = -f.
     */
    if (t > 0.04) {
      const vw = gl.domElement.getBoundingClientRect().width
      const panelEl = typeof document !== 'undefined' ? document.querySelector('.product-detail-panel') : null
      let panelPx = Math.min(DETAIL_PANEL_MAX_PX, vw * DETAIL_PANEL_VW)
      if (panelEl) {
        const pw = panelEl.getBoundingClientRect().width
        if (pw > 12) panelPx = pw
      }
      const f = Math.min(panelPx / vw, 0.95)
      /** 왼쪽 띠 중앙 기준(NDC x); 값을 키우면 모델이 화면에서 더 오른쪽으로 */
      const targetNdcX = -f - 0.18

      groupRef.current.getWorldPosition(_worldCenter)
      _worldCenter.project(camera)
      const err = targetNdcX - _worldCenter.x
      if (Math.abs(err) > 0.0005) {
        const step = err * (20 + 10 * t) * Math.min(delta * 60, 2.5)
        groupRef.current.position.x += THREE.MathUtils.clamp(step, -0.85, 0.85)
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
 */
export default function ProductCarousel({
  position = [0, 0, 0],
  showLightToggle = true,
  onProductSelect,
  openDetailIndex,
}) {
  const [active, setActive] = useState(0)
  const [rotation, setRotation] = useState(0)
  const { a11yPrefersState } = useUserPreferences()
  const motionDisabled = a11yPrefersState.prefersReducedMotion
  const prefersDark = a11yPrefersState.prefersDarkScheme
  const viewport = useThree((s) => s.viewport)
  const navRadius = Math.min(12, viewport.width / 2.5)

  const detailProgress = useRef({ value: 0 })
  const carouselVis = useRef({ value: 1 })
  const carouselGroupRef = useRef(null)

  /** 상세 GLB는 닫힘 애니메이션 끝까지 유지 */
  const [displayIdx, setDisplayIdx] = useState(null)

  useEffect(() => {
    if (openDetailIndex !== null && openDetailIndex !== undefined) {
      setDisplayIdx(openDetailIndex)
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
  }, [openDetailIndex, motionDisabled])

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
    setRotation((r) => r + ((Math.PI * 2) / COUNT) * (left ? -1 : 1))
    setActive((a) => (left ? (a === 0 ? COUNT - 1 : a - 1) : a === COUNT - 1 ? 0 : a + 1))
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

  return (
    <group position={position}>
      <group ref={carouselGroupRef}>
        <NavDiamond left navRadius={navRadius} onNavigate={onNavigate} />
        <CarouselRing
          rotation={rotation}
          active={active}
          motionDisabled={motionDisabled}
          onPickProduct={handlePickProduct}
          pickingEnabled={pickingEnabled}
        />
        <ContactShadows
          rotation-x={Math.PI / 2}
          position={[0, -5, 0]}
          opacity={0.4}
          width={30}
          height={30}
          blur={1}
          far={15}
        />
        <NavDiamond left={false} navRadius={navRadius} onNavigate={onNavigate} />
      </group>

      {detailUrl !== null && (
        <Suspense fallback={null}>
          <ProductDetailStage
            url={detailUrl}
            productIndex={displayIdx}
            progressRef={detailProgress}
            prefersDark={prefersDark}
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
