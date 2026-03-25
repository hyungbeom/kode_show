import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import './NodeSpeechBubble.css'

/**
 * GLB 노드 월드 AABB 상단 중앙 위에 2D 말풍선 (drei Html).
 * @param {THREE.Object3D} anchor - 추적할 오브젝트 (예: nodes.CH_Water)
 * @param {THREE.Object3D} clonedScene - world 행렬 갱신용 (선택)
 * @param {string} label - 표시 문구
 * @param {boolean} showBadge - 우측 상단 분홍 ! 배지
 * @param {number} yPad - 바운딩 박스 위 추가 오프셋 (월드 단위)
 * @param {'light' | 'dark'} variant - dark: 네이비 배경·흰 글씨·빨간 배지 (호버 등)
 */
export function NodeSpeechBubble({
  anchor,
  clonedScene,
  label = 'WATER',
  showBadge = true,
  yPad = 4,
  variant = 'light',
}) {
  const groupRef = useRef(null)
  const box = useRef(new THREE.Box3())
  const pos = useRef(new THREE.Vector3())

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

  return (
    <group ref={groupRef}>
      <Html
        center
        position={[0, 0, 0]}
        transform={false}
        style={{ pointerEvents: 'none' }}
        zIndexRange={[100, 0]}
      >
        <div className={`node-speech-bubble${variant === 'dark' ? ' node-speech-bubble--dark' : ''}`}>
          <div className="node-speech-bubble__body">
            {showBadge ? <span className="node-speech-bubble__badge">!</span> : null}
            <p className="node-speech-bubble__text">{label}</p>
          </div>
          <div className="node-speech-bubble__tail" aria-hidden />
        </div>
      </Html>
    </group>
  )
}
