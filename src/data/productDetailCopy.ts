/** 제품 캐러셀 상세 패널용 문구 — 필요 시 수정 */
export interface ProductDetailCopy {
  title: string
  subtitle: string
  description: string
  specs: string[]
}

export const PRODUCT_DETAIL_LIST: ProductDetailCopy[] = [
  {
    title: 'AQUAL Pro S',
    subtitle: '휴대형 올인원 수질 측정기',
    description:
      'AQUAL Pro S는 TDS, 탁도, 온도 등 주요 수질 지표를 현장에서 직접 측정하여 30초 이내에 정량 결과를 제공하는 휴대형 올인원 수질 측정기입니다. 반복적인 수질 관리 환경에서 신속하고 일관된 측정을 지원하며, 측정 결과는 디지털로 저장되어 운영 이력 관리 및 데이터 기반 의사결정이 가능합니다. 또한 박테리아 관련 항목은 약 12시간의 분석 과정을 통해 확인할 수 있어, 현장 판단과 신뢰도 있는 관리 정보를 동시에 제공합니다. 공공시설, 수영장, 스마트팜 등 다양한 운영 환경에 적용 가능합니다.',
    specs: ['TDS·탁도·온도 등 핵심 지표', '30초 이내 정량 결과', '디지털 저장·이력 관리', '박테리아 항목 약 12시간 분석'],
  },
  {
    title: '제품 2',
    subtitle: '정밀 분석',
    description:
      '미세 농도까지 검출하는 광학·전기화학 하이브리드 센서를 탑재했습니다. 연구실과 산업 현장 모두에 적합합니다.',
    specs: ['ppb급 감도', '자동 보정', '데이터 로그'],
  },
  {
    title: '제품 3',
    subtitle: '휴대·현장형',
    description:
      '한 손에 들어오는 폼팩터로 이동 측정이 가능합니다. 배터리 수명을 최적화한 저전력 설계입니다.',
    specs: ['8시간 연속', '방수', '앱 연동'],
  },
  {
    title: '제품 4',
    subtitle: '통합 솔루션',
    description:
      '여러 센서를 하나의 허브로 묶어 대시보드에서 통합 관리합니다. 알림·리포트 자동화를 지원합니다.',
    specs: ['멀티 채널', 'API 제공', '온프레미스'],
  },
  {
    title: '제품 5',
    subtitle: '프리미엄',
    description:
      '장기 안정성 검증된 플래그십 모델입니다. 글로벌 인증을 취득했으며 대형 시설 레퍼런스가 풍부합니다.',
    specs: ['5년 보증', '전용 엔지니어', '맞춤 교육'],
  },
]
