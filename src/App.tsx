import {
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
  useRef,
  useMemo,
  type MutableRefObject,
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
import './App.css'

const RoomScene = lazy(() => import('./components/RoomScene'))

const MAP_INTRO_EXIT_MS = 720

type View = 'loading' | 'map' | 'room'

function App() {
  useVisualViewportCssVars()

  const [currentView, setCurrentView] = useState<View>('loading')
  const [showLoading, setShowLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const showLoadingRef: MutableRefObject<boolean> = useRef(showLoading)
  showLoadingRef.current = showLoading

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

  const isLandingPhase = currentView === 'loading' && !showLoading
  const [landingAssetsReady, setLandingAssetsReady] = useState(false)
  const showMapLayer = currentView === 'map' || (isLandingPhase && landingAssetsReady)

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
        setCurrentView('loading')
        setShowLoading(true)
        fadeInLoadingScreen()
      }
    } else if (path === '/map') {
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
          setShowLoading(true)
          setIsTransitioning(false)
          fadeInLoadingScreen()
        },
      })
    } else {
      setShowLoading(true)
      setIsTransitioning(false)
    }
  }, [selectedCompanyId, currentView])

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
      setShowLoading(false)
      setCurrentView('map')
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

  const handleEnter = useCallback(() => {
    useMapStore.setState({
      mapHeroCopyDismissed: false,
    })
    setInitialEntry(true)
    const curtain =
      document.querySelector('.loading-screen--curtain') ?? document.querySelector('.loading-screen.initial-loading')
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
            setCurrentView('map')
          },
        }
      )
    } else {
      setCurrentView('map')
    }
  }, [setInitialEntry])

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

  const mapAppClassName = useMemo(
    () =>
      [
        'app-container',
        isLandingPhase && landingAssetsReady ? 'app-container--behind-curtain' : '',
        isTransitioning && currentView === 'map' ? 'transitioning' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [isLandingPhase, landingAssetsReady, isTransitioning, currentView]
  )

  if (showLoading) {
    return <LoadingScreen mode="room" onComplete={handleLoadingComplete} isInitial={false} />
  }

  if (currentView === 'room') {
    return (
      <Suspense fallback={<div>Loading room...</div>}>
        <RoomScene
          key={selectedCompanyId ?? 0}
          companyId={selectedCompanyId ?? undefined}
          onBack={handleBackFromRoom}
        />
      </Suspense>
    )
  }

  return (
    <>
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
          mode="landing"
          mapEntryReady={landingAssetsReady}
          onEnter={handleEnter}
          onComplete={handleLoadingComplete}
          isInitial
        />
      ) : null}
    </>
  )
}

export default App
