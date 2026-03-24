import { useState, useEffect } from 'react'
import { gsap } from 'gsap'
import LoadingScreen from './components/LoadingScreen'
import HomePage from './components/HomePage'
import MapScene from './components/MapScene'
import MapHeader from './components/MapHeader'
import SoundControl from './components/SoundControl'
import NavigationUI from './components/NavigationUI'
import RoomScene from './components/RoomScene'
import ZoneInfoPanel from './components/ZoneInfoPanel'
import ZoneList from './components/ZoneList'
import { useMapStore } from './store/useMapStore'
import './App.css'

type View = 'loading' | 'home' | 'map' | 'room'

/**
 * KODE Clubs 메인 애플리케이션
 * 실제 사이트의 전체 플로우를 재현합니다:
 * 1. 로딩 화면
 * 2. 홈페이지 (ENTER 버튼)
 * 3. 지도 화면
 */
function App() {
  const [currentView, setCurrentView] = useState<View>('loading')
  const [showLoading, setShowLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // 모든 Hook을 최상단에서 항상 호출 (조건부 호출 방지)
  const setInitialEntry = useMapStore((state) => state.setInitialEntry)
  const selectedCompanyId = useMapStore((state) => state.selectedCompanyId)
  const selectedCompanyName = useMapStore((state) => state.selectedCompanyName)
  const setSelectedCompany = useMapStore((state) => state.setSelectedCompany)
  const clearSelectedCompany = useMapStore((state) => state.clearSelectedCompany)
  const selectedZone = useMapStore((state) => state.selectedZone)
  const clearSelectedZone = useMapStore((state) => state.clearSelectedZone)
  
  // 업체 이름 매핑 (ID -> 이름)
  const companyNames: Record<number, string> = {
    1: 'GreenFi',
    2: 'Aven',
    3: 'TechCorp',
    4: 'DesignStudio',
    5: 'DataLab',
  }
  
  // URL에서 초기 상태 읽기 (새로고침 시 방 유지)
  useEffect(() => {
    const checkUrl = () => {
      const path = window.location.pathname
      if (path.startsWith('/room/')) {
        const companyId = parseInt(path.split('/room/')[1])
        if (companyId && companyNames[companyId]) {
          setSelectedCompany(companyId, companyNames[companyId])
          // 로딩 화면 표시 후 방 씬으로 이동
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
      } else if (path === '/') {
        // 홈 경로는 초기 로딩 후 처리
      }
    }
    
    checkUrl()
    
    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', checkUrl)
    return () => window.removeEventListener('popstate', checkUrl)
  }, [setSelectedCompany, companyNames])
  
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
            // 페이드 아웃 완료 후 로딩 화면 표시
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
  
  const handleLoadingComplete = () => {
    if (showLoading && selectedCompanyId) {
      // 업체 클릭 후 또는 URL에서 방 읽기 후 로딩 완료 시 방 씬으로 이동
      setIsTransitioning(true)
      
      // 로딩 화면 페이드 아웃 애니메이션
      const loadingElement = document.querySelector('.loading-screen')
      if (loadingElement) {
        gsap.to(loadingElement, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            // 페이드 아웃 완료 후 RoomScene으로 전환
            setCurrentView('room')
            setShowLoading(false)
            
            // RoomScene 페이드 인 애니메이션
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
      // 초기 로딩 완료 시 홈으로 이동
      setCurrentView('home')
    }
  }
  
  const handleEnter = () => {
    setIsTransitioning(true)
    
    // 홈페이지 페이드 아웃 애니메이션
    const homeElement = document.querySelector('.home-page')
    if (homeElement) {
      gsap.to(homeElement, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          // 페이드 아웃 완료 후 맵 화면으로 전환
          setCurrentView('map')
          setInitialEntry(true)
          // URL 변경하지 않음
          
          // 맵 화면 페이드 인 애니메이션
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
      // 홈페이지 요소를 찾을 수 없으면 바로 전환
      setCurrentView('map')
      setInitialEntry(true)
      // URL 변경하지 않음
      setIsTransitioning(false)
    }
  }
  
  const handleCloseMap = () => {
    setCurrentView('home')
    window.history.pushState({}, '', '/')
  }
  
  const handleBackToClub = () => {
    setCurrentView('home')
    window.history.pushState({}, '', '/')
  }
  
  const handleBackFromRoom = () => {
    setIsTransitioning(true)
    
    // 방 씬 페이드 아웃 애니메이션
    const roomElement = document.querySelector('[data-room-scene]')
    if (roomElement) {
      gsap.to(roomElement, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          // 페이드 아웃 완료 후 맵 화면으로 전환
          setCurrentView('map')
          clearSelectedCompany()
          // URL만 /로 변경 (실제 이동 없음)
          window.history.pushState({}, '', '/')
          
          // 맵 화면 페이드 인 애니메이션
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
      // RoomScene 요소를 찾을 수 없으면 바로 전환
      setCurrentView('map')
      clearSelectedCompany()
      // URL만 /로 변경 (실제 이동 없음)
      window.history.pushState({}, '', '/')
      setIsTransitioning(false)
    }
  }
  
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
    return <RoomScene companyName={selectedCompanyName || 'Company'} onBack={handleBackFromRoom} />
  }
  
  // 지도 화면
  return (
    <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
      {/* 3D 지도 씬 */}
      <MapScene />
      
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
        <ZoneInfoPanel
          zoneId={selectedZone}
          onClose={clearSelectedZone}
        />
      )}
    </div>
  )
}

export default App
