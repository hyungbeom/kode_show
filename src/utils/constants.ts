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

// Zone 정보
export interface ZoneData {
  id: string
  text: string
  buildingPosition: [number, number, number]
}

export const ZONES: ZoneData[] = [
  { id: 'zone-1', text: 'Zone 1', buildingPosition: [0, 8 + 2.5, 125] },
  { id: 'zone-2', text: 'Zone 2', buildingPosition: [125, 8 + 2.5, 0] },
  { id: 'zone-3', text: 'Zone 3', buildingPosition: [0, 8 + 2.5, -125] },
  { id: 'zone-4', text: 'Zone 4', buildingPosition: [-125, 8 + 2.5, 0] },
  { id: 'zone-5', text: 'Zone 5', buildingPosition: [150, 4 + 2.5, 150] },
  { id: 'zone-6', text: 'Zone 6', buildingPosition: [-150, 4 + 2.5, -150] },
  { id: 'zone-7', text: 'Zone 7', buildingPosition: [-60, 4 + 2.5, -60] },
  { id: 'zone-8', text: 'Zone 8', buildingPosition: [150, 0 + 2.5, -150] },
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
