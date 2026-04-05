import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../store/useMapStore'
import { getSpeechBubbleScaleForWidth } from '../utils/mapViewportLayout'
import './NodeSpeechBubble.css'

/**
 * GLB 노드 월드 AABB 상단 중앙 위에 2D 말풍선 (drei Html).
 * @param {THREE.Object3D} anchor - 추적할 오브젝트 (예: nodes.CH_Water)
 * @param {THREE.Object3D} clonedScene - world 행렬 갱신용 (선택)
 * @param {string} label - 표시 문구
 * @param {boolean} showBadge - 분홍 ! 배지 (기본 끔)
 * @param {number} yPad - 바운딩 박스 위 추가 오프셋 (월드 단위)
 * @param {'light' | 'dark'} variant - dark: 네이비 배경·흰 글씨·빨간 배지 (호버 등)
 * @param {() => void} onBubbleActivate - 모바일 등: Html 말풍선 직접 탭 시 구역 포커스(캔버스 레이캐스트와 위치가 어긋나는 문제 방지)
 */
export function NodeSpeechBubble({
  anchor,
  clonedScene,
  label = 'WATER',
  showBadge = false,
  yPad = 4,
  variant = 'light',
  onBubbleActivate,
}) {
  const groupRef = useRef(null)
  const box = useRef(new THREE.Box3())
  const pos = useRef(new THREE.Vector3())
  const layoutWidthPx = useMapStore((s) => s.mapLayoutBrowserWidthPx)
  const bubbleScale = useMemo(() => getSpeechBubbleScaleForWidth(layoutWidthPx), [layoutWidthPx])

  useFrame(() => {
    const g = groupRef.current
    if (!g || !anchor) return
    if (clonedScene) clonedScene.updateMatrixWorld(true)
    anchor.updateWorldMatrix(true, true)

    box.current.setFromObject(anchor)
    if (box.current.isEmpty()) {
      anchor.getWorldPosition(pos.current)
      pos.current.y += yPad
    } else {
      const b = box.current
      pos.current.set((b.min.x + b.max.x) / 2, b.max.y + yPad, (b.min.z + b.max.z) / 2)
    }
    g.position.copy(pos.current)
  })

  if (!anchor) return null

  const bubbleInteractive = Boolean(onBubbleActivate)

  return (
    <group ref={groupRef}>
      <Html
        center
        position={[0, 0, 0]}
        transform={false}
        style={{ pointerEvents: bubbleInteractive ? 'auto' : 'none' }}
        zIndexRange={[100, 0]}
      >
        <div
          role={bubbleInteractive ? 'button' : undefined}
          tabIndex={bubbleInteractive ? 0 : undefined}
          onKeyDown={
            bubbleInteractive
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onBubbleActivate?.()
                  }
                }
              : undefined
          }
          className={`node-speech-bubble${variant === 'dark' ? ' node-speech-bubble--dark' : ''}${bubbleInteractive ? ' node-speech-bubble--interactive' : ''}`}
          style={{
            transform: `scale(${bubbleScale})`,
            transformOrigin: 'center center',
          }}
          onPointerDown={(e) => {
            if (!bubbleInteractive) return
            e.stopPropagation()
          }}
          onClick={(e) => {
            if (!bubbleInteractive) return
            e.stopPropagation()
            onBubbleActivate()
          }}
        >
          <div className="node-speech-bubble__body">
            {showBadge ? <span className="node-speech-bubble__badge">!</span> : null}
            <p className="node-speech-bubble__text">
              {label.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </React.Fragment>
              ))}
            </p>
          </div>
          <div className="node-speech-bubble__tail" aria-hidden />
        </div>
      </Html>
    </group>
  )
}
