import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface UseSlideAnimationOptions {
  direction?: 'left' | 'right' | 'up' | 'down'
  distance?: number
  duration?: number
  ease?: string
  delay?: number
  onComplete?: () => void
}

/**
 * 슬라이드 애니메이션 훅
 * 재사용 가능한 슬라이드 애니메이션 로직
 */
export function useSlideAnimation(
  elementRef: React.RefObject<HTMLElement>,
  isVisible: boolean,
  options: UseSlideAnimationOptions = {}
) {
  const {
    direction = 'right',
    distance = 400,
    duration = 0.5,
    ease = 'power2.out',
    delay = 0,
    onComplete,
  } = options

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (!elementRef.current) return

    const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
    const sign = direction === 'right' || direction === 'down' ? 1 : -1
    const offset = distance * sign

    if (isVisible) {
      if (isInitialMount.current) {
        gsap.set(elementRef.current, {
          [axis]: 0,
          opacity: 1,
        })
        isInitialMount.current = false
      } else {
        gsap.fromTo(
          elementRef.current,
          {
            [axis]: offset,
            opacity: 0,
          },
          {
            [axis]: 0,
            opacity: 1,
            duration,
            ease,
            delay,
            onComplete,
          }
        )
      }
    } else {
      gsap.to(elementRef.current, {
        [axis]: offset,
        opacity: 0,
        duration,
        ease,
        delay,
        onComplete,
      })
    }
  }, [isVisible, direction, distance, duration, ease, delay, onComplete, elementRef])
}
