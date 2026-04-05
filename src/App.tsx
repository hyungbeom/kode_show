import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  lazy,
  Suspense,
  useRef,
  useMemo,
} from 'react'
import { gsap } from 'gsap'
import LoadingScreen from './components/LoadingScreen'
import { MapViewChrome } from './components/MapViewChrome'
import { useAppMapStore } from './hooks/useMapStore'
import { useVisualViewportCssVars } from './hooks/useVisualViewportCssVars'
import { useMapStore } from './store/useMapStore'
import { COMPANY_NAMES } from './utils/constants'
import { fadeInLoadingScreen } from './utils/fadeLoadingScreen'
import { prepareMapViewEntry } from './utils/prepareMapViewEntry'
import { prepareRoomViewEntry } from './utils/prepareRoomViewEntry'
import './App.css'

const RoomScene = lazy(() => import('./components/RoomScene'))

const MAP_INTRO_EXIT_MS = 720

type View = 'loading' | 'map' | 'room' | 'roomPrepare'

function readInitialViewFromPath(): View {
  if (typeof window === 'undefined') return 'loading'
  const path = window.location.pathname
  const roomMatch = path.match(/^\/room\/(\d+)/)
  if (roomMatch) {
    const companyId = parseInt(roomMatch[1], 10)
    if (companyId && COMPANY_NAMES[companyId]) return 'roomPrepare'
  }
  if (path === '/map') return 'map'
  return 'loading'
}

