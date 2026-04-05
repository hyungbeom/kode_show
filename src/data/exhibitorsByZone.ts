import raw from './exhibitorsByZone.json'

/** 구역 업체 리스트(JSON) — DB 연동 전 정적 데이터 */
export type ZoneExhibitor = {
  id: number
  name: string
  category: string
  description: string
  imageUrl: string
  /** 검색용 별칭·제품명 등 (선택) */
  keywords?: string[]
}

type ExhibitorsByZoneFile = Record<string, ZoneExhibitor[]>

const exhibitorsByZone = raw as ExhibitorsByZoneFile

export function getCompaniesForZone(zoneId: string | null | undefined): ZoneExhibitor[] {
  if (!zoneId) return []
  const list = exhibitorsByZone[zoneId]
  return Array.isArray(list) ? list : []
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
