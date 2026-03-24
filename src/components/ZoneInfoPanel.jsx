import { useEffect, useRef, memo, useMemo } from 'react'
import { gsap } from 'gsap'
import { useMapStore } from '../store/useMapStore'
import './ZoneInfoPanel.css'

/**
 * Zone 정보 패널 컴포넌트
 * 화면 중앙에 표시되는 모달 형태의 업체 리스트 UI
 */
const ZoneInfoPanel = memo(function ZoneInfoPanel({ zoneId, onClose }) {
  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const boxRef = useRef(null)
  const prevZoneIdRef = useRef(null)
  const isVisibleRef = useRef(false)
  const isMarkerClick = useMapStore((state) => state.isMarkerClick)
  
  // Zone 설명 데이터 - useMemo로 메모이제이션
  const zoneDescriptions = useMemo(() => ({
    'zone-1': {
      title: 'Zone 1',
      description: 'This zone represents our creative workspace where innovative ideas come to life. It\'s a space dedicated to collaboration and innovation.',
    },
    'zone-2': {
      title: 'Zone 2',
      description: 'A hub for technology and development. This zone showcases our technical capabilities and engineering excellence.',
    },
    'zone-3': {
      title: 'Zone 3',
      description: 'The heart of our design process. This zone is where creativity meets functionality, where concepts transform into beautiful realities.',
    },
    'zone-4': {
      title: 'Zone 4',
      description: 'A space for experimentation and learning. This zone represents our commitment to continuous improvement and innovation.',
    },
    'zone-5': {
      title: 'Zone 5',
      description: 'Where ideas scale and grow. This zone demonstrates our ability to take concepts from prototype to production.',
    },
    'zone-6': {
      title: 'Zone 6',
      description: 'A collaborative environment for team building and creative sessions. This zone fosters innovation through teamwork.',
    },
    'zone-7': {
      title: 'Zone 7',
      description: 'The central hub of our operations. This zone connects all aspects of our work and serves as the foundation for everything we do.',
    },
    'zone-8': {
      title: 'Zone 8',
      description: 'A space dedicated to automation and efficiency. This zone showcases our technical infrastructure and scalable systems.',
    },
  }), [])
  
  // 업체 리스트 데이터 (예시) - useMemo로 메모이제이션
  const companies = useMemo(() => [
    { id: 1, name: 'GreenFi', category: 'Fintech', description: 'Talk with GreenFi and water a tree.' },
    { id: 2, name: 'Aven', category: 'Real Estate', description: 'Talk with Aven to renovate a house.' },
    { id: 3, name: 'TechCorp', category: 'Technology', description: 'Complete 6 fintech quests.' },
    { id: 4, name: 'DesignStudio', category: 'Design', description: 'Create amazing designs.' },
    { id: 5, name: 'DataLab', category: 'Data', description: 'Analyze data insights.' },
  ], [])
  
  const setSelectedCompany = useMapStore((state) => state.setSelectedCompany)
  const closeFullscreenCanvas = useMapStore((state) => state.closeFullscreenCanvas)
  
  const handleClose = () => {
    closeFullscreenCanvas() // 전체 화면 모드 닫기
    onClose() // Zone 선택 해제
  }
  
  const zoneInfo = zoneDescriptions[zoneId] || { title: `Zone ${zoneId?.replace('zone-', '')}`, description: 'Zone information' }
  
  // 나타나기 애니메이션 및 Zone 변경 처리
  useEffect(() => {
    if (!overlayRef.current || !panelRef.current || !boxRef.current) return
    
    const isSameZone = prevZoneIdRef.current === zoneId
    
    // 모달이 이미 열려있고 같은 Zone이면 애니메이션 없이 내용만 업데이트
    if (isVisibleRef.current && isSameZone) {
      return
    }
    
    // 모달이 이미 열려있고 다른 Zone으로 변경된 경우 - 내용만 업데이트 (애니메이션 없음)
    if (isVisibleRef.current && !isSameZone) {
      prevZoneIdRef.current = zoneId
      isVisibleRef.current = true
      return // 내용은 자동으로 리렌더링됨
    }
    
    // 처음 표시되는 경우만 애니메이션
    gsap.set(panelRef.current, {
      opacity: 0,
      x: 400,
    })
    
    gsap.set(boxRef.current, {
      rotationY: -Math.PI / 4,
    })
    
    gsap.to(panelRef.current, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      ease: 'power2.out',
      delay: 0.1,
    })
    
    gsap.to(boxRef.current, {
      rotationY: 0,
      duration: 0.5,
      ease: 'power2.out',
      delay: 0.1,
    })
    
    prevZoneIdRef.current = zoneId
    isVisibleRef.current = true
  }, [zoneId])
  
  return (
    <div 
      ref={overlayRef}
      className="zone-info-overlay"
    >
      <div 
        ref={panelRef}
        className="zone-info-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3D 박스 효과를 위한 컨테이너 */}
        <div ref={boxRef} className="zone-info-box">
          {/* 헤더 */}
          <div className="zone-info-header">
            <h2 className="zone-info-title">{zoneInfo.title}</h2>
            <button className="zone-info-close" onClick={handleClose}>×</button>
          </div>
          
          {/* 마커 클릭 시 Zone 설명, Zone 박스 클릭 시 업체 리스트 */}
          {isMarkerClick ? (
            <div className="zone-info-content">
              <div className="zone-info-description-text">
                {zoneInfo.description}
              </div>
            </div>
          ) : (
            <div className="zone-info-content">
              <div className="zone-info-subtitle">업체 리스트</div>
              <div className="company-list">
                {companies.map((company) => (
                  <div 
                    key={company.id} 
                    className="company-item"
                    onClick={() => {
                      setSelectedCompany(company.id, company.name)
                      handleClose()
                      // URL 변경
                      window.history.pushState({}, '', `/room/${company.id}`)
                    }}
                  >
                    <div className="company-icon">{company.name.charAt(0)}</div>
                    <div className="company-info">
                      <div className="company-name">{company.name}</div>
                      <div className="company-category">{company.category}</div>
                      <div className="company-description">{company.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ZoneInfoPanel.displayName = 'ZoneInfoPanel'

export default ZoneInfoPanel
