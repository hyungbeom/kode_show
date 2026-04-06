import { memo } from 'react'
import SoundControl from './SoundControl'
import './MapIntroOverlay.css'

export type MapIntroOverlayProps = {
  exiting: boolean
  onExplore: () => void
}

/** 맵 첫 진입 블러 + 카피 — 부모 리렌더와 분리해 메모 */
function MapIntroOverlayInner({ exiting, onExplore }: MapIntroOverlayProps) {
  const veilClass = exiting ? 'map-intro-blur-veil map-intro-blur-veil--exiting' : 'map-intro-blur-veil'
  const shellClass = exiting ? 'map-intro-shell map-intro-shell--exiting' : 'map-intro-shell'

  return (
    <>
      <div className={veilClass} aria-hidden />
      <div className={shellClass} lang="en" aria-label="Welcome to ENVEX 2026">
        <header className="map-intro-top">
          <img src="/logo.svg" className="map-intro-logo" width={240} height={52} alt="ENVEX" />
          <SoundControl variant="intro" />
        </header>
        <div className="map-intro-main">
          <h1 className="map-intro-headline">
            <span className="map-intro-headline-line">International</span>
            <span className="map-intro-headline-line">Exhibition</span>

            <span className="map-intro-headline-line" style={{paddingTop : 12}}>on Environmental</span>
            <span className="map-intro-headline-line">Technology &amp;</span>
            <span className="map-intro-headline-line" style={{paddingTop : 12}}>Green Energy</span>
          </h1>
          <p className="map-intro-body">
            We invite you to <span className="map-intro-body__accent">2026 ENVEX</span> (International <br/>
            Exhibition on Environmental Technology & <br/> Green Energy) Korea&apos;s largest <br/> environmental
            exhibition.
          </p>
        </div>
        <div className="map-intro-bottom">
          <button
            type="button"
            className="map-intro-cta"
            disabled={exiting}
            onClick={onExplore}
          >
            <span>Explore the 2026 ENVEX</span>
            <span className="map-intro-cta__chevron" aria-hidden>
              ›
            </span>
          </button>
        </div>
      </div>
    </>
  )
}

export const MapIntroOverlay = memo(MapIntroOverlayInner)
