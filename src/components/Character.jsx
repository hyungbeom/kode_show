import { useRef, useEffect, useState, memo } from 'react'
import { Box } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useBox } from '@react-three/cannon'
import { useMapStore } from '../store/useMapStore'

/**
 * 맵 중앙에 배치될 캐릭터 컴포넌트
 * 물리 엔진 적용 및 WASD 키보드 입력으로 걷기
 */
const Character = memo(function Character({ position = [0, 0, 0] }) {
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
  })
  
  
  // 캐릭터의 전체 높이: 발(0.6) + 다리(2.5) + 몸통(4) + 머리(2) = 9.1
  // 캐릭터 중심 높이: 발 하단 기준 + 4.55
  // position[1]이 땅 높이이므로, 캐릭터 중심은 position[1] + 4.55
  
  const footHeight = 0.6
  const legHeight = 2.5
  const bodyHeight = 4
  const headHeight = 2
  
  // 발 하단이 position.y에 오도록, 발 중심은 position.y + footHeight/2
  const footCenterY = footHeight / 2
  const legCenterY = footHeight + legHeight / 2
  const bodyCenterY = footHeight + legHeight + bodyHeight / 2
  const headCenterY = footHeight + legHeight + bodyHeight + headHeight / 2
  
  // 물리 엔진 적용 (캐릭터 몸통)
  const [bodyRef, bodyApi] = useBox(() => ({
    mass: 0.5, // 몸통 무게
    position: [position[0], position[1] + bodyCenterY, position[2]], // 몸통 중심 높이
    args: [3, bodyHeight, 2], // 몸통 크기 (width, height, depth)
    material: {
      friction: 0.8,
      restitution: 0.1,
    },
    type: 'Dynamic',
    fixedRotation: true,
    allowSleep: false,
  }))
  
  // 왼쪽 다리 물리 바디
  const [leftLegRef, leftLegApi] = useBox(() => ({
    mass: 0.2, // 다리 무게
    position: [position[0] - 0.8, position[1] + legCenterY, position[2]], // 왼쪽 다리 중심
    args: [1, legHeight, 1], // 다리 크기
    material: {
      friction: 0.8,
      restitution: 0.1,
    },
    type: 'Dynamic',
    fixedRotation: true,
    allowSleep: false,
  }))
  
  // 오른쪽 다리 물리 바디
  const [rightLegRef, rightLegApi] = useBox(() => ({
    mass: 0.2, // 다리 무게
    position: [position[0] + 0.8, position[1] + legCenterY, position[2]], // 오른쪽 다리 중심
    args: [1, legHeight, 1], // 다리 크기
    material: {
      friction: 0.8,
      restitution: 0.1,
    },
    type: 'Dynamic',
    fixedRotation: true,
    allowSleep: false,
  }))
  
  const groupRef = useRef()
  const velocityRef = useRef([0, 0, 0])
  
  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase()
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        setKeys((prev) => ({ ...prev, [key]: true }))
      }
    }
    
    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase()
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        setKeys((prev) => ({ ...prev, [key]: false }))
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // 몸통 속도 구독
  useEffect(() => {
    const unsubscribe = bodyApi.velocity.subscribe((velocity) => {
      velocityRef.current = velocity
    })
    return unsubscribe
  }, [bodyApi])
  
  // 몸통 위치 구독
  useEffect(() => {
    const unsubscribe = bodyApi.position.subscribe(([x, y, z]) => {
      if (groupRef.current) {
        // 몸통 위치를 기준으로 그룹 위치 설정
        groupRef.current.position.set(x, y - bodyCenterY, z)
      }
    })
    return unsubscribe
  }, [bodyApi])
  
  // 왼쪽 다리 위치 구독 - 몸통과 함께 이동
  useEffect(() => {
    const unsubscribe = bodyApi.position.subscribe(([x, y, z]) => {
      leftLegApi.position.set(x - 0.8, y - bodyCenterY + legCenterY, z)
    })
    return unsubscribe
  }, [bodyApi, leftLegApi])
  
  // 오른쪽 다리 위치 구독 - 몸통과 함께 이동
  useEffect(() => {
    const unsubscribe = bodyApi.position.subscribe(([x, y, z]) => {
      rightLegApi.position.set(x + 0.8, y - bodyCenterY + legCenterY, z)
    })
    return unsubscribe
  }, [bodyApi, rightLegApi])
  
  // 이동 처리 (매 프레임마다 실행)
  useFrame(() => {
    const speed = 8 // 이동 속도
    
    // 이동 방향 계산
    let moveX = 0
    let moveZ = 0
    
    if (keys.w) moveZ -= speed // 앞으로
    if (keys.s) moveZ += speed // 뒤로
    if (keys.a) moveX -= speed // 왼쪽
    if (keys.d) moveX += speed // 오른쪽
    
    // 정규화하여 대각선 이동 시 속도 일정하게 유지
    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ)
      moveX = (moveX / length) * speed
      moveZ = (moveZ / length) * speed
      
      // 현재 Y 속도 유지하면서 X, Z 속도만 변경
      const currentY = velocityRef.current[1]
      bodyApi.velocity.set(moveX, currentY, moveZ)
      // 다리들도 같은 속도로 이동
      leftLegApi.velocity.set(moveX, currentY, moveZ)
      rightLegApi.velocity.set(moveX, currentY, moveZ)
    } else {
      // 키를 누르지 않으면 X, Z 속도만 0으로 (Y는 중력 유지)
      const currentY = velocityRef.current[1]
      bodyApi.velocity.set(0, currentY, 0)
      leftLegApi.velocity.set(0, currentY, 0)
      rightLegApi.velocity.set(0, currentY, 0)
    }
  })
  
  return (
    <group ref={groupRef} position={position}>
      {/* 물리 엔진 적용된 몸통 - Debug 컴포넌트가 이를 감지할 수 있도록 ref를 직접 mesh에 연결 */}
      <mesh ref={bodyRef} visible={false}>
        <boxGeometry args={[3, bodyHeight, 2]} />
        <meshStandardMaterial visible={false} />
      </mesh>
      
      {/* 왼쪽 다리 물리 바디 */}
      <mesh ref={leftLegRef} visible={false}>
        <boxGeometry args={[1, legHeight, 1]} />
        <meshStandardMaterial visible={false} />
      </mesh>
      
      {/* 오른쪽 다리 물리 바디 */}
      <mesh ref={rightLegRef} visible={false}>
        <boxGeometry args={[1, legHeight, 1]} />
        <meshStandardMaterial visible={false} />
      </mesh>
      
      {/* 몸통 */}
      <Box args={[3, bodyHeight, 2]} position={[0, bodyCenterY, 0]}>
        <meshStandardMaterial color="#4A90E2" />
      </Box>
      
      {/* 머리 */}
      <Box args={[2, headHeight, 2]} position={[0, headCenterY, 0]}>
        <meshStandardMaterial color="#FFDBAC" />
      </Box>
      
      {/* 팔 (왼쪽) */}
      <Box args={[1, 2.5, 1]} position={[-2, bodyCenterY - 0.5, 0]}>
        <meshStandardMaterial color="#4A90E2" />
      </Box>
      
      {/* 팔 (오른쪽) */}
      <Box args={[1, 2.5, 1]} position={[2, bodyCenterY - 0.5, 0]}>
        <meshStandardMaterial color="#4A90E2" />
      </Box>
      
      {/* 다리 (왼쪽) */}
      <Box args={[1, legHeight, 1]} position={[-0.8, legCenterY, 0]}>
        <meshStandardMaterial color="#2C5F8D" />
      </Box>
      
      {/* 다리 (오른쪽) */}
      <Box args={[1, legHeight, 1]} position={[0.8, legCenterY, 0]}>
        <meshStandardMaterial color="#2C5F8D" />
      </Box>
      
      {/* 발 (왼쪽) - 발 하단이 position.y에 오도록 */}
      <Box args={[1.2, footHeight, 1.5]} position={[-0.8, footCenterY, 0]}>
        <meshStandardMaterial color="#1A1A1A" />
      </Box>
      
      {/* 발 (오른쪽) - 발 하단이 position.y에 오도록 */}
      <Box args={[1.2, footHeight, 1.5]} position={[0.8, footCenterY, 0]}>
        <meshStandardMaterial color="#1A1A1A" />
      </Box>
    </group>
  )
})

Character.displayName = 'Character'

export default Character
