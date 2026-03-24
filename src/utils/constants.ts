/**
 * 공통 상수 정의
 * 재사용 가능한 상수들을 한 곳에 모아 관리
 */

// 업체 정보
export const COMPANY_NAMES: Record<number, string> = {
  1: 'GreenFi',
  2: 'Aven',
  3: 'TechCorp',
  4: 'DesignStudio',
  5: 'DataLab',
}

/** Zone 리스트 — world.glb 노드 중심으로 아이소메트릭 줌 (WorldModel이 좌표 채움) */
export interface ZoneGlbFocus {
  id: string
  text: string
  /** glbFocusPositions / GLB 노드 이름 */
  glbNode: string
}

export const ZONE_GLB_FOCUS_LIST: ZoneGlbFocus[] = [
  { id: 'zone-water', text: '수질관', glbNode: 'CH_Water' },
  { id: 'zone-air', text: '대기관', glbNode: 'CH_Air' },
  { id: 'zone-lab', text: '측정분석', glbNode: 'CH_Microscope' },
  { id: 'zone-carbon', text: '탄소중립', glbNode: 'CH_Leaf_Body' },
  { id: 'zone-earth', text: '외국관', glbNode: 'Earth' },
  { id: 'zone-inst', text: '기관 및 홍보', glbNode: 'Institution_Builidng' },
]

// 애니메이션 기본값
export const ANIMATION_DURATION = {
  FAST: 0.3,
  NORMAL: 0.5,
  SLOW: 0.8,
} as const

export const ANIMATION_EASE = {
  IN: 'power2.in',
  OUT: 'power2.out',
  IN_OUT: 'power2.inOut',
  BACK_OUT: 'back.out(1.7)',
  BACK_IN: 'back.in(1.7)',
} as const

// 3D 씬 설정
export const SCENE_CONFIG = {
  SCALE: 5,
  GROUND_LEVEL: 0,
  SECOND_FLOOR_LEVEL: 0.8 * 5,  // 4
  THIRD_FLOOR_LEVEL: 1.6 * 5,   // 8
  ZONE_HEIGHT: 1 * 5,           // 5
} as const

// 모델 파일 경로 관리
export const MODEL_PATHS = {
  // 홈페이지 전용 모델들
  HOME: {
    BASE_PATH: '/models/home/',
    // 예시: 메인 배경 모델, 로고 모델 등
    // BACKGROUND: '/models/home/background.glb',
    // LOGO: '/models/home/logo.glb',
  },
  // 맵 씬 모델들
  MAP: {
    BASE_PATH: '/models/',
    // 예시: 맵 모델, 건물 모델 등
  },
  // 룸 씬 모델들
  ROOM: {
    BASE_PATH: '/models/',
    SHOW_ROOM: '/models/show_room2.glb',
  },
  // 플레이어 모델
  PLAYER: {
    AMONG_US: '/models/amongus.glb',
    CAR: '/models/car.glb',
  },
} as const
