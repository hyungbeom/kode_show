import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface UseFadeAnimationOptions {
  duration?: number
  ease?: string
  delay?: number
  onComplete?: () => void
}

/**
 * 페이드 인/아웃 애니메이션 훅
 * 재사용 가능한 페이드 애니메이션 로직
 */
export function useFadeAnimation(
  elementRef: React.RefObject<HTMLElement>,
  isVisible: boolean,
  options: UseFadeAnimationOptions = {}
) {
  const {
    duration = 0.5,
    ease = 'power2.out',
    delay = 0,
    onComplete,
  } = options

  useEffect(() => {
    if (!elementRef.current) return

    if (isVisible) {
      gsap.fromTo(
        elementRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration,
          ease,
          delay,
          onComplete,
        }
      )
    } else {
      gsap.to(elementRef.current, {
        opacity: 0,
        duration,
        ease,
        delay,
        onComplete,
      })
    }
  }, [isVisible, duration, ease, delay, onComplete, elementRef])
}

/**
 * 페이드 인 애니메이션 훅 (단순 버전)
 */
export function useFadeIn(
  elementRef: React.RefObject<HTMLElement>,
  options: UseFadeAnimationOptions = {}
) {
  const {
    duration = 0.5,
    ease = 'power2.out',
    delay = 0,
  } = options

  useEffect(() => {
    if (!elementRef.current) return

    gsap.fromTo(
      elementRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration,
        ease,
        delay,
      }
    )
  }, [duration, ease, delay, elementRef])
}
