import { memo, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import SoundControl from './SoundControl'
import { useMapStore } from '../store/useMapStore'
import { searchExhibitors, type ExhibitorSearchHit } from '../utils/mapExhibitorSearch'
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

const SEARCH_DEBOUNCE_MS = 140

/** EXPLORE 이후 맵 상단 — 사운드 + 업체·키워드 검색 */
function MapTopToolbarInner() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const glbFocusPositions = useMapStore((s) => s.glbFocusPositions)
  const selectArea = useMapStore((s) => s.selectArea)
  const setZonePanelSearchDeepLink = useMapStore((s) => s.setZonePanelSearchDeepLink)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [query])

  const results = useMemo(() => searchExhibitors(debouncedQuery, 24), [debouncedQuery])

  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent) => {
      const el = rootRef.current
      if (!el || !listOpen) return
      if (e.target instanceof Node && el.contains(e.target)) return
      setListOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown, true)
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true)
  }, [listOpen])

  const pickHit = useCallback(
    (hit: ExhibitorSearchHit) => {
      const pos = glbFocusPositions[hit.glbNode]
      if (!pos) return
      setZonePanelSearchDeepLink({ focusCompanyId: hit.company.id })
      selectArea(hit.zoneId, pos)
      setQuery('')
      setDebouncedQuery('')
      setListOpen(false)
      inputRef.current?.blur()
    },
    [glbFocusPositions, selectArea, setZonePanelSearchDeepLink],
  )

  const showSuggestions = listOpen && query.trim().length > 0
  const hasHits = results.length > 0

  return (
    <div className="map-top-toolbar" role="region" aria-label="맵 상단 도구">
      <div className="map-top-toolbar__left">
        <SoundControl variant="topbar" />
      </div>
      <div className="map-top-toolbar__search-wrap" ref={rootRef}>
        <div
          className="map-top-toolbar__search"
          role="search"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setListOpen(false)
            }
          }}
        >
          <label htmlFor="map-top-search-input" className="map-top-toolbar__sr-only">
            업체·키워드 검색
          </label>
          <input
            ref={inputRef}
            id="map-top-search-input"
            type="search"
            className="map-top-toolbar__search-input"
            placeholder="업체명·키워드 검색"
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setListOpen(true)
            }}
            onFocus={() => setListOpen(true)}
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="map-top-search-results"
            aria-autocomplete="list"
          />
          <span className="map-top-toolbar__search-icon" aria-hidden>
            <MapSearchIcon />
          </span>
        </div>

        {showSuggestions ? (
          <div
            id="map-top-search-results"
            className="map-top-toolbar__results"
            role="listbox"
            aria-label="검색 결과"
          >
            {!hasHits ? (
              <div className="map-top-toolbar__results-empty" role="presentation">
                일치하는 업체가 없습니다
              </div>
            ) : (
              results.map((hit) => (
                <button
                  key={`${hit.zoneId}-${hit.company.id}`}
                  type="button"
                  role="option"
                  className="map-top-toolbar__result-row"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickHit(hit)}
                >
                  <span className="map-top-toolbar__result-name">{hit.company.name}</span>
                  <span className="map-top-toolbar__result-meta">
                    {hit.zoneLabel} · {hit.company.keywords.slice(0, 3).join(' · ')}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const MapTopToolbar = memo(MapTopToolbarInner)
MapTopToolbar.displayName = 'MapTopToolbar'
