import { useBox } from '@react-three/cannon'
import { Box } from '@react-three/drei'

/**
 * 물리 엔진이 적용된 땅 컴포넌트
 * 캐릭터가 땅 위를 걸을 수 있도록 충돌 감지 설정
 * useBox를 사용하여 확실한 충돌 감지
 */
export default function Ground({ position = [0, 0, 0] }) {
  const [ref] = useBox(() => ({
    position: [position[0], position[1], position[2]], // 정확한 위치 설정
    rotation: [0, 0, 0], // 회전 없음
    type: 'Static',
    args: [250, 0.1, 250], // 매우 얇은 박스 (width, height, depth) - 높이를 매우 작게
    material: {
      friction: 0.8,
      restitution: 0.1,
    },
  }))
  
  // 물리 바디를 시각적으로도 표시 (디버깅용)
  // ref를 직접 mesh에 연결하여 Debug 컴포넌트가 감지할 수 있도록
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[250, 0.1, 250]} />
      <meshStandardMaterial color="#A8E6CF" transparent opacity={0.5} />
    </mesh>
  )
}
