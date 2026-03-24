import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { gsap } from 'gsap'
import './ObjectInfoPanel.css'

/**
 * 객체 정보 패널 컴포넌트
 * 부스에서 객체 클릭 시 오른쪽에 표시되는 정보 패널
 */
const ObjectInfoPanel = memo(function ObjectInfoPanel({ objectInfo, onClose, onOpenModal }) {
  const panelRef = useRef(null)
  const prevObjectIdRef = useRef(null)
  const isVisibleRef = useRef(false)
  const [selectedIconIndex, setSelectedIconIndex] = useState(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const descriptionRef = useRef(null)

  useEffect(() => {
    if (objectInfo) {
      const currentObjectId = objectInfo.id
      const isSameObject = prevObjectIdRef.current === currentObjectId
      
      // 모달이 이미 열려있으면 애니메이션 없이 내용만 업데이트
      if (isVisibleRef.current) {
        // 다른 객체로 변경된 경우에도 애니메이션 없이 내용만 업데이트
        prevObjectIdRef.current = currentObjectId
        // 새로운 객체로 변경되면 초기 상태로 리셋 (아이콘 메뉴와 버튼이 보이는 상태)
        if (!isSameObject) {
          setSelectedIconIndex(null)
        }
        return
      }
      
      // 처음 표시되는 경우만 애니메이션
      gsap.fromTo(
        panelRef.current,
        { x: 400, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
        }
      )
      
      prevObjectIdRef.current = currentObjectId
      isVisibleRef.current = true
      
      // 초기 상태는 null로 설정 (아이콘 메뉴와 버튼이 보이는 상태)
      setSelectedIconIndex(null)
      
      // 초기 렌더링 시 페이드 인
      setTimeout(() => {
        if (titleRef.current && subtitleRef.current && descriptionRef.current) {
          gsap.fromTo([titleRef.current, subtitleRef.current, descriptionRef.current], 
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: 'power2.out' }
          )
        }
      }, 100)
    } else {
      // 패널 숨김 애니메이션
      if (panelRef.current && isVisibleRef.current) {
        gsap.to(panelRef.current, {
          x: 400,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        })
        isVisibleRef.current = false
        prevObjectIdRef.current = null
        setSelectedIconIndex(null)
      }
    }
  }, [objectInfo])

  if (!objectInfo) return null

  // 선택된 아이콘의 정보 가져오기
  const displayInfo = (() => {
    if (selectedIconIndex !== null && objectInfo.icons?.[selectedIconIndex]) {
      const selectedIcon = objectInfo.icons[selectedIconIndex]
      return {
        title: selectedIcon.title || objectInfo.title,
        subtitle: selectedIcon.subtitle || objectInfo.subtitle,
        description: selectedIcon.description || objectInfo.description,
      }
    }
    return {
      title: objectInfo.title,
      subtitle: objectInfo.subtitle,
      description: objectInfo.description,
    }
  })()

  const handleIconClick = (index) => {
    if (selectedIconIndex === index) return // 같은 아이콘 클릭 시 무시
    
    // 페이드 아웃 애니메이션
    if (titleRef.current && subtitleRef.current && descriptionRef.current) {
      gsap.to([titleRef.current, subtitleRef.current, descriptionRef.current], {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          // 내용 변경
          setSelectedIconIndex(index)
          // 페이드 인 애니메이션
          gsap.to([titleRef.current, subtitleRef.current, descriptionRef.current], {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
          })
        },
      })
    } else {
      setSelectedIconIndex(index)
    }
  }

  return (
    <>
      {/* 오버레이 제거 - 배경이 어두워지거나 흐려지지 않도록 */}
      {/* 정보 패널 - pointer-events: none으로 설정하여 배경 Canvas와 상호작용 가능하도록 */}
      <div ref={panelRef} className="object-info-panel" style={{ pointerEvents: 'none' }}>
        <div className="object-info-card" style={{ pointerEvents: 'auto' }}>
          {/* 헤더 */}
          <div className="object-info-header">
            <span className="object-info-category">{objectInfo.category || 'OBJECT'}</span>
            <button className="object-info-close" onClick={onClose}>
              ×
            </button>
          </div>
          
          {/* 제목 */}
          <div className="object-info-title">
            <span ref={titleRef} className="title-gradient">{displayInfo.title}</span>
            {displayInfo.subtitle && (
              <span ref={subtitleRef} className="title-subtitle">{displayInfo.subtitle}</span>
            )}
          </div>
          
          {/* 설명 */}
          <div ref={descriptionRef} className="object-info-description">
            {displayInfo.description}
          </div>
          
          {/* 제품 상세보기 버튼 - 항상 표시 */}
          {onOpenModal && (
            <div className="object-info-action">
              <button 
                className="object-info-open-btn"
                onClick={onOpenModal}
              >
                제품 상세보기
              </button>
            </div>
          )}
          
          {/* 아이콘 섹션 - 항상 표시 */}
          {objectInfo.icons && objectInfo.icons.length > 0 && (
            <div className="object-info-icons">
              {objectInfo.icons.map((icon, index) => (
                <div
                  key={index}
                  className={`object-info-icon ${selectedIconIndex === index ? 'active' : ''}`}
                  onClick={() => handleIconClick(index)}
                >
                  {icon.component || icon.emoji || '●'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
})

ObjectInfoPanel.displayName = 'ObjectInfoPanel'

export default ObjectInfoPanel
