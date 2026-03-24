import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { useMapStore } from '../store/useMapStore'
import { ZONE_GLB_FOCUS_LIST } from '../utils/constants'
import './ZoneList.css'

/**
 * Zone 리스트 컴포넌트
 * 우측 하단에 리스트 버튼이 있고, 클릭하면 위로 슬라이드되는 Zone 선택 UI
 * 각 항목은 world.glb 노드 중심으로 아이소메트릭 줌 (CameraController)
 */
export default function ZoneList() {
  const [isOpen, setIsOpen] = useState(false)
  const listRef = useRef(null)
  const buttonRef = useRef(null)
  const selectArea = useMapStore((state) => state.selectArea)
  const glbFocusPositions = useMapStore((state) => state.glbFocusPositions)
  const followPhysicsBox = useMapStore((state) => state.followPhysicsBox)
  const setFollowPhysicsBox = useMapStore((state) => state.setFollowPhysicsBox)
  const resetToFullMap = useMapStore((state) => state.resetToFullMap)

  // 전체맵 모드로 전환 시 ZoneList 자동 닫기
  useEffect(() => {
    if (resetToFullMap && isOpen) {
      setIsOpen(false)
    }
  }, [resetToFullMap, isOpen])

  // 리스트 열기/닫기 애니메이션
  useEffect(() => {
    if (!listRef.current) return

    if (isOpen) {
      gsap.to(listRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    } else {
      gsap.to(listRef.current, {
        y: '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      })
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleZoneClick = (zone) => {
    const pos = glbFocusPositions[zone.glbNode]
    if (pos) {
      selectArea(zone.id, pos)
    }
    setIsOpen(false)
  }

  const handleFollowToggle = () => {
    setFollowPhysicsBox(!followPhysicsBox)
  }

  return (
    <>
      {/* 유저 아이콘 버튼 (리스트 버튼 왼쪽) */}
      <button
        className={`user-follow-button ${followPhysicsBox ? 'active' : ''}`}
        onClick={handleFollowToggle}
        aria-label="작은 상자 추적 모드"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>

      {/* 리스트 버튼 (우측 하단) */}
      <button
        ref={buttonRef}
        className={`zone-list-button ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label="Zone 리스트 열기"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </>
          )}
        </svg>
      </button>

      {/* Zone 리스트 패널 (위로 슬라이드) */}
      <div ref={listRef} className="zone-list-panel">
        <div className="zone-list-header">
          <h3 className="zone-list-title">Zone 선택</h3>
        </div>
        <div className="zone-list-content">
          {ZONE_GLB_FOCUS_LIST.map((zone) => {
            const ready = Boolean(glbFocusPositions[zone.glbNode])
            return (
              <button
                key={zone.id}
                type="button"
                className="zone-item-button"
                disabled={!ready}
                onClick={() => handleZoneClick(zone)}
              >
                <span className="zone-item-text">{zone.text}</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
