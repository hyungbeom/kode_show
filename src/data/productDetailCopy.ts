/** 제품 캐러셀 상세 패널용 문구 — 필요 시 수정 */
export interface ProductDetailCopy {
  title: string
  subtitle: string
  description: string
  specs: string[]
}

export const PRODUCT_DETAIL_LIST: ProductDetailCopy[] = [
  {
    title: '제품 1',
    subtitle: '환경 측정 라인업',
    description:
      '실시간 데이터 수집과 클라우드 연동을 지원하는 현장형 장비입니다. 설치가 간편하고 유지보수 부담이 적습니다.',
    specs: ['실시간 모니터링', 'IP 등급 옵션', '3년 무상 점검'],
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
