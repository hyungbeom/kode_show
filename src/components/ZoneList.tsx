import { useState, useRef, useEffect, useMemo } from 'react'
import { gsap } from 'gsap'
import { useMapStore } from '../store/useMapStore'
import './ZoneList.css'

interface Zone {
  id: string
  text: string
  buildingPosition: [number, number, number]
}

/**
 * Zone 리스트 컴포넌트
 * 우측 하단에 리스트 버튼이 있고, 클릭하면 위로 슬라이드되는 Zone 선택 UI
 */
export default function ZoneList() {
  const [isOpen, setIsOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const setSelectedZone = useMapStore((state) => state.setSelectedZone)
  const selectArea = useMapStore((state) => state.selectArea)
  const followPhysicsBox = useMapStore((state) => state.followPhysicsBox)
  const setFollowPhysicsBox = useMapStore((state) => state.setFollowPhysicsBox)
  const resetToFullMap = useMapStore((state) => state.resetToFullMap)
  
  // 전체맵 모드로 전환 시 ZoneList 자동 닫기
  useEffect(() => {
    if (resetToFullMap && isOpen) {
      setIsOpen(false)
    }
  }, [resetToFullMap, isOpen])
  
  // MapScene과 동일한 계산 (scale = 5)
  const scale = 5
  const groundLevel = 0
  const secondFloorLevel = 0.8 * scale  // 4
  const thirdFloorLevel = 1.6 * scale  // 8
  const zone1Height = 1 * scale  // 5
  const zone2Height = 1 * scale  // 5
  const zone3Height = 1 * scale  // 5
  
  // Zone 정보 (MapScene의 areas와 동일한 buildingPosition 사용)
  const zones = useMemo<Zone[]>(() => [
    { 
      id: 'zone-1', 
      text: 'Zone 1', 
      buildingPosition: [0, thirdFloorLevel + zone1Height / 2, 25 * scale] 
    },
    { 
      id: 'zone-2', 
      text: 'Zone 2', 
      buildingPosition: [25 * scale, thirdFloorLevel + zone1Height / 2, 0] 
    },
    { 
      id: 'zone-3', 
      text: 'Zone 3', 
      buildingPosition: [0, thirdFloorLevel + zone1Height / 2, -25 * scale] 
    },
    { 
      id: 'zone-4', 
      text: 'Zone 4', 
      buildingPosition: [-25 * scale, thirdFloorLevel + zone1Height / 2, 0] 
    },
    { 
      id: 'zone-5', 
      text: 'Zone 5', 
      buildingPosition: [30 * scale, secondFloorLevel + zone2Height / 2, 30 * scale] 
    },
    { 
      id: 'zone-6', 
      text: 'Zone 6', 
      buildingPosition: [-30 * scale, secondFloorLevel + zone2Height / 2, -30 * scale] 
    },
    { 
      id: 'zone-7', 
      text: 'Zone 7', 
      buildingPosition: [-12 * scale, secondFloorLevel + zone2Height / 2, -12 * scale] 
    },
    { 
      id: 'zone-8', 
      text: 'Zone 8', 
      buildingPosition: [30 * scale, groundLevel + zone3Height / 2, -30 * scale] 
    },
  ], [scale, groundLevel, secondFloorLevel, thirdFloorLevel, zone1Height, zone2Height, zone3Height])
  
  // 리스트 열기/닫기 애니메이션
  useEffect(() => {
    if (!listRef.current) return
    
    if (isOpen) {
      // 리스트 열기 애니메이션
      gsap.to(listRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    } else {
      // 리스트 닫기 애니메이션
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
  
  const handleZoneClick = (zoneId: string, buildingPosition: [number, number, number]) => {
    // 마커 클릭과 동일하게 selectArea 호출하여 카메라 줌인
    selectArea(zoneId, buildingPosition)
    setIsOpen(false) // Zone 선택 후 리스트 닫기
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
          {zones.map((zone) => (
            <button
              key={zone.id}
              className="zone-item-button"
              onClick={() => handleZoneClick(zone.id, zone.buildingPosition)}
            >
              <span className="zone-item-text">{zone.text}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
