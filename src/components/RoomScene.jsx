import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls, Environment, Sky as SkyImpl, Outlines, useGLTF, Lightformer, Grid } from '@react-three/drei'
import { Suspense, useRef, useEffect, useState, memo, createContext, useContext, useCallback, useMemo } from 'react'
import { Box } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { gsap } from 'gsap'
import * as THREE from 'three'
import ObjectInfoPanel from './ObjectInfoPanel'
import ObjectViewer from './ObjectViewer'
import ObjectDetailButton from './ObjectDetailButton'

/**
 * 방 씬 컴포넌트
 * 업체 클릭 시 표시되는 3D 방
 */
const RoomScene = memo(function RoomScene({ companyName, onBack }) {
  const resetCameraRef = useRef(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  // 객체 정보 데이터 (예시) - useMemo로 메모이제이션하여 불필요한 재생성 방지
  const objectInfoMap = useMemo(() => ({
    'desk': {
      category: 'WORKSPACE',
      title: 'Creative Desk',
      subtitle: 'Workspace',
      description: 'This desk serves as the foundation for countless ideas and projects. It\'s where creativity meets productivity, where concepts transform into reality.',
      icons: [
        { 
          component: '💀', 
          active: true,
          title: 'Creative Desk',
          subtitle: 'Workspace',
          description: 'This desk serves as the foundation for countless ideas and projects. It\'s where creativity meets productivity, where concepts transform into reality.'
        },
        { 
          component: '💡', 
          active: false,
          title: 'Inspiration Hub',
          subtitle: 'Ideas',
          description: 'Every great project starts with a single idea. This desk has been the birthplace of countless innovations and creative solutions that shaped our journey.'
        },
        { 
          component: '⚙️', 
          active: false,
          title: 'Productivity Engine',
          subtitle: 'Efficiency',
          description: 'Designed for optimal workflow and organization. This workspace adapts to different projects, from design mockups to code development, ensuring maximum productivity.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Launch Platform',
          subtitle: 'Innovation',
          description: 'From concept to launch, this desk has witnessed the entire lifecycle of products. It\'s where prototypes become reality and dreams take flight.'
        },
      ]
    },
    'monitor': {
      category: 'DISPLAY',
      title: 'Vision Screen',
      subtitle: 'Monitor',
      description: 'A window to digital worlds and creative visions. This monitor displays the results of countless hours of work and innovation.',
      icons: [
        { 
          component: '💀', 
          active: false,
          title: 'Vision Screen',
          subtitle: 'Monitor',
          description: 'A window to digital worlds and creative visions. This monitor displays the results of countless hours of work and innovation.'
        },
        { 
          component: '💡', 
          active: true,
          title: 'Creative Canvas',
          subtitle: 'Visualization',
          description: 'Where pixels come alive and designs take shape. This screen has showcased everything from wireframes to final products, bringing ideas to visual reality.'
        },
        { 
          component: '⚙️', 
          active: false,
          title: 'Technical Display',
          subtitle: 'Development',
          description: 'Perfect for coding, debugging, and technical work. The high resolution and color accuracy make it ideal for both development and design tasks.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Presentation Hub',
          subtitle: 'Showcase',
          description: 'The screen where we present our work to clients and stakeholders. Every pixel matters when showcasing the results of our creative and technical efforts.'
        },
      ]
    },
    'arcade': {
      category: 'ENTERTAINMENT',
      title: 'Arcade Machine',
      subtitle: 'Gaming',
      description: 'A tribute to the games we developed but didn\'t reach millions. We treasure the wisdom and learnings they brought us.',
      icons: [
        { 
          component: '💀', 
          active: true,
          title: 'Arcade Machine',
          subtitle: 'Gaming',
          description: 'A tribute to the games we developed but didn\'t reach millions. We treasure the wisdom and learnings they brought us.'
        },
        { 
          component: '💡', 
          active: false,
          title: 'Creative Experiments',
          subtitle: 'Innovation',
          description: 'This machine represents our experimental projects - games that pushed boundaries and explored new gameplay mechanics, even if they didn\'t achieve commercial success.'
        },
        { 
          component: '⚙️', 
          active: false,
          title: 'Technical Learning',
          subtitle: 'Growth',
          description: 'Every game taught us something valuable. From optimization techniques to player psychology, these projects were our greatest teachers in game development.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Future Dreams',
          subtitle: 'Aspiration',
          description: 'These games may not have reached millions, but they fuel our passion for creating the next big hit. Every failure is a stepping stone to success.'
        },
      ]
    },
    'chair': {
      category: 'FURNITURE',
      title: 'Comfort Seat',
      subtitle: 'Chair',
      description: 'Where ideas take shape. This chair has witnessed countless brainstorming sessions and creative breakthroughs.',
      icons: [
        { 
          component: '💀', 
          active: false,
          title: 'Comfort Seat',
          subtitle: 'Chair',
          description: 'Where ideas take shape. This chair has witnessed countless brainstorming sessions and creative breakthroughs.'
        },
        { 
          component: '💡', 
          active: false,
          title: 'Brainstorming Station',
          subtitle: 'Ideation',
          description: 'The perfect spot for deep thinking and creative sessions. Many breakthrough ideas were born while sitting here, contemplating solutions to complex problems.'
        },
        { 
          component: '⚙️', 
          active: true,
          title: 'Ergonomic Design',
          subtitle: 'Comfort',
          description: 'Designed for long hours of focused work. The ergonomic design ensures comfort during extended coding sessions, design work, and creative endeavors.'
        },
        { 
          component: '🚀', 
          active: false,
          title: 'Productivity Throne',
          subtitle: 'Focus',
          description: 'Where productivity meets comfort. This chair has been the command center for launching products, writing code, and bringing visions to life.'
        },
      ]
    },
    'bookshelf': {
      category: 'STORAGE',
      title: 'Knowledge Archive',
      subtitle: 'Bookshelf',
      description: 'A collection of knowledge and inspiration. Books, references, and memories stored in this shelf.',
      icons: [
        { 
          component: '📚', 
          active: true,
          title: 'Knowledge Archive',
          subtitle: 'Bookshelf',
          description: 'A collection of knowledge and inspiration. Books, references, and memories stored in this shelf.'
        },
      ]
    },
    'lamp': {
      category: 'LIGHTING',
      title: 'Creative Light',
      subtitle: 'Lamp',
      description: 'Illuminating ideas and projects. This lamp has been a constant companion during late-night work sessions.',
      icons: [
        { 
          component: '💡', 
          active: true,
          title: 'Creative Light',
          subtitle: 'Lamp',
          description: 'Illuminating ideas and projects. This lamp has been a constant companion during late-night work sessions.'
        },
      ]
    },
    'table': {
      category: 'FURNITURE',
      title: 'Collaboration Table',
      subtitle: 'Table',
      description: 'Where teams gather to discuss, plan, and create together. Many successful projects started here.',
      icons: [
        { 
          component: '🤝', 
          active: true,
          title: 'Collaboration Table',
          subtitle: 'Table',
          description: 'Where teams gather to discuss, plan, and create together. Many successful projects started here.'
        },
      ]
    },
    'shelf': {
      category: 'STORAGE',
      title: 'Display Shelf',
      subtitle: 'Shelf',
      description: 'Showcasing achievements, prototypes, and memorable items from our journey.',
      icons: [
        { 
          component: '🏆', 
          active: true,
          title: 'Display Shelf',
          subtitle: 'Shelf',
          description: 'Showcasing achievements, prototypes, and memorable items from our journey.'
        },
      ]
    },
  }), []) // 빈 의존성 배열로 한 번만 생성
  
  return (
    <div data-room-scene style={{ width: '100%', height: '100vh', position: 'relative', opacity: 0, background: 'linear-gradient(to bottom, #CCFFCC 0%, #B8E6CC 20%, #87CEEB 45%, #5F9EA0 70%, #4682B4 100%)' }}>
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        ← 뒤로가기
      </button>
      
      {/* 회사명 표시 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '20px',
          fontWeight: 'bold',
        }}
      >
        {companyName}
      </div>
      
      {/* 전체보기 버튼 */}
      <button
        onClick={() => resetCameraRef.current?.()}
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)'
        }}
      >
        전체보기
      </button>
      
      <Canvas
        shadows
        style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        dpr={[1, 2]}
        onCreated={({ gl, scene }) => {
          // 배경을 완전히 투명하게 설정하여 div의 그라데이션이 보이도록
          gl.setClearColor(0x000000, 0)
          scene.background = null
          // 매 프레임마다 배경을 투명하게 유지
          gl.clearColor(0, 0, 0, 0)
        }}
      >
        <CameraControlProvider resetCameraRef={resetCameraRef}>
          <Suspense fallback={null}>
            {/* 배경을 투명하게 설정하여 div의 그라데이션이 보이도록 */}
            <BackgroundKeeper />
            
            {/* 카메라 설정 - PerspectiveCamera로 원근감 있는 아이소메트릭 뷰 */}
            <CameraSetup />
            
            {/* 조명 - 그림자가 잘 보이도록 강화 */}
          {/* 환경맵 - 리얼한 반사와 조명 */}
          <Environment preset="sunset">
            <Lightformer
              form="rect"
              intensity={1}
              color="white"
              scale={[10, 5]}
              target={[0, 0, 0]}
            />
          </Environment>
          
          {/* 바닥 그리드 */}
          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            infiniteGrid
            cellSize={1}
            cellThickness={0.5}
            cellColor="#888888"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#666666"
            fadeDistance={30}
            fadeStrength={1}
          />
          
          {/* 기본 환경 조명 - 그림자가 잘 보이도록 낮게 설정 */}
          <ambientLight intensity={0.3} />
          
          {/* 메인 태양광 (사선으로 비추는 빛) - 그림자 생성 */}
          <directionalLight
            position={[15, 12, 10]}
            intensity={2.5}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-bias={-0.0001}
          />
          
          {/* 보조 태양광 (반대편 사선에서) - 그림자 없이 채우기용 */}
          <directionalLight
            position={[-10, 10, -8]}
            intensity={0.8}
            color="#FFE5B4"
          />
          
          {/* 포인트 라이트 1 - 따뜻한 빛 */}
          <pointLight
            position={[-5, 8, -5]}
            intensity={1.5}
            color="#FFE5B4"
            distance={30}
            decay={1.5}
            castShadow
          />
          
          {/* 포인트 라이트 2 - 차가운 빛 */}
          <pointLight
            position={[5, 8, 5]}
            intensity={1.2}
            color="#B8E6FF"
            distance={30}
            decay={1.5}
          />
          
          {/* 포인트 라이트 3 - 중앙 위쪽 */}
          <pointLight
            position={[0, 10, 0]}
            intensity={1.8}
            color="#FFFFFF"
            distance={40}
            decay={1.5}
            castShadow
          />
          
          {/* 스팟 라이트 - 특정 영역 강조 */}
          <spotLight
            position={[0, 15, 0]}
            angle={0.4}
            penumbra={0.3}
            intensity={2.0}
            castShadow
            color="#FFFFFF"
            distance={40}
            decay={1.5}
          />
          
          {/* 방 구조 */}
          <RoomContent 
            onObjectClick={useCallback((objectId) => {
              setSelectedObject(objectId)
              // 클릭 시 정보 패널만 표시 (모달은 제품 상세보기 버튼 클릭 시 표시)
            }, [])} 
            skipCameraAnimation={false} 
          />
          
          {/* 오빗 컨트롤 */}
          <OrbitControlsWrapper />
          </Suspense>
        </CameraControlProvider>
      </Canvas>
      
      {/* 객체 정보 패널 (오른쪽) - 객체 클릭 시 바로 표시, 모달 열리면 숨김 */}
      {!showModal && (
        <ObjectInfoPanel
          objectInfo={useMemo(() => selectedObject ? { ...objectInfoMap[selectedObject], id: selectedObject } : null, [selectedObject, objectInfoMap])}
          onClose={useCallback(() => setSelectedObject(null), [])}
          onOpenModal={useCallback(() => setShowModal(true), [])}
        />
      )}
      
      {/* 객체 뷰어 (중앙) - 제품 상세보기 버튼 클릭 시 표시 */}
      {showModal && (
        <ObjectViewer
          objectInfo={useMemo(() => selectedObject ? { ...objectInfoMap[selectedObject], id: selectedObject } : null, [selectedObject, objectInfoMap])}
          onClose={useCallback(() => {
            setShowModal(false)
            // 모달 닫으면 정보 패널도 다시 표시
          }, [])}
        />
      )}
    </div>
  )
})

