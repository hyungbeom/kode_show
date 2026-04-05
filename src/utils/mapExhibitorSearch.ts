import { getCompaniesForZone, type ZoneExhibitor } from '../data/exhibitorsByZone'
import { ZONE_GLB_FOCUS_LIST } from './constants'

export type ExhibitorSearchHit = {
  zoneId: string
  glbNode: string
  zoneLabel: string
  company: ZoneExhibitor
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function companyMatchesQuery(q: string, company: ZoneExhibitor, zoneLabel: string): boolean {
  if (!q) return false
  const haystacks = [
    company.name,
    company.booth,
    company.description,
    zoneLabel,
    ...company.keywords,
  ]
    .map((t) => normalize(String(t)))
    .filter(Boolean)
  return haystacks.some((h) => h.includes(q))
}

/**
 * 전시 구역 업체 검색 — 이름·카테고리·설명·관 라벨·keywords(선택)
 */
export function searchExhibitors(query: string, limit = 24): ExhibitorSearchHit[] {
  const q = normalize(query)
  if (!q) return []

  const hits: ExhibitorSearchHit[] = []
  for (const z of ZONE_GLB_FOCUS_LIST) {
    const companies = getCompaniesForZone(z.id)
    for (const company of companies) {
      if (companyMatchesQuery(q, company, z.text)) {
        hits.push({
          zoneId: z.id,
          glbNode: z.glbNode,
          zoneLabel: z.text,
          company,
        })
        if (hits.length >= limit) return hits
      }
    }
  }
  return hits
}
