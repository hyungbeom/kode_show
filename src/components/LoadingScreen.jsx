import './LoadingScreen.css'

/**
 * 미니멀 랜딩 — 흰 배경, `/logo.svg` 마스크로 네이비 로고 + LOADING 점
 * 맵/룸 진입은 App에서 타이머·프리로드 후 자동 전환 (`onEnter`는 호환용으로만 받음).
 */
export default function LoadingScreen({
  onEnter: _onEnter,
  mapEntryReady: _mapEntryReady = false,
  prepLabel: _prepLabel,
  landingProgressPercent: _landingProgressPercent,
}) {
  return (
    <div className="loading-screen initial-loading loading-screen--curtain">
      <div className="loading-screen__inner">
        <div className="loading-screen__brand">
          <div
            className="loading-screen__logo-mark"
            role="img"
            aria-label="ENVEX Environmental Exhibition"
          />
        </div>

        <p className="loading-screen__loading" role="status" aria-live="polite">
          <span className="loading-screen__loading-text">LOADING</span>
          <span className="loading-screen__loading-dots" aria-hidden>
            <span className="loading-screen__loading-dot loading-screen__loading-dot--1" />
            <span className="loading-screen__loading-dot loading-screen__loading-dot--2" />
            <span className="loading-screen__loading-dot loading-screen__loading-dot--3" />
          </span>
        </p>
      </div>
    </div>
  )
}
