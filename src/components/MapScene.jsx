import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, memo, useState } from 'react'
import { Sky as SkyImpl, Environment, Lightformer } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { EcctrlJoystick } from 'ecctrl'
import MapModel from './MapModel'
import CameraSystem from './CameraSystem'

/**
 * KODE Clubs 지도 씬 컴포넌트
 * 건물을 zone 구조물로 대체하고, 구역으로 사용하므로 높이를 낮게 설정
 * 구역을 넓게 잡고 겹치지 않도록 배치
 */
const MapScene = memo(function MapScene() {
  const [isMobile, setIsMobile] = useState(false)
  
  // 모바일 디바이스 감지
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && window.innerHeight <= 1024)
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])
  
  // 배경 투명도 유지 컴포넌트
  const BackgroundTransparency = memo(function BackgroundTransparency() {
    const { gl, scene } = useThree()
    
    useEffect(() => {
      // 초기 마운트 시 투명 배경 설정
      gl.setClearColor(0x000000, 0)
      scene.background = null
      gl.domElement.style.backgroundColor = 'transparent'
    }, [gl, scene])
    
    useFrame(() => {
      // 매 프레임마다 배경을 투명하게 유지
      gl.setClearColor(0x000000, 0)
      if (scene.background !== null) {
        scene.background = null
      }
    })
    
    return null
  })
  
  // SceneContent 컴포넌트 - useMemo로 메모이제이션
  const SceneContent = useMemo(() => {
    const Content = () => (
      <>
        {/* 배경 투명도 유지 */}
        <BackgroundTransparency />
        
        {/* 배경을 투명하게 설정하여 div의 그라데이션이 보이도록 */}
        <color attach="background" args={['transparent']} />
        
        {/* 카메라 시스템 - 리렌더링 영향 없이 독립적으로 관리 */}
        <CameraSystem />
        
        {/* 조명 설정 - 그림자가 잘 보이도록 강화 */}
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
        
        {/* 기본 환경 조명 - 그림자가 잘 보이도록 낮게 설정 */}
        <ambientLight intensity={0.3} />
        
        {/* 메인 태양광 (사선으로 비추는 빛) - 그림자 생성 */}
        <directionalLight
          position={[80, 60, 80]}
          intensity={2.5}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={500}
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
          shadow-bias={-0.0005}
        />
        
        {/* 보조 태양광 (반대편 사선에서) - 그림자 없이 채우기용 */}
        <directionalLight
          position={[-60, 50, -60]}
          intensity={0.6}
          color="#FFE5B4"
        />
        
        {/* 포인트 라이트 1 - 따뜻한 빛 */}
        <pointLight
          position={[30, 50, 30]}
          intensity={1.5}
          color="#FFE5B4"
          distance={150}
          decay={1.5}
          castShadow
        />
        
        {/* 포인트 라이트 2 - 차가운 빛 */}
        <pointLight
          position={[-30, 50, -30]}
          intensity={1.2}
          color="#B8E6FF"
          distance={150}
          decay={1.5}
        />
        
        {/* 포인트 라이트 3 - 중앙 위쪽 */}
        <pointLight
          position={[0, 60, 0]}
          intensity={1.8}
          color="#FFFFFF"
          distance={200}
          decay={1.5}
          castShadow
        />
        
        {/* 스팟 라이트 - 특정 영역 강조 */}
        <spotLight
          position={[0, 120, 0]}
          angle={0.4}
          penumbra={0.3}
          intensity={2.0}
          castShadow
          color="#FFFFFF"
          distance={200}
          decay={1.5}
        />
        
        {/* 3D 지도 모델 - world.glb + 캐릭터 */}
        <Suspense fallback={null}>
          <MapModel />
        </Suspense>
      </>
    )
    return Content
  }, [])
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Sky 배경 - 항상 보이도록 Canvas 뒤에 배치 (위로 갈수록 #CCFFCC, 아래로 갈수록 파란색) */}
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'linear-gradient(to bottom, #CCFFCC 0%, #B8E6CC 20%, #87CEEB 45%, #5F9EA0 70%, #4682B4 100%)', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        zIndex: 0,
        pointerEvents: 'none' // 클릭 이벤트는 Canvas로 전달
      }} />
      <Canvas
        shadows
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'transparent',
        }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 2]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          scene.background = null
          gl.clearColor(0, 0, 0, 0)
          gl.domElement.style.backgroundColor = 'transparent'
        }}
      >
        <Physics gravity={[0, -9.81, 0]} debug={false}>
          <SceneContent />
        </Physics>
      </Canvas>
      {/* 조이스틱 - 모바일 디바이스일 때만 상단에 배치 */}
      {isMobile && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
          }}
        >
        </div>
      )}
    </div>
  )
})

MapScene.displayName = 'MapScene'

export default MapScene
