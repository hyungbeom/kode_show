import { useState, useEffect, useCallback, lazy, Suspense, useRef, type MutableRefObject } from 'react'
import { gsap } from 'gsap'
import LoadingScreen from './components/LoadingScreen'
import HomePage from './components/HomePage'
import MapHeader from './components/MapHeader'
import SoundControl from './components/SoundControl'
import NavigationUI from './components/NavigationUI'
import ZoneList from './components/ZoneList'
import { useAppMapStore } from './hooks/useMapStore'
import { useVisualViewportCssVars } from './hooks/useVisualViewportCssVars'
import { useMapStore } from './store/useMapStore'
import { COMPANY_NAMES } from './utils/constants'
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
  useVisualViewportCssVars()

  const [currentView, setCurrentView] = useState<View>('loading')
  const [showLoading, setShowLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const showLoadingRef: MutableRefObject<boolean> = useRef(showLoading)
  showLoadingRef.current = showLoading
  
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

  const mapHeroCopyDismissed = useMapStore((s) => s.mapHeroCopyDismissed)
  const triggerBrandFilmCenterView = useMapStore((s) => s.triggerBrandFilmCenterView)
  
  // URL 체크 함수 - useCallback으로 메모이제이션
  const checkUrl = useCallback(() => {
    const path = window.location.pathname
    const roomMatch = path.match(/^\/room\/(\d+)/)
    if (roomMatch) {
      const companyId = parseInt(roomMatch[1], 10)
      if (companyId && COMPANY_NAMES[companyId]) {
        setSelectedCompany(companyId, COMPANY_NAMES[companyId])
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
  }, [setSelectedCompany])
  
  // URL에서 초기 상태 읽기 (새로고침 시 방 유지)
  useEffect(() => {
    checkUrl()
    
    // 브라우저 뒤로가기/앞으로가기 처리
    window.addEventListener('popstate', checkUrl)
    return () => window.removeEventListener('popstate', checkUrl)
  }, [checkUrl])

  // 전환 플래그가 꺼진 뒤에도 GSAP이 남긴 opacity:0이 있으면 맵·UI 전체가 안 보임 → 인라인만 제거해 CSS(또는 정상 값)로 복구
  useEffect(() => {
    if (currentView !== 'map' || isTransitioning) return
    const el = mapContainerRef.current
    if (!el) return
    el.style.removeProperty('opacity')
  }, [currentView, isTransitioning])
  
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
  
  // 로딩 완료 핸들러 — URL·getState() 기준 (showLoading 은 ref 로 최신값, /room/:id 직접 진입 안정화)
  const handleLoadingComplete = useCallback(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    const roomMatch = path.match(/^\/room\/(\d+)/)
    let companyId: number | null = useMapStore.getState().selectedCompanyId

    if (roomMatch) {
      const id = parseInt(roomMatch[1], 10)
      if (id && COMPANY_NAMES[id]) {
        useMapStore.getState().setSelectedCompany(id, COMPANY_NAMES[id])
        companyId = id
      }
    }

    const isValidRoom =
      path.startsWith('/room/') &&
      companyId != null &&
      COMPANY_NAMES[companyId as number] !== undefined

    const fromRoomFlow = showLoadingRef.current

    if (!isValidRoom) {
      setCurrentView('home')
      return
    }

    const goRoom = () => {
      setCurrentView('room')
      setShowLoading(false)
    }

    if (fromRoomFlow) {
      setIsTransitioning(true)
      const loadingElement = document.querySelector('.loading-screen')
      if (loadingElement) {
        gsap.to(loadingElement, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            goRoom()
            /* Room 씬 페이드인은 RoomSceneInner useLayoutEffect 에서 처리 (lazy 로드 시 querySelector 타이밍 버그 방지) */
            setIsTransitioning(false)
          },
        })
      } else {
        goRoom()
        setIsTransitioning(false)
      }
    } else {
      goRoom()
      setIsTransitioning(false)
    }
  }, [])
  
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
          useMapStore.setState({
            mapHeroCopyDismissed: false,
            brandFilmCameraRecenterPending: false,
          })
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
      useMapStore.setState({
        mapHeroCopyDismissed: false,
        brandFilmCameraRecenterPending: false,
      })
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
        <RoomScene
          key={selectedCompanyId ?? 0}
          companyId={selectedCompanyId ?? undefined}
          companyName={selectedCompanyName || 'Company'}
          onBack={handleBackFromRoom}
        />
      </Suspense>
    )
  }
  
  // 지도 화면
  return (
    <div
      ref={mapContainerRef}
      className={`app-container ${isTransitioning ? 'transitioning' : ''}`}
    >
      <Suspense fallback={<div>Loading map...</div>}>
        {/* 3D 지도 씬 */}
        <MapScene />
      </Suspense>

      {!mapHeroCopyDismissed ? (
        <section className="map-hero-copy" lang="en" aria-label="Welcome to Kode Sports Club">
          <img src="/logo.png" width={180} alt=""/>
          <h1 className="map-hero-copy__headline">
            <br/>
            <span className="map-hero-copy__headline-line">INTERNATIONAL EXHIBITION</span>
            <span className="map-hero-copy__headline-line">ON ENVIRONMENTAL </span>
            <span className="map-hero-copy__headline-line">TECHNOLOGY & GREEN ENERGY</span>
          </h1>
          <p className="map-hero-copy__body">
            We invite you to <span className="map-hero-copy__underline">2026 ENVEX</span>  (International Exhibition on Environmental Technology & Green Energy)<br/> Korea's largest environmental exhibition.
            <br />
            {/*Don't miss this special opportunity to be the first <br/>to experience the newest trends in the environmental industry!*/}
            {/*<br />*/}

          </p>
          <button
            type="button"
            className="map-hero-copy__cta"
            onClick={() => triggerBrandFilmCenterView()}
          >
            EXPLORE THE 2026 ENVEX
          </button>
        </section>
      ) : null}
      
      {/* 상단 헤더 */}
      {/*<MapHeader onClose={handleCloseMap} />*/}
      
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
