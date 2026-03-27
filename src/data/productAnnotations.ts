/** 점선 콜아웃 — 좌표는 normalizeToUnit 이후 모델 로컬 공간(대략 ±1 범위) */
export interface ProductAnnotationSpec {
  headline: string
  bullets: string[]
  /** 모델 표면 핫스팟 */
  hotspot: [number, number, number]
  /** 핫스팟에서 텍스트 쪽 앵커까지 오프셋 (보통 X 음수 = 텍스트가 왼쪽) */
  textOffset?: [number, number, number]
}

export const PRODUCT_ANNOTATIONS: ProductAnnotationSpec[][] = [
  [
    {
      headline: 'FLUORESCENCE-BASED BACTERIA DETECTION',
      bullets: ['Detects bacteria ≥10² CFU/mL', 'Color change via fluorescence reaction'],
      hotspot: [0.08, 0.16, 0.4],
      textOffset: [-0.78, 0.06, 0.02],
    },
  ],
  [
    {
      headline: 'HIGH-SENSITIVITY SENSOR CORE',
      bullets: ['Optical–electrochemical hybrid', 'Real-time auto calibration'],
      hotspot: [0.12, 0.02, 0.32],
      textOffset: [-0.7, 0.1, 0],
    },
  ],
  [
    {
      headline: 'COMPACT FIELD UNIT',
      bullets: ['8h+ battery', 'IP-rated enclosure'],
      hotspot: [0, 0.22, 0.38],
      textOffset: [-0.68, 0.04, -0.04],
    },
  ],
  [
    {
      headline: 'UNIFIED SENSOR HUB',
      bullets: ['Multi-channel aggregation', 'Dashboard API'],
      hotspot: [0.7, -0.2, 0.6],
      textOffset: [-0.72, 0.08, 0],
    },
  ],
  [
    {
      headline: 'FLAGSHIP RELIABILITY',
      bullets: ['5-year warranty program', 'Certified global compliance'],
      hotspot: [0.05, 0.14, 0.34],
      textOffset: [-0.75, 0.1, 0.02],
    },
  ],
]
