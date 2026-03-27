import { ZONE_ID_LAB } from '../utils/constants'

export type ZoneSlideFrom = 'left' | 'right'

export interface ZoneRichSection {
  titleKo: string
  titleEn: string
  intro: string
  mainPoints: string
  importance: string
}

export interface ZoneRichPanelConfig {
  slideFrom: ZoneSlideFrom
  sections: ZoneRichSection[]
}

export const ZONE_RICH_PANELS: Record<string, ZoneRichPanelConfig> = {
  [ZONE_ID_LAB]: {
    slideFrom: 'right',
    sections: [
      {
        titleKo: '배출가스 측정·분석',
        titleEn: 'Emission Gas Measurement & Analysis',
        intro:
          '산업 현장의 굴뚝이나 자동차 배기구 등에서 대기 중으로 배출되는 오염물질을 실시간으로 측정하고 분석하는 장비들입니다.',
        mainPoints:
          '미세먼지(PM10, PM2.5), 질소산화물(NOx), 황산화물(SOx), 일산화탄소(CO), 휘발성유기화합물(VOCs) 등을 감지합니다.',
        importance:
          '탄소중립과 대기환경보전법이 강화되면서 공장이나 발전소 등에서는 배출 허용 기준치를 반드시 지켜야 합니다. 이를 위해 고도로 정밀한 가스 분석 센서와 광학 측정 장비 등이 전시되며, 대기 오염을 예방하는 가장 첫 번째 단계로 평가받습니다.',
      },
      {
        titleKo: '유해물질 측정·분석',
        titleEn: 'Hazardous Substance Measurement & Analysis',
        intro:
          '수질, 토양, 대기, 폐기물 등 다양한 환경 매체에 포함된 중금속, 환경호르몬, 독성 화학물질 등의 유해물질 농도를 정밀하게 분석하는 기기입니다.',
        mainPoints:
          '크로마토그래피(GC, HPLC), 질량분석기(MS), 분광광도계 등 실험실 및 현장에서 쓰이는 고가의 초정밀 분석 장비들이 포함됩니다.',
        importance:
          '눈에 보이지 않는 극미량의 오염물질이라도 생태계와 인체에 치명적일 수 있기 때문에, 이를 ppb(10억 분의 1), ppt(1조 분의 1) 단위까지 찾아내는 최첨단 분석 기술이 소개됩니다. 최근에는 먹는 물이나 실내공기질의 안전성이 중요해지면서 더욱 각광받는 분야입니다.',
      },
      {
        titleKo: '소음·진동 측정',
        titleEn: 'Noise & Vibration Measurement',
        intro:
          '건설 현장, 교통시설, 산업단지 등에서 발생하는 소음 및 진동 공해를 측정하여 쾌적한 생활 환경을 보장하기 위한 장비입니다.',
        mainPoints:
          '휴대용 소음계, 진동 레벨계, 주파수 분석기, 3D 소음 맵핑 시스템 등이 전시됩니다.',
        importance:
          "현대 사회에서 층간 소음이나 공사장 소음 등 '감각 공해'로 인한 민원이 급증하고 있습니다. 환경 분쟁을 해결하고 법적 기준을 입증하기 위해 측정 데이터의 신뢰성이 매우 중요하며, 최근에는 소음 발생원을 추적하는 스마트 카메라 형태의 장비들도 등장하고 있습니다.",
      },
      {
        titleKo: '유량측정',
        titleEn: 'Flow Measurement',
        intro:
          '하천의 수량, 상하수도 관망, 폐수 처리장 등에서 이동하는 물이나 가스, 액체의 흐름(유량)을 정확히 계측하는 기기입니다.',
        mainPoints:
          '초음파 유량계, 전자기 유량계, 코리올리 질량 유량계 등 다양한 방식의 센서가 포함됩니다.',
        importance:
          '하·폐수 처리장이나 스마트 워터 그리드(지능형 물관리망)에서 정확한 유량 측정은 처리 약품의 투입량을 결정하고 누수를 방지하는 핵심 데이터입니다. 에너지 효율을 높이고 수자원을 효율적으로 관리하기 위해 필수적인 기술입니다.',
      },
      {
        titleKo: '모니터링 시설 및 시스템',
        titleEn: 'Monitoring Facilities',
        intro:
          '단순한 기기 단위의 측정을 넘어, 측정된 데이터를 수집·통신·분석하여 통합적으로 관리하는 관제 시스템 및 솔루션입니다.',
        mainPoints:
          '굴뚝원격감시체계(TMS), 수질원격감시체계(Water TMS), IoT(사물인터넷) 기반 스마트 환경 모니터링 플랫폼, 드론/로봇을 활용한 원격 측정 시스템 등.',
        importance:
          "최근 환경 산업의 핵심 트렌드인 '디지털 전환(DX)'을 가장 잘 보여주는 분야입니다. 현장에서 측정된 방대한 데이터가 클라우드로 전송되고, 인공지능(AI)이 이를 분석해 오염 사고를 사전에 예측하거나 경고 알람을 보내는 등 스마트 환경 관리를 가능하게 합니다.",
      },
    ],
  },
}

export function getZoneRichPanel(zoneId: string | null | undefined): ZoneRichPanelConfig | undefined {
  if (!zoneId) return undefined
  return ZONE_RICH_PANELS[zoneId]
}

export function getZoneSlideFrom(zoneId: string | null | undefined): ZoneSlideFrom {
  return getZoneRichPanel(zoneId)?.slideFrom ?? 'right'
}
