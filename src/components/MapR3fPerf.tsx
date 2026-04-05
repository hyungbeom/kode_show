import { Perf } from 'r3f-perf'

/** 개발 전용 — MapScene Canvas 내부에서만 마운트 (lazy 청크). 프로덕션에서는 렌더하지 않음. */
export function MapR3fPerf() {
  if (import.meta.env.PROD) return null

  return (
    <Perf
      position="bottom-left"
      minimal
      showGraph
      deepAnalyze={false}
    />
  )
}
