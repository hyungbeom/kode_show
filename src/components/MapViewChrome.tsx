import { memo, Suspense, lazy, useState } from 'react'
import MapMegaphoneNotification, { MAP_NOTIFICATION_BADGE_COUNT } from './MapMegaphoneNotification'
import { MapNotificationModal } from './MapNotificationModal'
import NavigationUI from './NavigationUI'
import { MapIntroOverlay } from './MapIntroOverlay'
import { MapTopToolbar } from './MapTopToolbar'

const MapScene = lazy(() => import('./MapScene'))
const ZoneInfoPanel = lazy(() => import('./ZoneInfoPanel'))

export type MapViewChromeProps = {
  showIntro: boolean
  introExiting: boolean
  onIntroExplore: () => void
  selectedZone: string | null
  onClearZone: () => void
}

/** 맵 씬 + 인트로/툴바 — App 리렌더 범위 축소 */
function MapViewChromeInner({
  showIntro,
  introExiting,
  onIntroExplore,
  selectedZone,
  onClearZone,
}: MapViewChromeProps) {
  const mapReady = !showIntro
  const [mapNotificationOpen, setMapNotificationOpen] = useState(false)

  return (
    <>
      <Suspense fallback={<div>Loading map...</div>}>
        <MapScene />
      </Suspense>

      {showIntro ? (
        <MapIntroOverlay exiting={introExiting} onExplore={onIntroExplore} />
      ) : (
        <MapTopToolbar />
      )}

      {mapReady ? (
        <>
          <MapMegaphoneNotification onOpen={() => setMapNotificationOpen(true)} />
          <MapNotificationModal
            open={mapNotificationOpen}
            onClose={() => setMapNotificationOpen(false)}
            count={MAP_NOTIFICATION_BADGE_COUNT}
          />
        </>
      ) : null}
      {mapReady ? <NavigationUI /> : null}
      {mapReady && selectedZone ? (
        <Suspense fallback={null}>
          <ZoneInfoPanel zoneId={selectedZone} onClose={onClearZone} />
        </Suspense>
      ) : null}
    </>
  )
}

export const MapViewChrome = memo(MapViewChromeInner)