RoomScene.displayName = 'RoomScene'

export default RoomScene

/**
 * 배경을 투명하게 유지하는 컴포넌트
 */
function BackgroundKeeper() {
  const { scene, gl } = useThree()
  
  useFrame(() => {
    // 매 프레임마다 배경을 투명하게 유지
    scene.background = null
    gl.setClearColor(0x000000, 0)
    // clearColor를 직접 설정
    gl.clearColor(0, 0, 0, 0)
  })
  
  useEffect(() => {
    // 초기 설정
    scene.background = null
    gl.setClearColor(0x000000, 0)
    gl.clearColor(0, 0, 0, 0)
    
    // 렌더링 후에도 배경이 투명하게 유지되도록
    const interval = setInterval(() => {
      scene.background = null
      gl.setClearColor(0x000000, 0)
      gl.clearColor(0, 0, 0, 0)
    }, 100)
    
    return () => clearInterval(interval)
  }, [scene, gl])
  
  return null
}

/**
 * 카메라 설정 컴포넌트
 * 이미지 참고: 낮은 위치에서 방의 코너를 바라보는 각도
 * - 카메라가 바닥에서 약간 위에 위치
 * - 방의 코너를 바라봄 (왼쪽 벽은 정면, 오른쪽 벽은 옆으로)
 * - 바닥면이 적당히 보이지만 많이 보이지는 않음
 * - 원근이 심하지 않음
 */
