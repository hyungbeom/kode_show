import { useRef, memo, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * 구름 컴포넌트 (하이 폴리)
 * 많은 작은 박스들과 높은 세그먼트를 사용하여 매우 부드러운 구름 모양을 만듭니다
 */
const Cloud = memo(function Cloud({ position, scale = 1 }) {
  const groupRef = useRef()
  
  // 부드러운 회전 애니메이션
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })
  
  // 새하얀색 재질 (더 밝고 순수한 흰색)
  const whiteMaterial = <meshStandardMaterial color="#FFFFFF" opacity={1.0} transparent />
  
  // 하이 폴리 박스 생성 함수 (높은 세그먼트로 부드러운 표면)
  const HighPolyBox = ({ args, position: pos }) => (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={[...args, 8, 8, 8]} />
      {whiteMaterial}
    </mesh>
  )
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* 구름 중심 부분 - 하이 폴리 */}
      <HighPolyBox args={[12, 4, 10]} position={[0, 0, 0]} />
      
      {/* 구름 왼쪽 부분들 - 더 많은 작은 박스들 */}
      <HighPolyBox args={[8, 3.5, 8]} position={[-6, 0.5, 0]} />
      <HighPolyBox args={[6, 3, 6]} position={[-9, 0.8, -2]} />
      <HighPolyBox args={[6, 3, 6]} position={[-9, 0.8, 2]} />
      <HighPolyBox args={[5, 2.5, 5]} position={[-11, 0.6, -1]} />
      <HighPolyBox args={[5, 2.5, 5]} position={[-11, 0.6, 1]} />
      <HighPolyBox args={[4, 2, 4]} position={[-7, 1.2, -3]} />
      <HighPolyBox args={[4, 2, 4]} position={[-7, 1.2, 3]} />
      
      {/* 구름 오른쪽 부분들 */}
      <HighPolyBox args={[8, 3.5, 8]} position={[6, 0.5, 0]} />
      <HighPolyBox args={[6, 3, 6]} position={[9, 0.8, -2]} />
      <HighPolyBox args={[6, 3, 6]} position={[9, 0.8, 2]} />
      <HighPolyBox args={[5, 2.5, 5]} position={[11, 0.6, -1]} />
      <HighPolyBox args={[5, 2.5, 5]} position={[11, 0.6, 1]} />
      <HighPolyBox args={[4, 2, 4]} position={[7, 1.2, -3]} />
      <HighPolyBox args={[4, 2, 4]} position={[7, 1.2, 3]} />
      
      {/* 구름 앞쪽 부분들 */}
      <HighPolyBox args={[8, 3, 7]} position={[0, 0.4, 5]} />
      <HighPolyBox args={[6, 2.5, 5]} position={[-3, 0.6, 7]} />
      <HighPolyBox args={[6, 2.5, 5]} position={[3, 0.6, 7]} />
      <HighPolyBox args={[5, 2, 4]} position={[-1.5, 0.8, 8]} />
      <HighPolyBox args={[5, 2, 4]} position={[1.5, 0.8, 8]} />
      <HighPolyBox args={[4, 2, 4]} position={[-4.5, 0.7, 6]} />
      <HighPolyBox args={[4, 2, 4]} position={[4.5, 0.7, 6]} />
      
      {/* 구름 뒤쪽 부분들 */}
      <HighPolyBox args={[8, 3, 7]} position={[0, 0.4, -5]} />
      <HighPolyBox args={[6, 2.5, 5]} position={[-3, 0.6, -7]} />
      <HighPolyBox args={[6, 2.5, 5]} position={[3, 0.6, -7]} />
      <HighPolyBox args={[5, 2, 4]} position={[-1.5, 0.8, -8]} />
      <HighPolyBox args={[5, 2, 4]} position={[1.5, 0.8, -8]} />
      <HighPolyBox args={[4, 2, 4]} position={[-4.5, 0.7, -6]} />
      <HighPolyBox args={[4, 2, 4]} position={[4.5, 0.7, -6]} />
      
      {/* 구름 위쪽 부분들 - 더 많은 레이어와 작은 박스들 */}
      <HighPolyBox args={[6, 2.5, 6]} position={[-4, 3, 0]} />
      <HighPolyBox args={[6, 2.5, 6]} position={[4, 3, 0]} />
      <HighPolyBox args={[5, 2, 5]} position={[-2, 4.5, -2]} />
      <HighPolyBox args={[5, 2, 5]} position={[2, 4.5, -2]} />
      <HighPolyBox args={[5, 2, 5]} position={[-2, 4.5, 2]} />
      <HighPolyBox args={[5, 2, 5]} position={[2, 4.5, 2]} />
      <HighPolyBox args={[4, 1.5, 4]} position={[0, 5.5, 0]} />
      <HighPolyBox args={[3.5, 1.5, 3.5]} position={[-3, 4, -3]} />
      <HighPolyBox args={[3.5, 1.5, 3.5]} position={[3, 4, -3]} />
      <HighPolyBox args={[3.5, 1.5, 3.5]} position={[-3, 4, 3]} />
      <HighPolyBox args={[3.5, 1.5, 3.5]} position={[3, 4, 3]} />
      <HighPolyBox args={[3, 1, 3]} position={[-1.5, 6, -1.5]} />
      <HighPolyBox args={[3, 1, 3]} position={[1.5, 6, -1.5]} />
      <HighPolyBox args={[3, 1, 3]} position={[-1.5, 6, 1.5]} />
      <HighPolyBox args={[3, 1, 3]} position={[1.5, 6, 1.5]} />
      
      {/* 구름 중간 레이어들 - 더 많은 작은 박스들 */}
      <HighPolyBox args={[7, 2.5, 7]} position={[-3, 1.5, -3]} />
      <HighPolyBox args={[7, 2.5, 7]} position={[3, 1.5, -3]} />
      <HighPolyBox args={[7, 2.5, 7]} position={[-3, 1.5, 3]} />
      <HighPolyBox args={[7, 2.5, 7]} position={[3, 1.5, 3]} />
      <HighPolyBox args={[5, 2, 5]} position={[-5, 1.8, -5]} />
      <HighPolyBox args={[5, 2, 5]} position={[5, 1.8, -5]} />
      <HighPolyBox args={[5, 2, 5]} position={[-5, 1.8, 5]} />
      <HighPolyBox args={[5, 2, 5]} position={[5, 1.8, 5]} />
      <HighPolyBox args={[4, 1.8, 4]} position={[-1.5, 2.2, -1.5]} />
      <HighPolyBox args={[4, 1.8, 4]} position={[1.5, 2.2, -1.5]} />
      <HighPolyBox args={[4, 1.8, 4]} position={[-1.5, 2.2, 1.5]} />
      <HighPolyBox args={[4, 1.8, 4]} position={[1.5, 2.2, 1.5]} />
      
      {/* 구름 하단 부분들 - 더 부드러운 연결 */}
      <HighPolyBox args={[4, 1.5, 4]} position={[-6, -0.5, -2]} />
      <HighPolyBox args={[4, 1.5, 4]} position={[-6, -0.5, 2]} />
      <HighPolyBox args={[4, 1.5, 4]} position={[6, -0.5, -2]} />
      <HighPolyBox args={[4, 1.5, 4]} position={[6, -0.5, 2]} />
      <HighPolyBox args={[3, 1.2, 3]} position={[-8, -0.3, 0]} />
      <HighPolyBox args={[3, 1.2, 3]} position={[8, -0.3, 0]} />
    </group>
  )
})

