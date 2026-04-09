import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import RoomCompanyIntro from './RoomCompanyIntro'
import './RoomEntryWithIntro.css'

const RoomScene = lazy(() => import('./RoomScene'))

/** 흰 소개 시트 아래 투명 구간(3D가 비쳐 보이게) */
const INTRO_TAIL_MIN_VH = 82
/** 흰 시트 아래 — 꼬리가 뷰포트에 이만큼 더 들어와야 닫힘(너무 빨리 사라지지 않게) */
const DISMISS_WHEN_TAIL_VISIBLE_PX = 220
/** 소개 레이어가 위로 걷히는 시간(ms) — CSS transition과 맞출 것 */
const INTRO_EXIT_MS = 520

/**
 * 3D 룸은 뷰포트에 고정, 위에 흰 소개 레이어를 스크롤로 걷어 올려 캐러셀·씬이 드러남
 */
export default function RoomEntryWithIntro({ company, companyId, onIntroBack, onRoomBack }) {
  const [introHidden, setIntroHidden] = useState(false)
  const [introExiting, setIntroExiting] = useState(false)
  const scrollRef = useRef(null)
  const sheetRef = useRef(null)
  const exitTransitionDoneRef = useRef(false)
  /**
   * 이 레이어에서 내려진 터치/펜 포인터만 추적 — 손가락이 스크린에 닿아 있는 동안에는
   * 스크롤·리사이즈로 절대 닫지 않음 (pointer 이벤트 + 터치 식별자 fallback).
   */
  const activeTouchLikePointerIdsRef = useRef(new Set())
  const activeIntroTouchIdentifiersRef = useRef(new Set())
  const prefersPointerContactApi =
    typeof window !== 'undefined' && typeof window.PointerEvent !== 'undefined'

  const evaluateIntroDismiss = useCallback(() => {
    if (introHidden || introExiting) return
    const sc = scrollRef.current
    const sheet = sheetRef.current
    if (!sc || !sheet) return
    const sheetH = sheet.offsetHeight
    /* 첫 페인트 전 offsetHeight 0이면 오탐으로 오버레이가 바로 닫히는 것 방지 */
    if (sheetH < 1) return
    const viewBottom = sc.scrollTop + sc.clientHeight
    if (viewBottom >= sheetH + DISMISS_WHEN_TAIL_VISIBLE_PX) {
      exitTransitionDoneRef.current = false
      setIntroExiting(true)
    }
  }, [introHidden, introExiting])

  const onScrollLayerScroll = useCallback(() => {
    if (
      activeTouchLikePointerIdsRef.current.size > 0 ||
      activeIntroTouchIdentifiersRef.current.size > 0
    ) {
      return
    }
    evaluateIntroDismiss()
  }, [evaluateIntroDismiss])

  const scheduleEvaluateDismissAfterTouch = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => evaluateIntroDismiss())
    })
  }, [evaluateIntroDismiss])

  const roomSceneRef = useRef(null)

  const reopenIntro = useCallback(() => {
    const consumed = roomSceneRef.current?.resetProductCarouselOverview?.()
    if (consumed) return
    activeTouchLikePointerIdsRef.current.clear()
    activeIntroTouchIdentifiersRef.current.clear()
    setIntroHidden(false)
    setIntroExiting(false)
    exitTransitionDoneRef.current = false
  }, [])

  const finishIntroExit = useCallback(() => {
    if (exitTransitionDoneRef.current) return
    exitTransitionDoneRef.current = true
    setIntroExiting(false)
    setIntroHidden(true)
  }, [])

  const handleIntroExitTransitionEnd = useCallback(
    (e) => {
      if (e.propertyName !== 'transform') return
      if (e.target !== e.currentTarget) return
      finishIntroExit()
    },
    [finishIntroExit],
  )

  useEffect(() => {
    if (!introExiting) return
    const t = window.setTimeout(() => {
      if (exitTransitionDoneRef.current) return
      finishIntroExit()
    }, INTRO_EXIT_MS + 120)
    return () => window.clearTimeout(t)
  }, [introExiting, finishIntroExit])

  useEffect(() => {
    if (introHidden || introExiting) return
    const el = scrollRef.current
    if (el) el.scrollTop = 0
  }, [introHidden, introExiting])

  useEffect(() => {
    const sc = scrollRef.current
    if (!sc || introHidden || introExiting) return
    onScrollLayerScroll()
    sc.addEventListener('scroll', onScrollLayerScroll, { passive: true })

    const cap = { capture: true }

    const onPointerDown = (e) => {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
      if (!sc.contains(e.target)) return
      activeTouchLikePointerIdsRef.current.add(e.pointerId)
    }
    const onPointerEnd = (e) => {
      if (!activeTouchLikePointerIdsRef.current.has(e.pointerId)) return
      activeTouchLikePointerIdsRef.current.delete(e.pointerId)
      if (activeTouchLikePointerIdsRef.current.size === 0) {
        scheduleEvaluateDismissAfterTouch()
      }
    }

    const onTouchStartFallback = (e) => {
      const { changedTouches } = e
      for (let i = 0; i < changedTouches.length; i++) {
        const t = changedTouches.item(i)
        if (t && sc.contains(t.target)) {
          activeIntroTouchIdentifiersRef.current.add(t.identifier)
        }
      }
    }
    const onTouchEndFallback = (e) => {
      const { changedTouches } = e
      let removedOnIntro = false
      for (let i = 0; i < changedTouches.length; i++) {
        const t = changedTouches.item(i)
        if (t && activeIntroTouchIdentifiersRef.current.has(t.identifier)) {
          activeIntroTouchIdentifiersRef.current.delete(t.identifier)
          removedOnIntro = true
        }
      }
      if (removedOnIntro && activeIntroTouchIdentifiersRef.current.size === 0) {
        scheduleEvaluateDismissAfterTouch()
      }
    }

    if (prefersPointerContactApi) {
      sc.addEventListener('pointerdown', onPointerDown, { passive: true, ...cap })
      sc.addEventListener('pointerup', onPointerEnd, { passive: true, ...cap })
      sc.addEventListener('pointercancel', onPointerEnd, { passive: true, ...cap })
    } else {
      sc.addEventListener('touchstart', onTouchStartFallback, { passive: true, ...cap })
      sc.addEventListener('touchend', onTouchEndFallback, { passive: true, ...cap })
      sc.addEventListener('touchcancel', onTouchEndFallback, { passive: true, ...cap })
    }

    return () => {
      sc.removeEventListener('scroll', onScrollLayerScroll)
      if (prefersPointerContactApi) {
        sc.removeEventListener('pointerdown', onPointerDown, cap)
        sc.removeEventListener('pointerup', onPointerEnd, cap)
        sc.removeEventListener('pointercancel', onPointerEnd, cap)
      } else {
        sc.removeEventListener('touchstart', onTouchStartFallback, cap)
        sc.removeEventListener('touchend', onTouchEndFallback, cap)
        sc.removeEventListener('touchcancel', onTouchEndFallback, cap)
      }
    }
  }, [
    introHidden,
    introExiting,
    onScrollLayerScroll,
    scheduleEvaluateDismissAfterTouch,
    company?.id,
    prefersPointerContactApi,
  ])

  useEffect(() => {
    if (introHidden || introExiting) return
    const onResize = () => {
      if (
        activeTouchLikePointerIdsRef.current.size > 0 ||
        activeIntroTouchIdentifiersRef.current.size > 0
      ) {
        return
      }
      onScrollLayerScroll()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [introHidden, introExiting, onScrollLayerScroll])

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

      {!introHidden || introExiting ? (
        <div
          ref={scrollRef}
          className={
            'room-entry-with-intro__intro-scroll' +
            (introExiting ? ' room-entry-with-intro__intro-scroll--exiting' : '')
          }
          data-room-intro-scroll
          onTransitionEnd={handleIntroExitTransitionEnd}
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
