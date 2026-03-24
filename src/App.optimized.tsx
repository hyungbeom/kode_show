import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { gsap } from 'gsap'
import LoadingScreen from './components/LoadingScreen'
import HomePage from './components/HomePage'
import MapHeader from './components/MapHeader'
import SoundControl from './components/SoundControl'
import NavigationUI from './components/NavigationUI'
import ZoneList from './components/ZoneList'
import { useAppMapStore } from './hooks/useMapStore'
import './App.css'

// Lazy loading for heavy components
const MapScene = lazy(() => import('./components/MapScene'))
const RoomScene = lazy(() => import('./components/RoomScene'))
const ZoneInfoPanel = lazy(() => import('./components/ZoneInfoPanel'))

type View = 'loading' | 'home' | 'map' | 'room'

/**
 * KODE Clubs 메인 애플리케이션 (최적화 버전)
 * - Zustand 셀렉터 최적화
 * - 메모이제이션 적용
 * - Lazy loading 적용
 * - 공통 애니메이션 훅 사용
 */
function App() {
  const [currentView, setCurrentView] = useState<View>('loading')
  const [showLoading, setShowLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // 최적화된 Zustand 셀렉터 사용 (한 번에 여러 값 선택)
  const {
    setInitialEntry,
    selectedCompanyId,
    selectedCompanyName,
    setSelectedCompany,
    clearSelectedCompany,
    selectedZone,
    clearSelectedZone,
  } = useAppMapStore()
  
  // 업체 이름 매핑 - useMemo로 메모이제이션
  const companyNames = useMemo<Record<number, string>>(() => ({
    1: 'GreenFi',
    2: 'Aven',
    3: 'TechCorp',
    4: 'DesignStudio',
    5: 'DataLab',
  }), [])
  
  // URL 체크 함수 - useCallback으로 메모이제이션
  const checkUrl = useCallback(() => {
    const path = window.location.pathname
    if (path.startsWith('/room/')) {
      const companyId = parseInt(path.split('/room/')[1])
      if (companyId && companyNames[companyId]) {
        setSelectedCompany(companyId, companyNames[companyId])
        setCurrentView('loading')
        setShowLoading(true)
        
        // 로딩 화면 페이드 인 애니메이션
        setTimeout(() => {
          const loadingElement = document.querySelector('.loading-screen')
          if (loadingElement) {
            gsap.fromTo(
              loadingElement,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 0.5,
                ease: 'power2.out',
              }
            )
          }
        }, 50)
      }
    } else if (path === '/map') {
      setCurrentView('map')
    }
  }, [companyNames, setSelectedCompany])
  
  // URL에서 초기 상태 읽기 (새로고침 시 방 유지)
  useEffect(() => {
    checkUrl()
    
    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', checkUrl)
    return () => window.removeEventListener('popstate', checkUrl)
  }, [checkUrl])
  
  // 업체 선택 시 로딩 화면 표시 (페이드 애니메이션 포함)
  useEffect(() => {
    if (selectedCompanyId && currentView === 'map') {
      setIsTransitioning(true)
      
      // 맵 화면 페이드 아웃 애니메이션
      const mapElement = document.querySelector('.app-container')
      if (mapElement) {
        gsap.to(mapElement, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            setShowLoading(true)
            setIsTransitioning(false)
            
            // 로딩 화면 페이드 인 애니메이션
            setTimeout(() => {
              const loadingElement = document.querySelector('.loading-screen')
              if (loadingElement) {
                gsap.fromTo(
                  loadingElement,
                  { opacity: 0 },
                  {
                    opacity: 1,
                    duration: 0.5,
                    ease: 'power2.out',
                  }
                )
              }
            }, 50)
          },
        })
      } else {
        setShowLoading(true)
        setIsTransitioning(false)
      }
    }
  }, [selectedCompanyId, currentView])
  
  // 로딩 완료 핸들러 - useCallback으로 메모이제이션
  const handleLoadingComplete = useCallback(() => {
    if (showLoading && selectedCompanyId) {
      setIsTransitioning(true)
      
      const loadingElement = document.querySelector('.loading-screen')
      if (loadingElement) {
        gsap.to(loadingElement, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentView('room')
            setShowLoading(false)
            
            setTimeout(() => {
              const roomElement = document.querySelector('[data-room-scene]')
              if (roomElement) {
                gsap.fromTo(
                  roomElement,
                  { opacity: 0 },
                  {
                    opacity: 1,
                    duration: 0.8,
                    ease: 'power2.out',
                    onComplete: () => {
                      setIsTransitioning(false)
                    },
                  }
                )
              } else {
                setIsTransitioning(false)
              }
            }, 50)
          },
        })
      } else {
        setCurrentView('room')
        setShowLoading(false)
        setIsTransitioning(false)
      }
    } else {
      setCurrentView('home')
    }
  }, [showLoading, selectedCompanyId])
  
  // Enter 핸들러 - useCallback으로 메모이제이션
  const handleEnter = useCallback(() => {
    setIsTransitioning(true)
    
    const homeElement = document.querySelector('.home-page')
    if (homeElement) {
      gsap.to(homeElement, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentView('map')
          setInitialEntry(true)
          
          setTimeout(() => {
            const mapElement = document.querySelector('.app-container')
            if (mapElement) {
              gsap.fromTo(
                mapElement,
                { opacity: 0 },
                {
                  opacity: 1,
                  duration: 0.8,
                  ease: 'power2.out',
                  onComplete: () => {
                    setIsTransitioning(false)
                  },
                }
              )
            } else {
              setIsTransitioning(false)
            }
          }, 50)
        },
      })
    } else {
      setCurrentView('map')
      setInitialEntry(true)
      setIsTransitioning(false)
    }
  }, [setInitialEntry])
  
  // 맵 닫기 핸들러
  const handleCloseMap = useCallback(() => {
    setCurrentView('home')
    window.history.pushState({}, '', '/')
  }, [])
  
  // 클럽으로 돌아가기 핸들러
  const handleBackToClub = useCallback(() => {
    setCurrentView('home')
    window.history.pushState({}, '', '/')
  }, [])
  
  // 방에서 뒤로가기 핸들러
  const handleBackFromRoom = useCallback(() => {
    setIsTransitioning(true)
    
    const roomElement = document.querySelector('[data-room-scene]')
    if (roomElement) {
      gsap.to(roomElement, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentView('map')
          clearSelectedCompany()
          window.history.pushState({}, '', '/')
          
          setTimeout(() => {
            const mapElement = document.querySelector('.app-container')
            if (mapElement) {
              gsap.fromTo(
                mapElement,
                { opacity: 0 },
                {
                  opacity: 1,
                  duration: 0.8,
                  ease: 'power2.out',
                  onComplete: () => {
                    setIsTransitioning(false)
                  },
                }
              )
            } else {
              setIsTransitioning(false)
            }
          }, 50)
        },
      })
    } else {
      setCurrentView('map')
      clearSelectedCompany()
      window.history.pushState({}, '', '/')
      setIsTransitioning(false)
    }
  }, [clearSelectedCompany])
  
  // 로딩 화면 (초기 로딩 또는 업체 클릭 후 로딩)
  if (currentView === 'loading' || showLoading) {
    const isInitialLoading = currentView === 'loading' && !showLoading
    return <LoadingScreen onComplete={handleLoadingComplete} isInitial={isInitialLoading} />
  }
  
  // 홈페이지
  if (currentView === 'home') {
    return <HomePage onEnter={handleEnter} />
  }
  
  // 방 씬
  if (currentView === 'room') {
    return (
      <Suspense fallback={<div>Loading room...</div>}>
        <RoomScene companyName={selectedCompanyName || 'Company'} onBack={handleBackFromRoom} />
      </Suspense>
    )
  }
  
  // 지도 화면
  return (
    <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
      <Suspense fallback={<div>Loading map...</div>}>
        {/* 3D 지도 씬 */}
        <MapScene />
      </Suspense>
      
      {/* 상단 헤더 */}
      <MapHeader onClose={handleCloseMap} onBackToClub={handleBackToClub} />
      
      {/* 하단 왼쪽 사운드 컨트롤 */}
      <SoundControl />
      
      {/* 하단 중앙 네비게이션 UI */}
      <NavigationUI />
      
      {/* 우측 하단 Zone 리스트 버튼 및 패널 */}
      <ZoneList />
      
      {/* Zone 정보 패널 (화면 중앙 모달) */}
      {selectedZone && (
        <Suspense fallback={null}>
          <ZoneInfoPanel
            zoneId={selectedZone}
            onClose={clearSelectedZone}
          />
        </Suspense>
      )}
    </div>
  )
}

export default App
