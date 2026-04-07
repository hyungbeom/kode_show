import { useMapStore } from '../store/useMapStore'
import './NavigationUI.css'

/**
 * 네비게이션 UI — 하단 NAVIGATE, 모바일은 [알림 | NAVIGATE | 마이페이지] 한 줄
 *
 * @param {{
 *   mapNotificationModalOpen?: boolean
 *   mobileLeadingSlot?: import('react').ReactNode | null
 *   mobileFab?: import('react').ReactNode | null
 * }} props
 */
export default function NavigationUI({
  mapNotificationModalOpen = false,
  mobileLeadingSlot = null,
  mobileFab = null,
}) {
  const setResetToFullMap = useMapStore((state) => state.setResetToFullMap)
  const resetMapToInitialInteractionState = useMapStore(
    (state) => state.resetMapToInitialInteractionState,
  )
  const selectedZone = useMapStore((state) => state.selectedZone)

  const hideNavigateImage = selectedZone != null || mapNotificationModalOpen

  const handleNavigateClick = () => {
    resetMapToInitialInteractionState()
    setResetToFullMap(true)
  }

  const marqueeSegment = (
    <>
      <span className="navigation-ui__dot" aria-hidden />
      <span className="navigation-ui__marquee-text">수자원공사 미래아리수</span>
      <span className="navigation-ui__sep">·</span>
      <span className="navigation-ui__marquee-text">컨퍼런스룸 302호</span>
      <span className="navigation-ui__sep">·</span>
      <span className="navigation-ui__marquee-text">15:30 ~ 18:00</span>
      <span className="navigation-ui__sep">·</span>
    </>
  )

  return (
    <div className="navigation-ui">
      <div className="navigation-ui__mobile-actions">
        {mobileLeadingSlot ? (
          <div className="navigation-ui__megaphone-anchor">{mobileLeadingSlot}</div>
        ) : null}
        <div
          className={`navigation-ui__desktop${hideNavigateImage ? ' navigation-ui__desktop--hidden' : ''}`}
          aria-hidden={hideNavigateImage || undefined}
        >
          {!hideNavigateImage ? (
            <div
              className="navigate-text"
              role="button"
              tabIndex={0}
              aria-label="Navigate — 맵 전체 보기로 초기화"
              onClick={handleNavigateClick}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigateClick()}
            >
              <img
                src="/navigate.svg"
                alt=""
                className="navigate-text__img"
                width={232}
                height={78}
                decoding="async"
                aria-hidden
              />
            </div>
          ) : null}
        </div>
        {mobileFab}
      </div>

      <div className="navigation-ui__ticker" aria-hidden>
        <div className="navigation-ui__marquee-track">
          <div className="navigation-ui__marquee-group">{marqueeSegment}</div>
          <div className="navigation-ui__marquee-group">{marqueeSegment}</div>
        </div>
      </div>
    </div>
  )
}
