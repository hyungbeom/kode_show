import { useEffect, useRef, memo } from 'react'
import { gsap } from 'gsap'
import './ObjectDetailButton.css'

/**
 * 객체 상세보기 버튼 컴포넌트
 * 객체 클릭 시 오른쪽에 나타나는 제품 상세보기 UI
 */
const ObjectDetailButton = memo(function ObjectDetailButton({ objectInfo, onOpenModal, onClose }) {
  const buttonRef = useRef(null)

  useEffect(() => {
    if (objectInfo) {
      // 버튼 표시 애니메이션
      gsap.fromTo(
        buttonRef.current,
        { x: 400, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        }
      )
    } else {
      // 버튼 숨김 애니메이션
      if (buttonRef.current) {
        gsap.to(buttonRef.current, {
          x: 400,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        })
      }
    }
  }, [objectInfo])

  if (!objectInfo) return null

  return (
    <div ref={buttonRef} className="object-detail-button">
      <div className="object-detail-card">
        <div className="object-detail-header">
          <span className="object-detail-category">{objectInfo.category || 'OBJECT'}</span>
          <button className="object-detail-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="object-detail-content">
          <div className="object-detail-title">
            <span className="detail-title-gradient">{objectInfo.title}</span>
            {objectInfo.subtitle && (
              <span className="detail-title-subtitle">{objectInfo.subtitle}</span>
            )}
          </div>
          
          <div className="object-detail-preview">
            {objectInfo.description?.substring(0, 100)}...
          </div>
          
          <button 
            className="object-detail-open-btn"
            onClick={onOpenModal}
          >
            제품 상세보기
          </button>
        </div>
      </div>
    </div>
  )
})

ObjectDetailButton.displayName = 'ObjectDetailButton'

export default ObjectDetailButton