Cloud.displayName = 'Cloud'

/**
 * 구름들 컴포넌트
 * 여러 개의 구름을 맵 위에 배치
 */
const Clouds = memo(function Clouds() {
  // 맵 크기가 5배 스케일이므로 구름 위치도 조정
  const scale = 5
  
  // 구름 위치들 (매우 높은 위치에 배치) - 중앙에 2~3개만 - useMemo로 메모이제이션
  const cloudPositions = useMemo(() => [
    // 주변 구름들 - 높이를 40-50으로 증가
    [-30 * scale, 45, -30 * scale],  // 남서쪽
    [30 * scale, 43, -25 * scale],   // 남동쪽
    [-25 * scale, 47, 30 * scale],   // 북서쪽
    [25 * scale, 44, 30 * scale],    // 북동쪽
    [0, 46, -35 * scale],            // 남쪽 중앙
    [-35 * scale, 45, 0],            // 서쪽 중앙
    [35 * scale, 44, 0],             // 동쪽 중앙
    [0, 48, 35 * scale],             // 북쪽 중앙
    // 중앙 구름 2~3개만
    [0, 47, 0],                      // 정중앙
    [-8 * scale, 44, 5 * scale],     // 중앙 서쪽 약간
    [8 * scale, 45, -5 * scale],     // 중앙 동쪽 약간
    // 주변 구름들
    [-20 * scale, 44, -20 * scale],  // 남서쪽 중간
    [20 * scale, 46, -20 * scale],   // 남동쪽 중간
    [-20 * scale, 43, 20 * scale],   // 북서쪽 중간
    [20 * scale, 45, 20 * scale],    // 북동쪽 중간
  ], [scale])
  
  // 구름 크기 배열도 메모이제이션
  const cloudScales = useMemo(() => {
    return cloudPositions.map(() => {
      const sizeVariation = Math.random()
      if (sizeVariation < 0.3) {
        return 0.7 + Math.random() * 0.3 // 0.7 ~ 1.0
      } else if (sizeVariation < 0.7) {
        return 1.0 + Math.random() * 0.5 // 1.0 ~ 1.5
      } else {
        return 1.5 + Math.random() * 0.8 // 1.5 ~ 2.3
      }
    })
  }, [cloudPositions])
  
  return (
    <group>
      {cloudPositions.map((position, index) => (
        <Cloud 
          key={index} 
          position={position} 
          scale={cloudScales[index]}
        />
      ))}
    </group>
  )
})

Clouds.displayName = 'Clouds'

export default Clouds
