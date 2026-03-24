import { Html } from '@react-three/drei'
import { useEffect, useRef, memo, useCallback } from 'react'
import { gsap } from 'gsap'
import { useZoneStore, useMarkerStore } from '../hooks/useMapStore'
import './MapMarker.css'

interface MapMarkerProps {
  position: [number, number, number]
  buildingPosition?: [number, number, number]
  text: string
  areaId: string
  visible?: boolean
}

/**
 * 지도 위 마커 컴포넌트 (최적화 버전)
 * KODE Clubs 실제 사이트 스타일을 정확히 반영한 마커 디자인
 * 나타나기/사라지기 애니메이션 효과 포함
 */
const MapMarker = memo(function MapMarker({ 
  position,
  buildingPosition,
  text, 
  areaId,
  visible = false,
}: MapMarkerProps) {
  const { setSelectedZone } = useZoneStore()
  const { markersVisible } = useMarkerStore()
  const markerRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)
  
  const handleClick = useCallback(() => {
    // 마커 클릭 시 Zone 설명 모달 표시 (줌인 없이 바로 표시)
    setSelectedZone(areaId, buildingPosition || position, true)  // fromMarker = true
  }, [areaId, buildingPosition, position, setSelectedZone])
  
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
})

MapMarker.displayName = 'MapMarker'

export default MapMarker