function App() {
  useVisualViewportCssVars()

  const [currentView, setCurrentView] = useState<View>(readInitialViewFromPath)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const {
    setInitialEntry,
    selectedCompanyId,
    setSelectedCompany,
    clearSelectedCompany,
    selectedZone,
    clearSelectedZone,
    mapHeroCopyDismissed,
  } = useAppMapStore()

  const [mapIntroExiting, setMapIntroExiting] = useState(false)
  const mapIntroExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mapIntroExitingRef = useRef(false)

  const isLandingPhase = currentView === 'loading'
  const [landingAssetsReady, setLandingAssetsReady] = useState(false)
  const [roomEntryReady, setRoomEntryReady] = useState(false)

  const showMapLayer = currentView === 'map' || (isLandingPhase && landingAssetsReady)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const roomMatch = window.location.pathname.match(/^\/room\/(\d+)/)
    if (roomMatch) {
      const companyId = parseInt(roomMatch[1], 10)
      if (companyId && COMPANY_NAMES[companyId]) {
        setSelectedCompany(companyId, COMPANY_NAMES[companyId])
      }
    }
  }, [setSelectedCompany])

  useEffect(() => {
    if (!isLandingPhase) {
      setLandingAssetsReady(false)
      return
    }
    let cancelled = false
    setLandingAssetsReady(false)
    prepareMapViewEntry()
      .then(() => {
        if (!cancelled) setLandingAssetsReady(true)
      })
      .catch(() => {
        if (!cancelled) setLandingAssetsReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [isLandingPhase])

  useEffect(() => {
    if (currentView !== 'roomPrepare') {
      setRoomEntryReady(false)
      return
    }
    let cancelled = false
    setRoomEntryReady(false)
    prepareRoomViewEntry()
      .then(() => {
        if (!cancelled) setRoomEntryReady(true)
      })
      .catch(() => {
        if (!cancelled) setRoomEntryReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [currentView])

  useEffect(() => {
    if (mapHeroCopyDismissed) return
    mapIntroExitingRef.current = false
    setMapIntroExiting(false)
    if (mapIntroExitTimerRef.current) {
      clearTimeout(mapIntroExitTimerRef.current)
      mapIntroExitTimerRef.current = null
    }
  }, [mapHeroCopyDismissed])

  useEffect(() => {
    return () => {
      if (mapIntroExitTimerRef.current) clearTimeout(mapIntroExitTimerRef.current)
    }
  }, [])

  const handleMapIntroExplore = useCallback(() => {
    if (mapIntroExitingRef.current) return
    mapIntroExitingRef.current = true
    setMapIntroExiting(true)
    if (mapIntroExitTimerRef.current) clearTimeout(mapIntroExitTimerRef.current)
    mapIntroExitTimerRef.current = window.setTimeout(() => {
      mapIntroExitTimerRef.current = null
      useMapStore.getState().triggerBrandFilmCenterView()
    }, MAP_INTRO_EXIT_MS)
  }, [])

  const checkUrl = useCallback(() => {
    const path = window.location.pathname
    const roomMatch = path.match(/^\/room\/(\d+)/)
    if (roomMatch) {
      const companyId = parseInt(roomMatch[1], 10)
      if (companyId && COMPANY_NAMES[companyId]) {
        setSelectedCompany(companyId, COMPANY_NAMES[companyId])
        setCurrentView('roomPrepare')
        fadeInLoadingScreen()
      }
      return
    }
    if (path === '/map') {
      setCurrentView('map')
    }
  }, [setSelectedCompany])

  useEffect(() => {
    checkUrl()
    window.addEventListener('popstate', checkUrl)
    return () => window.removeEventListener('popstate', checkUrl)
  }, [checkUrl])

  useEffect(() => {
    if (currentView !== 'map' || isTransitioning) return
    mapContainerRef.current?.style.removeProperty('opacity')
  }, [currentView, isTransitioning])

  useEffect(() => {
    if (!selectedCompanyId || currentView !== 'map') return

    setIsTransitioning(true)
    const mapElement = document.querySelector('.app-container')
    if (mapElement) {
      gsap.to(mapElement, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          setCurrentView('roomPrepare')
          setIsTransitioning(false)
          fadeInLoadingScreen()
        },
      })
    } else {
      setCurrentView('roomPrepare')
      setIsTransitioning(false)
    }
  }, [selectedCompanyId, currentView])

  const runCurtainReveal = useCallback((onRevealed: () => void) => {
    const curtain =
      (document.querySelector('.loading-screen--curtain') as HTMLElement | null) ??
      (document.querySelector('.loading-screen.initial-loading') as HTMLElement | null)
    if (curtain) {
      gsap.fromTo(
        curtain,
        { yPercent: 0 },
        {
          yPercent: -100,
          duration: 1.15,
          ease: 'power3.inOut',
          onComplete: () => {
            gsap.set(curtain, { visibility: 'hidden', pointerEvents: 'none' })
            onRevealed()
          },
        },
      )
    } else {
      onRevealed()
    }
  }, [])

  const handleEnter = useCallback(() => {
    useMapStore.setState({
      mapHeroCopyDismissed: false,
    })
    setInitialEntry(true)
    runCurtainReveal(() => setCurrentView('map'))
  }, [setInitialEntry, runCurtainReveal])

  const handleRoomEnter = useCallback(() => {
    runCurtainReveal(() => setCurrentView('room'))
  }, [runCurtainReveal])

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
                  onComplete: () => setIsTransitioning(false),
                },
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

  const mapAppClassName = useMemo(
    () =>
      [
        'app-container',
        isLandingPhase && landingAssetsReady ? 'app-container--behind-curtain' : '',
        isTransitioning && currentView === 'map' ? 'transitioning' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [isLandingPhase, landingAssetsReady, isTransitioning, currentView],
  )

  const roomBehindCurtain = currentView === 'roomPrepare' && roomEntryReady
  const showRoomScene = currentView === 'room' || roomBehindCurtain

  return (
    <>
      {showRoomScene ? (
        <Suspense fallback={<div>Loading room...</div>}>
          <div
            className={
              currentView === 'roomPrepare' && roomEntryReady
                ? 'app-container app-container--behind-curtain'
                : 'app-container'
            }
            style={{ width: '100%', height: '100%', minHeight: '100dvh' }}
          >
            <RoomScene
              key={selectedCompanyId ?? 0}
              companyId={selectedCompanyId ?? undefined}
              onBack={handleBackFromRoom}
            />
          </div>
        </Suspense>
      ) : null}

      {currentView === 'roomPrepare' ? (
        <LoadingScreen
          mapEntryReady={roomEntryReady}
          onEnter={handleRoomEnter}
          prepLabel="전시 룸 준비 중…"
        />
      ) : null}

      {showMapLayer ? (
        <div ref={mapContainerRef} className={mapAppClassName}>
          <MapViewChrome
            showIntro={!mapHeroCopyDismissed}
            introExiting={mapIntroExiting}
            onIntroExplore={handleMapIntroExplore}
            selectedZone={selectedZone}
            onClearZone={clearSelectedZone}
          />
        </div>
      ) : null}

      {isLandingPhase ? (
        <LoadingScreen
          mapEntryReady={landingAssetsReady}
          onEnter={handleEnter}
          prepLabel="3D 맵 로딩 중…"
        />
      ) : null}
    </>
  )
}

export default App
