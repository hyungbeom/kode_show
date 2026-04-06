import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import RoomCompanyIntro from './RoomCompanyIntro'
import './RoomEntryWithIntro.css'

const RoomScene = lazy(() => import('./RoomScene'))

/** 흰 소개 시트 아래 투명 구간(3D가 비쳐 보이게) */
const INTRO_TAIL_MIN_VH = 82
/** 흰 시트 아래로 투명 꼬리가 뷰포트에 이만큼 보이면 오버레이 제거(터치가 3D로 전달되게) */
const DISMISS_WHEN_TAIL_VISIBLE_PX = 48

/**
 * 3D 룸은 뷰포트에 고정, 위에 흰 소개 레이어를 스크롤로 걷어 올려 캐러셀·씬이 드러남
 */
export default function RoomEntryWithIntro({ company, companyId, onIntroBack, onRoomBack }) {
  const [introOverlayGone, setIntroOverlayGone] = useState(false)
  const scrollRef = useRef(null)
  const sheetRef = useRef(null)

  const onScrollLayerScroll = useCallback(() => {
    if (introOverlayGone) return
    const sc = scrollRef.current
    const sheet = sheetRef.current
    if (!sc || !sheet) return
    const sheetH = sheet.offsetHeight
    /* 첫 페인트 전 offsetHeight 0이면 오탐으로 오버레이가 바로 닫히는 것 방지 */
    if (sheetH < 1) return
    const viewBottom = sc.scrollTop + sc.clientHeight
    if (viewBottom >= sheetH + DISMISS_WHEN_TAIL_VISIBLE_PX) {
      setIntroOverlayGone(true)
    }
  }, [introOverlayGone])

  const roomSceneRef = useRef(null)

  const reopenIntro = useCallback(() => {
    const consumed = roomSceneRef.current?.resetProductCarouselOverview?.()
    if (consumed) return
    setIntroOverlayGone(false)
  }, [])

  useEffect(() => {
    if (introOverlayGone) return
    const el = scrollRef.current
    if (el) el.scrollTop = 0
  }, [introOverlayGone])

  useEffect(() => {
    const sc = scrollRef.current
    if (!sc || introOverlayGone) return
    onScrollLayerScroll()
    sc.addEventListener('scroll', onScrollLayerScroll, { passive: true })
    return () => sc.removeEventListener('scroll', onScrollLayerScroll)
  }, [introOverlayGone, onScrollLayerScroll, company?.id])

  useEffect(() => {
    if (introOverlayGone) return
    const onResize = () => onScrollLayerScroll()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [introOverlayGone, onScrollLayerScroll])

  return (
    <div className="room-entry-with-intro">
      <div className="room-entry-with-intro__scene">
        <Suspense
          fallback={
            <div className="room-entry-with-intro__scene-fallback" role="status">
              전시 룸 로딩 중…
            </div>
          }
        >
          <RoomScene ref={roomSceneRef} companyId={companyId} onBack={onRoomBack} />
        </Suspense>
      </div>

      {!introOverlayGone ? (
        <div
          ref={scrollRef}
          className="room-entry-with-intro__intro-scroll"
          data-room-intro-scroll
        >
          <div ref={sheetRef} className="room-entry-with-intro__intro-sheet">
            <RoomCompanyIntro
              variant="scroll"
              company={company}
              onBack={onIntroBack}
              onEnterRoom={() => {}}
            />
          </div>
          <div
            className="room-entry-with-intro__intro-tail"
            style={{ minHeight: `${INTRO_TAIL_MIN_VH}vh` }}
            aria-hidden
          />
        </div>
      ) : (
        <button
          type="button"
          className="room-entry-with-intro__reopen-intro"
          onClick={reopenIntro}
          aria-label="회사 소개 다시 보기"
        >
          <span aria-hidden>←</span>
        </button>
      )}
    </div>
  )
}
