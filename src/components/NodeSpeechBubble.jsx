import React, { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useMapStore } from '../store/useMapStore'
import { getSpeechBubbleScaleForWidth } from '../utils/mapViewportLayout'
import './NodeSpeechBubble.css'

const _worldBubblePos = new THREE.Vector3()

/**
 * GLB 노드 월드 AABB 기준 2D 말풍선 (drei Html) — 상단 중앙 또는 기하 중심.
 * @param {THREE.Object3D} anchor - 추적할 오브젝트 (예: nodes.CH_Water)
 * @param {React.RefObject<THREE.Object3D | null | undefined>} anchorRef - 있으면 매 프레임 current를 우선 (말풍선만 다른 메시에 붙일 때)
 * @param {THREE.Object3D} clonedScene - world 행렬 갱신용 (선택)
 * @param {string} label - 표시 문구
 * @param {boolean} showBadge - 분홍 ! 배지 (기본 끔)
 * @param {number} yPad - 월드 Y 오프셋 (`top`: 상단 기준 위로, `center`: 중심 기준)
 * @param {'top' | 'center'} bubblePlacement - `top`: AABB 윗면 중앙, `center`: AABB 기하 중심
 * @param {'center' | 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right'} bubbleHtmlPivot - 코너를 앵커에 맞춤·직각 방향
 * @param {'light' | 'dark'} variant - dark: 네이비 배경·흰 글씨·빨간 배지 (호버 등)
 * @param {() => void} onBubbleActivate - 모바일 등: Html 말풍선 직접 탭 시 구역 포커스(캔버스 레이캐스트와 위치가 어긋나는 문제 방지)
 */
export function NodeSpeechBubble({
  anchor,
  anchorRef,
  clonedScene,
  label = 'WATER',
  showBadge = false,
  yPad = 4,
  bubblePlacement = 'top',
  bubbleHtmlPivot = 'center',
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
    const target = anchorRef?.current ?? anchor
    if (!g || !target) return
    if (clonedScene) clonedScene.updateMatrixWorld(true)
    target.updateWorldMatrix(true, true)

    const w = _worldBubblePos
    box.current.setFromObject(target)
    if (box.current.isEmpty()) {
      target.getWorldPosition(w)
      w.y += yPad
    } else if (bubblePlacement === 'center') {
      box.current.getCenter(w)
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

  const bubbleInteractive = Boolean(onBubbleActivate)
  const pivotTopRight = bubbleHtmlPivot === 'top-right'
  const pivotTopLeft = bubbleHtmlPivot === 'top-left'
  const pivotBottomLeft = bubbleHtmlPivot === 'bottom-left'
  const pivotBottomRight = bubbleHtmlPivot === 'bottom-right'
  const hasAnchor = Boolean(anchorRef?.current ?? anchor)

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

  const bodySharpClass = pivotTopLeft
    ? ' node-speech-bubble__body--sharp-tl'
    : pivotBottomLeft
      ? ' node-speech-bubble__body--sharp-bl'
      : pivotBottomRight
        ? ' node-speech-bubble__body--sharp-br'
        : ''
  const bodyClass = 'node-speech-bubble__body' + bodySharpClass

  const bubbleBody = (
    <div className={bodyClass}>
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
  )

  return (
    <group ref={groupRef}>
      {hasAnchor ? (
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
          className={`node-speech-bubble${variant === 'dark' ? ' node-speech-bubble--dark' : ''}${bubbleInteractive ? ' node-speech-bubble--interactive' : ''}${pivotTopRight ? ' node-speech-bubble--pivot-top-right' : ''}${pivotTopLeft ? ' node-speech-bubble--pivot-top-left' : ''}${pivotBottomLeft ? ' node-speech-bubble--pivot-bottom-left' : ''}${pivotBottomRight ? ' node-speech-bubble--pivot-bottom-right' : ''}`}
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
          {pivotTopRight ? (
            <div className="node-speech-bubble__pivot-top-right">{bubbleBody}</div>
          ) : pivotTopLeft ? (
            <div className="node-speech-bubble__pivot-top-left">{bubbleBody}</div>
          ) : pivotBottomLeft ? (
            <div className="node-speech-bubble__pivot-bottom-left">{bubbleBody}</div>
          ) : pivotBottomRight ? (
            <div className="node-speech-bubble__pivot-bottom-right">{bubbleBody}</div>
          ) : (
            bubbleBody
          )}
        </div>
      </Html>
      ) : null}
    </group>
  )
}
