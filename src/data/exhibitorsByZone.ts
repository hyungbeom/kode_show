import raw from './exhibitorsByZone.json'

/** 구역 업체 리스트(JSON) — DB 연동 전 정적 데이터 */
export type ZoneExhibitor = {
  id: number
  name: string
  /** 전시장 부스 번호 (예: A14, F21) */
  booth: string
  /** 배치도 원본 이미지 기준 초점 X (100~3500 권장) */
  mapFocusX: number
  /** 배치도 원본 이미지 기준 초점 Y (100~2000 권장) */
  mapFocusY: number
  /** 회사 홈페이지 (선택) */
  websiteUrl?: string
  /** 브로슈어 PDF 등 다운로드 URL (선택) */
  brochureUrl?: string
  /** 표시·검색용 키워드 태그 */
  keywords: string[]
  /** 소개 페이지 상단 카테고리 한 줄 (미지정 시 키워드·구역으로 대체) */
  categoryLabel?: string
  /** 대표자 */
  ceoName?: string
  /** 본사·사무실 주소 */
  address?: string
  /** 대표 전화 */
  phone?: string
  /** 설립연도 */
  foundedYear?: string | number
  /** 직원 수 표기 (예: 32명) */
  employeeCount?: string
  /** 매출액 등 표기 */
  revenue?: string
  /** 3D 전시 룸(페이지) 제공 여부 */
  has3dRoom: boolean
  /**
   * has3dRoom이 false일 때 카드 클릭 시 열 ENVEX 온라인 전시관 업체 페이지 URL
   * (미지정 시 공통 기본 URL 사용)
   */
  envexOnlineUrl?: string
  description: string
  imageUrl: string
}

type ExhibitorsByZoneFile = Record<string, ZoneExhibitor[]>

const exhibitorsByZone = raw as ExhibitorsByZoneFile

export function getCompaniesForZone(zoneId: string | null | undefined): ZoneExhibitor[] {
  if (!zoneId) return []
  const list = exhibitorsByZone[zoneId]
  return Array.isArray(list) ? list : []
}

/** 전 구역에서 업체 id로 단일 레코드 조회 */
export function getCompanyById(companyId: number | null | undefined): ZoneExhibitor | null {
  if (companyId == null || !Number.isFinite(companyId)) return null
  for (const list of Object.values(exhibitorsByZone)) {
    if (!Array.isArray(list)) continue
    const found = list.find((c) => c.id === companyId)
    if (found) return found
  }
  return null
}

/** `/room/{id}`·앱 라우팅용 — JSON 전체에서 id → 이름 (id는 전 구역에서 유일해야 함) */
export const COMPANY_NAMES: Record<number, string> = (() => {
  const map: Record<number, string> = {}
  for (const list of Object.values(exhibitorsByZone)) {
    for (const c of list) {
      if (map[c.id] !== undefined && map[c.id] !== c.name) {
        console.warn(
          `[exhibitorsByZone] company id 충돌: ${c.id} (${map[c.id]} vs ${c.name})`,
        )
      }
      map[c.id] = c.name
    }
  }
  return map
})()
