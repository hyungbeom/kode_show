import { gsap } from 'gsap'

/**
 * 공통 애니메이션 헬퍼 함수들
 * 재사용 가능한 GSAP 애니메이션 유틸리티
 */

export interface AnimationOptions {
  duration?: number
  ease?: string
  delay?: number
  onComplete?: () => void
}

/**
 * 페이드 인 애니메이션
 */
export function fadeIn(
  element: HTMLElement | null,
  options: AnimationOptions = {}
): void {
  if (!element) return

  const { duration = 0.5, ease = 'power2.out', delay = 0, onComplete } = options

  gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration,
      ease,
      delay,
      onComplete,
    }
  )
}

/**
 * 페이드 아웃 애니메이션
 */
export function fadeOut(
  element: HTMLElement | null,
  options: AnimationOptions = {}
): void {
  if (!element) return

  const { duration = 0.5, ease = 'power2.in', delay = 0, onComplete } = options

  gsap.to(element, {
    opacity: 0,
    duration,
    ease,
    delay,
    onComplete,
  })
}

/**
 * 슬라이드 인 애니메이션
 */
export function slideIn(
  element: HTMLElement | null,
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  distance: number = 400,
  options: AnimationOptions = {}
): void {
  if (!element) return

  const { duration = 0.5, ease = 'power2.out', delay = 0, onComplete } = options
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const sign = direction === 'right' || direction === 'down' ? 1 : -1
  const offset = distance * sign

  gsap.fromTo(
    element,
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

/**
 * 슬라이드 아웃 애니메이션
 */
export function slideOut(
  element: HTMLElement | null,
  direction: 'left' | 'right' | 'up' | 'down' = 'right',
  distance: number = 400,
  options: AnimationOptions = {}
): void {
  if (!element) return

  const { duration = 0.5, ease = 'power2.in', delay = 0, onComplete } = options
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const sign = direction === 'right' || direction === 'down' ? 1 : -1
  const offset = distance * sign

  gsap.to(element, {
    [axis]: offset,
    opacity: 0,
    duration,
    ease,
    delay,
    onComplete,
  })
}

/**
 * 스케일 애니메이션
 */
export function scaleIn(
  element: HTMLElement | null,
  options: AnimationOptions = {}
): void {
  if (!element) return

  const { duration = 0.5, ease = 'back.out(1.7)', delay = 0, onComplete } = options

  gsap.fromTo(
    element,
    {
      scale: 0,
      opacity: 0,
    },
    {
      scale: 1,
      opacity: 1,
      duration,
      ease,
      delay,
      onComplete,
    }
  )
}

/**
 * 스케일 아웃 애니메이션
 */
export function scaleOut(
  element: HTMLElement | null,
  options: AnimationOptions = {}
): void {
  if (!element) return

  const { duration = 0.3, ease = 'back.in(1.7)', delay = 0, onComplete } = options

  gsap.to(element, {
    scale: 0,
    opacity: 0,
    duration,
    ease,
    delay,
    onComplete,
  })
}
