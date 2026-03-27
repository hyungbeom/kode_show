import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useFrame, useThree } from '@react-three/fiber'

import './ProductAnnotationCallouts.css'

const TEAL = '#00aec7'
const DEFAULT_TEXT_OFFSET = Object.freeze([-0.65, 0.1, 0])

const vHot = new THREE.Vector3()
const vText = new THREE.Vector3()
const vOff = new THREE.Vector3()

/**
 * R3F 는 Canvas 트리 안의 <circle>, <line> 등을 THREE 로 해석함.
 * react-dom createRoot 로만 그리면 SVG 네임스페이스로 처리됨.
 */
function AnnotationOverlayInner({
  annotations,
  lineRefs,
  ringHotRefs,
  ringTextRefs,
  textWrapRefs,
  containerRef,
}) {
  return (
    <div
      ref={containerRef}
      className="product-annotation-2d-root"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10050,
        pointerEvents: 'none',
      }}
    >
      <svg
        className="product-annotation-2d-svg"
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden
      >
        {annotations.map((ann, i) => (
          <g key={`${ann.headline}-${i}`}>
            <line
              ref={(el) => {
                lineRefs.current[i] = el
              }}
              stroke={TEAL}
              strokeWidth={2}
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
            <circle
              ref={(el) => {
                ringTextRefs.current[i] = el
              }}
              r={7}
              fill="none"
              stroke={TEAL}
              strokeWidth={2}
            />
            <circle
              ref={(el) => {
                ringHotRefs.current[i] = el
              }}
              r={7}
              fill="none"
              stroke={TEAL}
              strokeWidth={2}
            />
          </g>
        ))}
      </svg>
      {annotations.map((ann, i) => (
        <div
          key={`txt-${ann.headline}-${i}`}
          ref={(el) => {
            textWrapRefs.current[i] = el
          }}
          className="product-annotation-callout product-annotation-callout--2d"
        >
          <div className="product-annotation-callout__inner">
            <h3 className="product-annotation-callout__title">{ann.headline}</h3>
            <ul className="product-annotation-callout__list">
              {ann.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ProductAnnotationCallouts({ annotations, progressRef, modelRootRef }) {
  const { camera, gl } = useThree()
  const lineRefs = useRef([])
  const ringHotRefs = useRef([])
  const ringTextRefs = useRef([])
  const textWrapRefs = useRef([])
  const containerRef = useRef(null)
  const [mounted, setMounted] = useState(false)
  const domRootRef = useRef(null)
  const hostElRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!annotations?.length) {
      if (domRootRef.current) {
        domRootRef.current.unmount()
        domRootRef.current = null
      }
      if (hostElRef.current) {
        hostElRef.current.remove()
        hostElRef.current = null
      }
      containerRef.current = null
      return
    }

    const el = document.createElement('div')
    el.setAttribute('data-product-annotation-overlay', 'true')
    document.body.appendChild(el)
    hostElRef.current = el

    const root = createRoot(el)
    domRootRef.current = root
    root.render(
      <AnnotationOverlayInner
        annotations={annotations}
        lineRefs={lineRefs}
        ringHotRefs={ringHotRefs}
        ringTextRefs={ringTextRefs}
        textWrapRefs={textWrapRefs}
        containerRef={containerRef}
      />
    )

    return () => {
      root.unmount()
      el.remove()
      domRootRef.current = null
      hostElRef.current = null
      containerRef.current = null
    }
  }, [mounted, annotations])

  useFrame(() => {
    const t = progressRef?.current?.value ?? 0
    const root = modelRootRef?.current
    const container = containerRef.current

    if (!annotations?.length || !root || !container) {
      if (container) container.style.opacity = '0'
      return
    }

    if (t < 0.08) {
      container.style.opacity = '0'
      return
    }

    container.style.opacity = String(Math.min(1, (t - 0.08) / 0.35))
    const rect = gl.domElement.getBoundingClientRect()

    annotations.forEach((ann, i) => {
      const off = ann.textOffset ?? DEFAULT_TEXT_OFFSET
      vOff.set(...off)

      vHot.set(...ann.hotspot)
      vText.copy(vHot).add(vOff)
      vHot.applyMatrix4(root.matrixWorld)
      vText.applyMatrix4(root.matrixWorld)

      vHot.project(camera)
      vText.project(camera)

      const px = (ndcX) => rect.left + (ndcX * 0.5 + 0.5) * rect.width
      const py = (ndcY) => rect.top + (-ndcY * 0.5 + 0.5) * rect.height

      const hx = px(vHot.x)
      const hy = py(vHot.y)
      const tx = px(vText.x)
      const ty = py(vText.y)

      const line = lineRefs.current[i]
      if (line) {
        line.setAttribute('x1', String(tx))
        line.setAttribute('y1', String(ty))
        line.setAttribute('x2', String(hx))
        line.setAttribute('y2', String(hy))
      }

      const rh = ringHotRefs.current[i]
      if (rh) {
        rh.setAttribute('cx', String(hx))
        rh.setAttribute('cy', String(hy))
      }
      const rt = ringTextRefs.current[i]
      if (rt) {
        rt.setAttribute('cx', String(tx))
        rt.setAttribute('cy', String(ty))
      }
      const tw = textWrapRefs.current[i]
      if (tw) {
        tw.style.left = `${tx}px`
        tw.style.top = `${ty}px`
      }
    })
  })

  return null
}
