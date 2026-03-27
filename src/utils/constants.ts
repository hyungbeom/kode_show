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

/** Zone id — 카메라 구도·스토어·LandHover에서 사용 */
export const ZONE_ID_WATER = 'zone-water' as const
export const ZONE_ID_AIR = 'zone-air' as const
export const ZONE_ID_LAB = 'zone-lab' as const
export const ZONE_ID_CARBON = 'zone-carbon' as const
export const ZONE_ID_EARTH = 'zone-earth' as const
export const ZONE_ID_INST = 'zone-inst' as const

/** 구역 포커스 카메라 구도 (Orthographic: 오프셋 + 줌) */
export interface ZoneCameraFraming {
  offsetX: number
  offsetY: number
  offsetZ: number
  targetZoom: number
  duration: number
  /**
   * 카메라 위치와 look-at 타깃을 **같은 값만큼** 평행 이동 (시선 벡터 유지 → 회전 없이 화면만 팬).
   * 수질관을 화면 왼쪽에 두려면 월드에서 리그를 오른쪽으로 옮기는 느낌으로 +X / +Z 등 조절.
   */
  cameraShiftX?: number
  cameraShiftY?: number
  cameraShiftZ?: number
}

/** 알 수 없는 zone id·폴백용 */
export const ZONE_DEFAULT_CAMERA_FRAMING: ZoneCameraFraming = {
  offsetX: 200,
  offsetY: 160,
  offsetZ: 200,
  targetZoom: 10,
  duration: 1.5,
}

/** 수질관 — offset: 아이소 거리 / cameraShift: 카메라+타깃 동시 팬(회전 없음) */
export const ZONE_WATER_CAMERA_FRAMING: ZoneCameraFraming = {
  offsetX: 0,
  offsetY: 80,
  offsetZ: 200,
  targetZoom: 10,
  duration: 1.5,
  cameraShiftX: 48,
  cameraShiftZ: 0,
}

/** 대기관 (기본값은 수질과 동일 출발 — 맵에 맞게 아래만 수정) */
export const ZONE_AIR_CAMERA_FRAMING: ZoneCameraFraming = {
  offsetX: 450,
  offsetY: 80,
  offsetZ: 200,
  targetZoom: 10,
  duration: 1.5,
  cameraShiftX: -58,
  cameraShiftZ: 30,
}

/** 측정분석 */
export const ZONE_LAB_CAMERA_FRAMING: ZoneCameraFraming = {
  offsetX: -150,
  offsetY: 160,
  offsetZ: 200,
  targetZoom: 10,
  duration: 1.5,
  cameraShiftX: 30,
  cameraShiftZ: 30,
}

/** 탄소중립 */
export const ZONE_CARBON_CAMERA_FRAMING: ZoneCameraFraming = {
  offsetX: 200,
  offsetY: 160,
  offsetZ: 200,
  targetZoom: 10,
  duration: 1.5,
}

/** 외국관 */
export const ZONE_EARTH_CAMERA_FRAMING: ZoneCameraFraming = {
  offsetX: 200,
  offsetY: 160,
  offsetZ: 200,
  targetZoom: 10,
  duration: 1.5,
}

/** 기관 및 홍보 */
export const ZONE_INST_CAMERA_FRAMING: ZoneCameraFraming = {
  offsetX: 200,
  offsetY: 160,
  offsetZ: 200,
  targetZoom: 10,
  duration: 1.5,
}

/** CameraController: zone id → 구도 (각 관은 여기서만 골라 씀) */
export const ZONE_CAMERA_FRAMING_BY_ID: Record<string, ZoneCameraFraming> = {
  [ZONE_ID_WATER]: ZONE_WATER_CAMERA_FRAMING,
  [ZONE_ID_AIR]: ZONE_AIR_CAMERA_FRAMING,
  [ZONE_ID_LAB]: ZONE_LAB_CAMERA_FRAMING,
  [ZONE_ID_CARBON]: ZONE_CARBON_CAMERA_FRAMING,
  [ZONE_ID_EARTH]: ZONE_EARTH_CAMERA_FRAMING,
  [ZONE_ID_INST]: ZONE_INST_CAMERA_FRAMING,
}

export function getZoneCameraFraming(zoneId: string | null | undefined): ZoneCameraFraming {
  if (!zoneId) return ZONE_DEFAULT_CAMERA_FRAMING
  return ZONE_CAMERA_FRAMING_BY_ID[zoneId] ?? ZONE_DEFAULT_CAMERA_FRAMING
}

export const ZONE_GLB_FOCUS_LIST: ZoneGlbFocus[] = [
  { id: ZONE_ID_WATER, text: '수질관', glbNode: 'CH_Water' },
  { id: ZONE_ID_AIR, text: '대기관', glbNode: 'CH_Air' },
  { id: ZONE_ID_LAB, text: '측정분석', glbNode: 'CH_Microscope' },
  { id: ZONE_ID_CARBON, text: '탄소중립', glbNode: 'CH_Leaf_Body' },
  { id: ZONE_ID_EARTH, text: '외국관', glbNode: 'Earth' },
  { id: ZONE_ID_INST, text: '기관 및 홍보', glbNode: 'Institution_Builidng' },
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
