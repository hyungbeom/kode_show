import { Html } from '@react-three/drei'
import { useMapStore } from '../store/useMapStore'
import './MapMarker.css'
import { useEffect, useRef, memo } from 'react'
import { gsap } from 'gsap'

/**
 * 지도 위 마커 컴포넌트
 * KODE Clubs 실제 사이트 스타일을 정확히 반영한 마커 디자인
 * 나타나기/사라지기 애니메이션 효과 포함
 */
function MapMarker({ 
  position,  // 마커 위치 (옥상 위)
  buildingPosition,  // 건물 중심 위치 (카메라 타겟용)
  text, 
  areaId,
  visible = false,  // 마커 표시 여부
}) {
  const setSelectedZone = useMapStore((state) => state.setSelectedZone)
  const markersVisible = useMapStore((state) => state.markersVisible)
  const markerRef = useRef(null)
  const isInitialMount = useRef(true)
  
  const handleClick = () => {
    // 마커 클릭 시 Zone 설명 모달 표시 (줌인 없이 바로 표시)
    // areaId가 'zone-1', 'zone-2' 형식이므로 그대로 사용
    setSelectedZone(areaId, buildingPosition || position, true)  // fromMarker = true
  }
  
  // 마커 표시/숨김 애니메이션
  useEffect(() => {
    if (!markerRef.current) return
    
    if (markersVisible && visible) {
      // 초기 마운트 시에는 바로 표시, 이후에는 애니메이션
      if (isInitialMount.current) {
        gsap.set(markerRef.current, {
          opacity: 1,
          scale: 1,
          y: 0,
        })
        isInitialMount.current = false
      } else {
        // 마커 나타나기 애니메이션
        gsap.fromTo(
          markerRef.current,
          {
            opacity: 0,
            scale: 0,
            y: -20,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.7)',
            delay: Math.random() * 0.3,  // 각 마커마다 약간씩 다른 타이밍
          }
        )
      }
    } else if (!markersVisible) {
      // 마커 사라지기 애니메이션
      gsap.to(markerRef.current, {
        opacity: 0,
        scale: 0,
        y: -20,
        duration: 0.3,
        ease: 'back.in(1.7)',
      })
    }
  }, [markersVisible, visible])

  // 마커가 보이지 않을 때는 렌더링하지 않음
  if (!visible || !markersVisible) {
    return null
  }

  return (
    <Html
      position={position}
      center
      transform={false}  // OrthographicCamera에서 거리 기반 크기 조정 비활성화
      style={{ 
        pointerEvents: 'auto',
        transform: 'scale(1)',  // CSS로 직접 크기 제어
        opacity: 1,  // 초기 상태는 보이도록 설정
      }}
      zIndexRange={[100, 0]}
    >
      <div ref={markerRef} className="map-marker" onClick={handleClick}>
        <span className="marker-exclamation">!</span>
        <span className="marker-text">{text}</span>
      </div>
    </Html>
  )
}

export default memo(MapMarker)