/**
 * 카메라 설정 컴포넌트 (메모이제이션됨)
 * 초기 마운트 시에만 카메라를 설정하고, 이후에는 카메라 위치를 변경하지 않음
 */
const CameraSetup = memo(function CameraSetup() {
  const { camera, size, gl } = useThree()
  const isInitializedRef = useRef(false)
  const initialSizeRef = useRef(null)
  
  // 부스 전체가 항상 화면에 보이도록 카메라 거리와 FOV 자동 계산
  const calculateCameraSettings = (currentSize) => {
    const targetSize = currentSize || size
    if (!targetSize || targetSize.width === 0 || targetSize.height === 0) {
      // 초기값 (기본 해상도 기준) - 더 멀리 줌아웃
      return {
        position: [11, 4.0, 11],  // 카메라 높이 증가 (2.0 -> 4.0)
        lookAt: [0, 3, 0],
        fov: 32
      }
    }
    
    // 방의 크기: 10x10x6 (width x depth x height)
    const roomSize = 10
    const roomHeight = 6
    
    // 부스 전체를 보기 위한 최소 거리 계산
    const diagonal = Math.sqrt(roomSize * roomSize + roomSize * roomSize)
    const minDistance = diagonal * 1.3 + roomHeight * 0.7
    
    // 아이소메트릭 각도: 바닥에서 조금 더 위에서 촬영하는 각도
    const cameraDistance = minDistance
    const cameraHeight = 4.0  // 바닥에서 더 위로 (2.0 -> 4.0)
    const cameraX = cameraDistance * 0.7
    const cameraZ = cameraDistance * 0.7
    
    // FOV 계산
    const baseFOV = 32
    const screenArea = targetSize.width * targetSize.height
    const referenceArea = 1920 * 1080
    const fovMultiplier = Math.max(0.95, Math.min(1.2, referenceArea / screenArea))
    const fov = baseFOV * fovMultiplier
    
    return {
      position: [cameraX, cameraHeight, cameraZ],
      lookAt: [0, roomHeight * 0.5, 0],
      fov: Math.min(Math.max(fov, 30), 42)
    }
  }
  
  // 초기 카메라 설정만 수행 (한 번만 실행)
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera && !isInitializedRef.current && size.width > 0 && size.height > 0) {
      const settings = calculateCameraSettings(size)
      if (settings) {
        camera.position.set(...settings.position)
        camera.lookAt(...settings.lookAt)
        camera.fov = settings.fov
        camera.aspect = size.width / size.height
        camera.near = 0.1
        camera.far = 500000
        camera.updateProjectionMatrix()
        isInitializedRef.current = true
        initialSizeRef.current = { width: size.width, height: size.height }
      }
    }
  }, [camera, size])
  
  // 화면 크기 변경 시에만 aspect 업데이트 (위치는 유지)
  useEffect(() => {
    if (!isInitializedRef.current) return
    
    const handleResize = () => {
      if (camera instanceof THREE.PerspectiveCamera && gl.domElement) {
        // 화면 크기 변경 시에는 aspect만 업데이트 (카메라 위치는 유지)
        camera.aspect = gl.domElement.width / gl.domElement.height
        camera.updateProjectionMatrix()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [camera, gl])
  
  // 초기 카메라 설정
  const initialSettings = calculateCameraSettings(size)
  
  return (
    <PerspectiveCamera
      makeDefault
      position={initialSettings.position}
      fov={initialSettings.fov}
      near={0.1}
      far={500000}
    />
  )
})

// 카메라 컨트롤 컨텍스트
const CameraControlContext = createContext(null)

// OrbitControls 래퍼 컴포넌트 (ref를 Context에 전달) - 메모이제이션
// 마우스로 직접 카메라 조작 비활성화 (객체 클릭 시에만 카메라 이동)
const OrbitControlsWrapper = memo(function OrbitControlsWrapper() {
  const { controlsRef } = useContext(CameraControlContext) || {}
  
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableRotate={false}
      enableZoom={false}
      target={[0, 3.5, 0]}
      minDistance={5}
      maxDistance={50}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
})

// Context Provider 컴포넌트
function CameraControlProvider({ children, resetCameraRef }) {
  const { camera, size } = useThree()
  const controlsRef = useRef(null)
  const moveToTargetRef = useRef(null)
  
  const resetCameraToInitial = useCallback(() => {
    if (!camera || !(camera instanceof THREE.PerspectiveCamera)) return
    if (!controlsRef?.current) return
    
    // 기존 애니메이션 취소
    if (moveToTargetRef.current) {
      moveToTargetRef.current.kill()
    }
    
    const controls = controlsRef.current
    
    // 초기 카메라 설정 계산 (CameraSetup과 동일한 로직)
    const calculateInitialSettings = () => {
      if (!size || size.width === 0 || size.height === 0) {
        return {
          position: [11, 4.0, 11],  // 카메라 높이 증가 (2.0 -> 4.0)
          lookAt: [0, 3, 0],
          fov: 32
        }
      }
      
      const roomSize = 10
      const roomHeight = 6
      const diagonal = Math.sqrt(roomSize * roomSize + roomSize * roomSize)
      const minDistance = diagonal * 1.3 + roomHeight * 0.7
      const cameraDistance = minDistance
      const cameraHeight = 4.0  // 바닥에서 더 위로 (2.0 -> 4.0)
      const cameraX = cameraDistance * 0.7
      const cameraZ = cameraDistance * 0.7
      
      const baseFOV = 32
      const screenArea = size.width * size.height
      const referenceArea = 1920 * 1080
      const fovMultiplier = Math.max(0.95, Math.min(1.2, referenceArea / screenArea))
      const fov = baseFOV * fovMultiplier
      
      return {
        position: [cameraX, cameraHeight, cameraZ],
        lookAt: [0, roomHeight * 0.5, 0],
        fov: Math.min(Math.max(fov, 30), 42)
      }
    }
    
    const initialSettings = calculateInitialSettings()
    const initialPosition = new THREE.Vector3(...initialSettings.position)
    const initialTarget = new THREE.Vector3(...initialSettings.lookAt)
    
    // GSAP 애니메이션
    moveToTargetRef.current = gsap.timeline({
      onComplete: () => {
        moveToTargetRef.current = null
      },
    })
      .to(camera.position, {
        x: initialPosition.x,
        y: initialPosition.y,
        z: initialPosition.z,
        duration: 1.2,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: initialTarget.x,
          y: initialTarget.y,
          z: initialTarget.z,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            controls.update()
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
      .to(
        camera,
        {
          fov: initialSettings.fov,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
  }, [camera, controlsRef, size])
  
  const moveCameraToTarget = (targetPosition, skipAnimation = false) => {
    if (!camera || !(camera instanceof THREE.PerspectiveCamera)) return
    if (!controlsRef?.current) return
    
    // 기존 애니메이션 취소
    if (moveToTargetRef.current) {
      moveToTargetRef.current.kill()
    }
    
    const controls = controlsRef.current
    
    // MapScene과 동일한 방식: 아이소메트릭 각도 유지
    // 현재 카메라의 아이소메트릭 오프셋 비율 계산
    const currentPosition = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      camera.position.z
    )
    
    // 현재 카메라가 바라보는 중심점 (OrbitControls target 또는 lookAt 지점)
    const currentTarget = new THREE.Vector3(
      controls.target.x,
      controls.target.y,
      controls.target.z
    )
    
    // 현재 카메라 위치에서 타겟까지의 벡터 (아이소메트릭 오프셋)
    const currentOffset = new THREE.Vector3().subVectors(currentPosition, currentTarget)
    
    // currentOffset이 0이거나 너무 작으면 기본 아이소메트릭 오프셋 사용
    let offsetToUse = currentOffset
    if (currentOffset.length() < 0.1) {
      // 기본 아이소메트릭 오프셋 계산 (카메라가 초기화되지 않은 경우)
      const defaultDistance = 15
      const defaultHeight = 0.5
      offsetToUse = new THREE.Vector3(
        defaultDistance * 0.7,
        defaultHeight,
        defaultDistance * 0.7
      )
    }
    
    // 아이소메트릭 각도 비율 유지하면서 거리만 조정 (줌인)
    const zoomRatio = 0.4 // 40% 거리로 줌인
    const newOffset = offsetToUse.clone().multiplyScalar(zoomRatio)
    
    // 새로운 카메라 위치: 객체 위치 + 조정된 오프셋
    const newPosition = new THREE.Vector3(...targetPosition).add(newOffset)
    
    // OrbitControls의 target을 객체 위치로 설정 (센터로 오게)
    const targetControlsTarget = {
      x: targetPosition[0],
      y: targetPosition[1],
      z: targetPosition[2],
    }
    
    // 애니메이션 스킵 옵션이 있으면 즉시 이동
    if (skipAnimation) {
      camera.position.set(newPosition.x, newPosition.y, newPosition.z)
      controls.target.set(targetControlsTarget.x, targetControlsTarget.y, targetControlsTarget.z)
      controls.update()
      camera.updateProjectionMatrix()
      return
    }
    
    // GSAP 애니메이션
    moveToTargetRef.current = gsap.timeline({
      onComplete: () => {
        moveToTargetRef.current = null
      },
    })
      .to(camera.position, {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
        duration: 1.2,
        ease: 'power2.inOut',
      })
      .to(
        controls.target,
        {
          x: targetControlsTarget.x,
          y: targetControlsTarget.y,
          z: targetControlsTarget.z,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => {
            controls.update()
            camera.updateProjectionMatrix()
          },
        },
        0 // 동시에 시작
      )
  }
  
  // resetCameraRef에 함수 할당
  useEffect(() => {
    if (resetCameraRef) {
      resetCameraRef.current = resetCameraToInitial
    }
    return () => {
      if (resetCameraRef) {
        resetCameraRef.current = null
      }
    }
  }, [resetCameraRef, resetCameraToInitial])
  
  return (
    <CameraControlContext.Provider value={{ moveCameraToTarget, controlsRef, resetCameraToInitial }}>
      {children}
    </CameraControlContext.Provider>
  )
}

/**
 * 호버 가능한 Box 컴포넌트 (outline 효과 포함)
 */
const HoverableBox = memo(function HoverableBox({ args, position, color, opacity, transparent, children, objectId, onObjectClick, skipCameraAnimation, ...props }) {
  const [hovered, setHovered] = useState(false)
  const { moveCameraToTarget, controlsRef } = useContext(CameraControlContext) || {}
  
  const handleClick = (e) => {
    e.stopPropagation()
    if (moveCameraToTarget && position) {
      // 객체의 중심 위치 계산 (Box의 position이 중심이므로 그대로 사용)
      const objectCenter = Array.isArray(position) ? position : [position.x || 0, position.y || 0, position.z || 0]
      moveCameraToTarget(objectCenter, skipCameraAnimation)
    }
    // 객체 정보 패널 표시
    if (onObjectClick && objectId) {
      onObjectClick(objectId)
    }
  }
  
  return (
    <Box 
      args={args} 
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={handleClick}
      {...props}
    >
      <meshStandardMaterial color={color} opacity={opacity} transparent={transparent} />
      {hovered && (
        <Outlines 
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
      {children}
    </Box>
  )
})

/**
 * 개별 메시 컴포넌트 (outline 효과 포함)
 */
const MeshWithOutline = memo(function MeshWithOutline({ mesh, isHovered, onPointerEnter, onPointerLeave, onClick }) {
  const meshRef = useRef()
  
  useEffect(() => {
    if (!meshRef.current) return
    
    const currentMesh = meshRef.current
    
    // 이벤트 리스너 추가
    currentMesh.addEventListener('pointerenter', onPointerEnter)
    currentMesh.addEventListener('pointerleave', onPointerLeave)
    currentMesh.addEventListener('click', onClick)
    
    return () => {
      currentMesh.removeEventListener('pointerenter', onPointerEnter)
      currentMesh.removeEventListener('pointerleave', onPointerLeave)
      currentMesh.removeEventListener('click', onClick)
    }
  }, [onPointerEnter, onPointerLeave, onClick])
  
  // 메시의 위치, 회전, 스케일을 부모로부터 가져옴
  const position = useMemo(() => {
    const pos = new THREE.Vector3()
    mesh.getWorldPosition(pos)
    return [pos.x, pos.y, pos.z]
  }, [mesh])
  
  const rotation = useMemo(() => {
    const quat = new THREE.Quaternion()
    mesh.getWorldQuaternion(quat)
    const euler = new THREE.Euler().setFromQuaternion(quat)
    return [euler.x, euler.y, euler.z]
  }, [mesh])
  
  const scale = useMemo(() => {
    const scl = new THREE.Vector3()
    mesh.getWorldScale(scl)
    return [scl.x, scl.y, scl.z]
  }, [mesh])
  
  return (
    <mesh
      ref={meshRef}
      geometry={mesh.geometry}
      material={mesh.material}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow
      receiveShadow
    >
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </mesh>
  )
})

/**
 * 호버 가능한 3D 객체 컴포넌트 (outline 효과 포함)
 */
const HoverableObject = memo(function HoverableObject({ 
  objectId, 
  position, 
  rotation, 
  scale, 
  renderFunction,
  isHovered, 
  onPointerEnter, 
  onPointerLeave, 
  onClick 
}) {
  const groupRef = useRef()
  
  return (
    <group 
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {renderFunction(isHovered)}
    </group>
  )
})

/**
 * 3D 객체 렌더링 함수들 (isHovered prop 추가)
 */
const renderDesk = (isHovered = false) => (
  <group position={[0, 0.05, 0]}>
    <Box args={[3, 0.1, 1.5]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="white" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[3, 0.1, 0.05]} position={[0, -0.05, 0.2]} castShadow receiveShadow>
      <meshStandardMaterial color="#E8D5B7" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderMonitor = (isHovered = false) => (
  <Box args={[0.8, 0.6, 0.1]} position={[0, 0.3, 0]} castShadow receiveShadow>
    <meshStandardMaterial color="#2C2C2C" />
    {isHovered && (
      <Outlines
        thickness={10}
        color="white"
        screenspace={false}
        opacity={1}
        transparent={false}
      />
    )}
  </Box>
)

const renderArcade = (isHovered = false) => (
  <group position={[0, 1, 0]}>
    <Box args={[1, 2, 0.8]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FF8C42" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[1.2, 0.3, 0.9]} position={[0, 1.15, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FF8C42" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.3, 0.3, 0.3]} position={[-0.3, 0.5, 0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#4ECDC4" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderChair = (isHovered = false) => (
  <group position={[0, 0.5, 0]}>
    <Box args={[0.6, 1, 0.6]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FF8C42" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.6, 0.1, 0.6]} position={[0, 0.55, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="white" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderBookshelf = (isHovered = false) => (
  <group position={[0, 1.5, 0]}>
    <Box args={[0.8, 2, 0.4]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.8, 0.05, 0.4]} position={[0, 0.6, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#654321" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.8, 0.05, 0.4]} position={[0, -0.6, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#654321" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderLamp = (isHovered = false) => (
  <group position={[0, 0.8, 0]}>
    <Box args={[0.1, 0.8, 0.1]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#2C2C2C" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.4, 0.1, 0.4]} position={[0, 0.45, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#FFD700" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderTable = (isHovered = false) => (
  <group position={[0, 0.4, 0]}>
    <Box args={[1.5, 0.1, 1]} position={[0, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#D2691E" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[-0.7, -0.25, -0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[0.7, -0.25, -0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[-0.7, -0.25, 0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 0.4, 0.05]} position={[0.7, -0.25, 0.45]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

const renderShelf = (isHovered = false) => (
  <group position={[0, 1, 0]}>
    <Box args={[1.2, 0.05, 0.5]} position={[0, 0.5, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#A0522D" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[1.2, 0.05, 0.5]} position={[0, -0.5, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#A0522D" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 1, 0.5]} position={[-0.575, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
    <Box args={[0.05, 1, 0.5]} position={[0.575, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#8B4513" />
      {isHovered && (
        <Outlines
          thickness={10}
          color="white"
          screenspace={false}
          opacity={1}
          transparent={false}
        />
      )}
    </Box>
  </group>
)

/**
 * GLB 모델 로더 컴포넌트
 * hover 시 아웃라인, 클릭 시 줌인 및 모달 표시
 */
const ShowRoomModel = memo(function ShowRoomModel({ onObjectClick }) {
  const [hoveredMeshUuid, setHoveredMeshUuid] = useState(null)
  const [hoveredObjectId, setHoveredObjectId] = useState(null)
  const { moveCameraToTarget } = useContext(CameraControlContext) || {}
  const meshesRef = useRef([])
  
  // useGLTF Hook은 항상 같은 순서로 호출되어야 합니다 (Hook 규칙 준수)
  // useGLTF는 Suspense를 사용하므로 로딩 중일 때 컴포넌트가 일시 중단될 수 있습니다
  // 하지만 모든 Hook은 일시 중단 전에 호출되어야 합니다
  // useGLTF가 로딩 중이면 Promise를 던져 Suspense가 처리하므로, 여기서는 항상 scene이 있습니다
  const { scene: roomScene } = useGLTF('/models/show_room2.glb')
  
  // 모델을 복제하여 사용 (원본을 수정하지 않도록)
  const clonedScene = useMemo(() => {
    if (!roomScene) {
      console.warn('방 모델이 로드되지 않았습니다.')
      return null
    }
      
    console.log('GLB 모델 로드 성공:', { room: roomScene })
    
    // 부스 모델 복제
    const roomClone = roomScene.clone(true) // 깊은 복사로 매터리얼/텍스처도 복사
    
    // 부스 모델의 바운딩 박스 계산
    const roomBox = new THREE.Box3().setFromObject(roomClone)
    const roomCenter = roomBox.getCenter(new THREE.Vector3())
    const roomSize = roomBox.getSize(new THREE.Vector3())
    
    console.log('부스 모델 바운딩 박스:', { center: roomCenter, size: roomSize })
    
    // 부스 모델을 원점으로 이동
    roomClone.position.sub(roomCenter)
    
    // 부스 모델을 위로 올림
    roomClone.position.y += 2
    
    // 부스 모델 스케일 설정
    roomClone.scale.setScalar(1.5)
    
    console.log('부스 모델 위치/스케일 적용 완료:', { 
      position: roomClone.position, 
      scale: roomClone.scale 
    })
    
    // 모든 메시 추출 및 원본 메시 숨기기
    meshesRef.current = []
    roomClone.traverse((child) => {
      if (child.isMesh) {
        meshesRef.current.push(child)
        // 원본 메시는 숨김 (개별 메시로 렌더링할 예정)
        child.visible = false
        // 그림자 속성 추가
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    return roomClone
  }, [roomScene])
  
  // 호버 이벤트 핸들러 (GLB 메시용)
  const handlePointerEnter = useCallback((e) => {
    e.stopPropagation()
    if (e.object && e.object.isMesh) {
      setHoveredMeshUuid(e.object.uuid)
      // 마우스 커서 변경
      document.body.style.cursor = 'pointer'
    }
  }, [])
  
  const handlePointerLeave = useCallback((e) => {
    if (e.object && e.object.isMesh) {
      setHoveredMeshUuid(null)
      document.body.style.cursor = 'default'
    }
  }, [])
  
  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (e.object && e.object.isMesh) {
      // 클릭한 메시의 월드 위치 계산
      const worldPosition = new THREE.Vector3()
      e.object.getWorldPosition(worldPosition)
      
      console.log('메시 클릭:', { 
        meshName: e.object.name,
        worldPosition: worldPosition 
      })
      
      // 카메라 줌인
      if (moveCameraToTarget) {
        moveCameraToTarget([worldPosition.x, worldPosition.y, worldPosition.z], false)
      }
      
      // 정보 모달 표시
      if (onObjectClick) {
        // 메시 이름을 기반으로 objectId 결정
        const meshName = e.object.name?.toLowerCase() || 'unknown'
        let objectId = 'desk' // 기본값
        
        if (meshName.includes('desk') || meshName.includes('table')) {
          objectId = 'desk'
        } else if (meshName.includes('monitor') || meshName.includes('screen') || meshName.includes('tv')) {
          objectId = 'monitor'
        } else if (meshName.includes('arcade') || meshName.includes('game')) {
          objectId = 'arcade'
        } else if (meshName.includes('chair') || meshName.includes('seat')) {
          objectId = 'chair'
        }
        
        onObjectClick(objectId)
      }
    }
  }, [moveCameraToTarget, onObjectClick])
  
  // 3D 객체용 호버/클릭 핸들러
  const handleObjectPointerEnter = useCallback((objectId) => (e) => {
    e.stopPropagation()
    setHoveredObjectId(objectId)
    document.body.style.cursor = 'pointer'
  }, [])
  
  const handleObjectPointerLeave = useCallback((objectId) => (e) => {
    e.stopPropagation()
    setHoveredObjectId(null)
    document.body.style.cursor = 'default'
  }, [])
  
  const handleObjectClick = useCallback((objectId, position) => (e) => {
    e.stopPropagation()
    
    console.log('3D 객체 클릭:', { objectId, position })
    
    // 카메라 줌인
    if (moveCameraToTarget && position) {
      moveCameraToTarget(position, false)
    }
    
    // 정보 모달 표시
    if (onObjectClick) {
      onObjectClick(objectId)
    }
  }, [moveCameraToTarget, onObjectClick])
  
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])
  
  // 모든 Hook을 호출한 후 조건부 렌더링
  if (!clonedScene) {
    console.warn('GLB 모델 복제 실패')
    return null
  }
  
  // 메시가 없는 경우 primitive로 렌더링
  if (meshesRef.current.length === 0) {
    return <primitive object={clonedScene} />
  }
  
  // 각 메시를 개별적으로 렌더링하여 outline 효과 적용
  return (
    <>
      {/* 메시가 아닌 다른 객체들 (Group, Light 등) 렌더링 */}
      <primitive object={clonedScene} />
        {/* 각 메시를 개별적으로 렌더링하여 outline 효과 적용 */}
        {meshesRef.current.map((mesh) => (
          <MeshWithOutline
            key={mesh.uuid}
            mesh={mesh}
            isHovered={hoveredMeshUuid === mesh.uuid}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
          />
        ))}
        
        {/* 기존 3D 객체들을 부스 안에 배치 - 높이를 더 위로 올림 */}
        {/* 책상 - 중앙 앞쪽 */}
        <HoverableObject
          objectId="desk"
          position={[0, 2.5, -2]}
          rotation={[0, 0, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderDesk}
          isHovered={hoveredObjectId === 'desk'}
          onPointerEnter={handleObjectPointerEnter('desk')}
          onPointerLeave={handleObjectPointerLeave('desk')}
          onClick={handleObjectClick('desk', [0, 3, -2])}
        />
        
        {/* 모니터 - 책상 위 */}
        <HoverableObject
          objectId="monitor"
          position={[0, 3.3, -2]}
          rotation={[0, 0, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderMonitor}
          isHovered={hoveredObjectId === 'monitor'}
          onPointerEnter={handleObjectPointerEnter('monitor')}
          onPointerLeave={handleObjectPointerLeave('monitor')}
          onClick={handleObjectClick('monitor', [0, 3.6, -2])}
        />
        
        {/* 아케이드 기계 - 오른쪽 */}
        <HoverableObject
          objectId="arcade"
          position={[3, 2.5, 0]}
          rotation={[0, -Math.PI / 4, 0]}
          scale={[0.6, 0.6, 0.6]}
          renderFunction={renderArcade}
          isHovered={hoveredObjectId === 'arcade'}
          onPointerEnter={handleObjectPointerEnter('arcade')}
          onPointerLeave={handleObjectPointerLeave('arcade')}
          onClick={handleObjectClick('arcade', [3, 4, 0])}
        />
        
        {/* 의자 - 책상 앞 */}
        <HoverableObject
          objectId="chair"
          position={[0, 2.5, -4]}
          rotation={[0, 0, 0]}
          scale={[0.6, 0.6, 0.6]}
          renderFunction={renderChair}
          isHovered={hoveredObjectId === 'chair'}
          onPointerEnter={handleObjectPointerEnter('chair')}
          onPointerLeave={handleObjectPointerLeave('chair')}
          onClick={handleObjectClick('chair', [0, 3, -4])}
        />
        
        {/* 책장 - 왼쪽 벽 */}
        <HoverableObject
          objectId="bookshelf"
          position={[-3.5, 2.5, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderBookshelf}
          isHovered={hoveredObjectId === 'bookshelf'}
          onPointerEnter={handleObjectPointerEnter('bookshelf')}
          onPointerLeave={handleObjectPointerLeave('bookshelf')}
          onClick={handleObjectClick('bookshelf', [-3.5, 4, 0])}
        />
        
        {/* 램프 - 책상 옆 */}
        <HoverableObject
          objectId="lamp"
          position={[1.5, 2.5, -2]}
          rotation={[0, 0, 0]}
          scale={[0.6, 0.6, 0.6]}
          renderFunction={renderLamp}
          isHovered={hoveredObjectId === 'lamp'}
          onPointerEnter={handleObjectPointerEnter('lamp')}
          onPointerLeave={handleObjectPointerLeave('lamp')}
          onClick={handleObjectClick('lamp', [1.5, 3.3, -2])}
        />
        
        {/* 테이블 - 왼쪽 */}
        <HoverableObject
          objectId="table"
          position={[-2, 2.5, 2]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderTable}
          isHovered={hoveredObjectId === 'table'}
          onPointerEnter={handleObjectPointerEnter('table')}
          onPointerLeave={handleObjectPointerLeave('table')}
          onClick={handleObjectClick('table', [-2, 2.9, 2])}
        />
        
        {/* 선반 - 뒤쪽 벽 */}
        <HoverableObject
          objectId="shelf"
          position={[0, 3.5, 3]}
          rotation={[0, 0, 0]}
          scale={[0.5, 0.5, 0.5]}
          renderFunction={renderShelf}
          isHovered={hoveredObjectId === 'shelf'}
          onPointerEnter={handleObjectPointerEnter('shelf')}
          onPointerLeave={handleObjectPointerLeave('shelf')}
          onClick={handleObjectClick('shelf', [0, 4.5, 3])}
        />
      </>
    )
})

ShowRoomModel.displayName = 'ShowRoomModel'

// 모델 프리로드 (성능 최적화)
// useGLTF는 자동으로 Draco 압축 해제 및 캐싱 처리
useGLTF.preload('/models/show_room2.glb')

/**
 * 방 내부 컨텐츠 (메모이제이션됨)
 * show_room2.glb 모델 로드 (group 해제, car.glb 제거)
 */
const RoomContent = memo(function RoomContent({ onObjectClick, skipCameraAnimation }) {
  return (
    <Suspense fallback={null}>
      {/* GLB 모델 로드 - group 없이 직접 렌더링 */}
      <ShowRoomModel onObjectClick={onObjectClick} />
    </Suspense>
  )
})
