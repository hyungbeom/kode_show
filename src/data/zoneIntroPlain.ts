import {
  ZONE_ID_AIR,
  ZONE_ID_CARBON,
  ZONE_ID_EARTH,
  ZONE_ID_INST,
  ZONE_ID_WATER,
} from '../utils/constants'

/** 측정분석(zone-lab)은 `zoneRichPanels` 리치 섹션으로만 소개 — 여기 없음 */
export const ZONE_INTRO_PLAIN: Record<string, string> = {
  [ZONE_ID_WATER]:
    '하천·호소 수질과 상·하수도, 폐수 처리 과정을 주제로 수질 분석·처리 기술과 계측 장비를 한눈에 볼 수 있는 구역입니다. 현장에서 바로 쓰이는 센서와 실험실급 분석기기가 함께 전시되어, 깨끗한 물 환경을 만드는 기술을 소개합니다.',
  [ZONE_ID_AIR]:
    '대기 중 오염물질을 실시간으로 측정·분석하고, 배출원 관리와 대기질 개선에 활용되는 장비와 솔루션이 모인 공간입니다. 미세먼지·가스 성분·초미세 입자까지 다루는 정밀 측정 기술을 통해 맑은 공기를 지키는 산업의 핵심을 살펴볼 수 있습니다.',
  [ZONE_ID_CARBON]:
    '탄소 배출 저감과 탄소중립 실현을 위한 기술·정책·모니터링을 아우르는 전시 구역입니다. 온실가스 배출량 산정, 탄소 포집·저장, 재생에너지 연계 등 탄소중립 여정을 한눈에 이해할 수 있도록 구성됩니다.',
  [ZONE_ID_EARTH]:
    '해외 환경 기술과 글로벌 협력 사례를 소개하는 외국관입니다. 각국의 환경 규제·산업 동향과 우수 사례를 통해 국제적인 시각으로 지속가능한 미래를 탐색합니다.',
  [ZONE_ID_INST]:
    '기관·협회·홍보 부스가 모여, 환경 정책·인증·교육 등 다양한 정보를 제공하는 구역입니다. 산업계와 시민의 소통을 돕는 네트워크 허브 역할을 합니다.',
}

export function getZoneIntroPlain(zoneId: string | null | undefined): string | undefined {
  if (!zoneId) return undefined
  return ZONE_INTRO_PLAIN[zoneId]
}
