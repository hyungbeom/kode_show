import { useEffect, useRef, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls, Environment, Sky as SkyImpl, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import { Box } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import './ObjectViewer.css'

/**
 * 객체 뷰어 컴포넌트
 * 왼쪽에 나타나는 3D 객체 뷰어 모달
 */
const ObjectViewer = memo(function ObjectViewer({ objectInfo, onClose }) {
  const containerRef = useRef(null)
  const prevObjectIdRef = useRef(null)
  const isVisibleRef = useRef(false)

  useEffect(() => {
    if (objectInfo) {
      // 모달이 이미 열려있으면 애니메이션 없이 내용만 업데이트
      if (isVisibleRef.current) {
        prevObjectIdRef.current = objectInfo.id
        return
      }
      
      // 처음 표시되는 경우만 애니메이션
      gsap.fromTo(
        containerRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
        }
      )
      
      prevObjectIdRef.current = objectInfo.id
      isVisibleRef.current = true
    } else {
      // 모달 숨김 애니메이션
      if (containerRef.current && isVisibleRef.current) {
        gsap.to(containerRef.current, {
          scale: 0.8,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        })
        isVisibleRef.current = false
        prevObjectIdRef.current = null
      }
    }
  }, [objectInfo])

  if (!objectInfo) return null

  // 자동 회전하는 객체 래퍼 컴포넌트
  function RotatingObject({ children }) {
    const groupRef = useRef()
    
    useFrame((state, delta) => {
      if (groupRef.current) {
        // Y축을 중심으로 천천히 회전 (1회전에 약 10초)
        groupRef.current.rotation.y += delta * 0.1
      }
    })
    
    return <group ref={groupRef}>{children}</group>
  }

  // 객체 타입에 따른 3D 모델 렌더링
  const renderObject = () => {
    switch (objectInfo.id) {
      case 'desk':
        return (
          <RotatingObject>
            <group position={[0, 0.05, 0]}>
              <Box args={[3, 0.1, 1.5]} position={[0, 0, 0]}>
                <meshStandardMaterial color="white" />
              </Box>
              <Box args={[3, 0.1, 0.05]} position={[0, -0.05, 0.2]}>
                <meshStandardMaterial color="#E8D5B7" />
              </Box>
            </group>
          </RotatingObject>
        )
      case 'monitor':
        return (
          <RotatingObject>
            <Box args={[0.8, 0.6, 0.1]} position={[0, 0.3, 0]}>
              <meshStandardMaterial color="#2C2C2C" />
            </Box>
          </RotatingObject>
        )
      case 'arcade':
        return (
          <RotatingObject>
            <group position={[0, 1, 0]}>
              <Box args={[1, 2, 0.8]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#FF8C42" />
              </Box>
              <Box args={[1.2, 0.3, 0.9]} position={[0, 1.15, 0]}>
                <meshStandardMaterial color="#FF8C42" />
              </Box>
              <Box args={[0.3, 0.3, 0.3]} position={[-0.3, 0.5, 0.45]}>
                <meshStandardMaterial color="#4ECDC4" />
              </Box>
            </group>
          </RotatingObject>
        )
      case 'chair':
        return (
          <RotatingObject>
            <group position={[0, 0.5, 0]}>
              <Box args={[0.6, 1, 0.6]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#FF8C42" />
              </Box>
              <Box args={[0.6, 0.1, 0.6]} position={[0, 0.55, 0]}>
                <meshStandardMaterial color="white" />
              </Box>
            </group>
          </RotatingObject>
        )
      default:
        return (
          <RotatingObject>
            <Box args={[1, 1, 1]} position={[0, 0.5, 0]}>
              <meshStandardMaterial color="#FF8C42" />
            </Box>
          </RotatingObject>
        )
    }
  }

  return (
    <>
      {/* 뷰어 모달 */}
      <div ref={containerRef} className="object-viewer-container">
        <div className="object-viewer-header">
          <span className="object-viewer-title">3D View</span>
          <button className="object-viewer-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="object-viewer-canvas">
          <Canvas
            camera={{ position: [0, 2, 5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} near={0.1} far={500000} />
              
              {/* Sky 배경 */}
              <SkyImpl 
                distance={450000} 
                sunPosition={[0, 1, 0]} 
                inclination={0.49} 
                azimuth={0.25}
                turbidity={3}
                rayleigh={1}
                mieCoefficient={0.005}
                mieDirectionalG={0.8}
              />
              
              {/* Grid */}
              <Grid
                renderOrder={-1}
                position={[0, 0, 0]}
                infiniteGrid
                cellSize={0.1}
                cellThickness={0.3}
                cellColor="#6f6f6f"
                sectionSize={1}
                sectionThickness={0.8}
                sectionColor="#9d4b4b"
                fadeDistance={25}
                fadeStrength={1}
              />
              
              {/* 조명 */}
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 8, 5]} intensity={0.8} />
              <pointLight position={[-5, 5, -5]} intensity={0.4} />
              
              {/* 객체 렌더링 */}
              {renderObject()}
              
              {/* 오빗 컨트롤 */}
              <OrbitControls
                enablePan={true}
                enableRotate={true}
                enableZoom={true}
                minDistance={2}
                maxDistance={10}
                target={[0, 0.5, 0]}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </>
  )
})

ObjectViewer.displayName = 'ObjectViewer'

export default ObjectViewer
