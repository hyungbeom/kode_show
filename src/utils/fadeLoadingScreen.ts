import { gsap } from 'gsap'

/** `.loading-screen` 페이드 인 — checkUrl / 맵→룸 로딩 등 공통 */
export function fadeInLoadingScreen(): void {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>('.loading-screen')
      if (el) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' })
      }
    }, 50)
  })
}
