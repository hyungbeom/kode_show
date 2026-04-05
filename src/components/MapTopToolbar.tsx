import { memo } from 'react'
import SoundControl from './SoundControl'
import './MapTopToolbar.css'

function MapSearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** EXPLORE 이후 맵 상단 — 사운드 + 검색바 */
function MapTopToolbarInner() {
  return (
    <div className="map-top-toolbar" role="region" aria-label="맵 상단 도구">
      <div className="map-top-toolbar__left">
        <SoundControl variant="topbar" />
      </div>
      <div className="map-top-toolbar__search" role="search">
        <label htmlFor="map-top-search-input" className="map-top-toolbar__sr-only">
          검색
        </label>
        <input
          id="map-top-search-input"
          type="search"
          className="map-top-toolbar__search-input"
          placeholder="검색어를 입력하세요"
          autoComplete="off"
          enterKeyHint="search"
        />
        <span className="map-top-toolbar__search-icon">
          <MapSearchIcon />
        </span>
      </div>
    </div>
  )
}

export const MapTopToolbar = memo(MapTopToolbarInner)
MapTopToolbar.displayName = 'MapTopToolbar'
