import React, { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../store/useMapStore'
import { getSpeechBubbleScaleForWidth } from '../utils/mapViewportLayout'
import './NodeSpeechBubble.css'

const _worldAnchorTop = new THREE.Vector3()

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
  const gestureConsumedRef = useRef(false)
  const layoutWidthPx = useMapStore((s) => s.mapLayoutBrowserWidthPx)
  const bubbleScale = useMemo(() => getSpeechBubbleScaleForWidth(layoutWidthPx), [layoutWidthPx])

  useFrame(() => {
    const g = groupRef.current
    if (!g || !anchor) return
    if (clonedScene) clonedScene.updateMatrixWorld(true)
    anchor.updateWorldMatrix(true, true)

    const w = _worldAnchorTop
    box.current.setFromObject(anchor)
    if (box.current.isEmpty()) {
      anchor.getWorldPosition(w)
      w.y += yPad
    } else {
      const b = box.current
      w.set((b.min.x + b.max.x) / 2, b.max.y + yPad, (b.min.z + b.max.z) / 2)
    }

    // 월드 좌표를 그대로 넣으면 MapTerrain scale/position 부모 아래에서 말풍선이 어긋남 (모바일)
    const parent = g.parent
    if (parent) {
      parent.updateWorldMatrix(true, true)
      parent.worldToLocal(w)
    }
    g.position.copy(w)
  })

  if (!anchor) return null

  const bubbleInteractive = Boolean(onBubbleActivate)

  const onBubblePointerDown = useCallback(
    (e) => {
      if (!bubbleInteractive) return
      e.stopPropagation()
      gestureConsumedRef.current = false
    },
    [bubbleInteractive],
  )

  const onBubblePointerUp = useCallback(
    (e) => {
      if (!bubbleInteractive) return
      e.stopPropagation()
      if (typeof e.button === 'number' && e.button !== 0) return
      if (gestureConsumedRef.current) return
      gestureConsumedRef.current = true
      onBubbleActivate?.()
    },
    [bubbleInteractive, onBubbleActivate],
  )

  const onBubbleClick = useCallback(
    (e) => {
      if (!bubbleInteractive) return
      e.stopPropagation()
      if (gestureConsumedRef.current) return
      gestureConsumedRef.current = true
      onBubbleActivate?.()
    },
    [bubbleInteractive, onBubbleActivate],
  )

  return (
    <group ref={groupRef}>
      <Html
        center
        position={[0, 0, 0]}
        transform={false}
        style={{ pointerEvents: bubbleInteractive ? 'auto' : 'none' }}
        zIndexRange={[2000, 1000]}
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
          onPointerDown={onBubblePointerDown}
          onPointerUp={onBubblePointerUp}
          onPointerCancel={() => {
            gestureConsumedRef.current = false
          }}
          onClick={onBubbleClick}
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
