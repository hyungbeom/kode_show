import { useLayoutEffect, useRef, memo, useMemo, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { useMapStore } from '../store/useMapStore'
import { ZONE_GLB_FOCUS_LIST } from '../utils/constants'
import { getCompaniesForZone } from '../data/exhibitorsByZone'
import { getZoneRichPanel } from '../data/zoneRichPanels'
import { getZoneIntroPlain } from '../data/zoneIntroPlain'
import { ZoneCompanyCardStack } from './ZoneCompanyCardStack'
import './ZoneInfoPanel.css'

/** 3D 룸 미제공 업체 카드 클릭 시 — ENVEX 온라인 전시관 기본 업체 페이지 */
const ENVEX_ONLINE_ENTERPRISE_DEFAULT =
  'https://envex.or.kr/online/kor/enterprise.asp?cd=3426'

/** 모바일 시트 — 검정 라운드 스퀘어 + 흰 플라스크 아이콘 */
function ZoneMobileBrandIcon() {
  return (
    <div className="zone-info-brand-icon" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10 3h4v2.8c0 .4.12.78.34 1.1l3.66 5.5A3.2 3.2 0 0115.2 19H8.8a3.2 3.2 0 01-1.8-5.6l3.66-5.5A2 2 0 0010 5.8V3z"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M9 14.5h6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

const ZoneInfoPanel = memo(function ZoneInfoPanel({ zoneId, onClose }) {
  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const boxRef = useRef(null)
  const sectionsRef = useRef([])
  const prevZoneIdRef = useRef(null)
  const isVisibleRef = useRef(false)
  /** 모든 관 공통: 소개 | 업체 리스트 */
  const [activeTab, setActiveTab] = useState('intro')
  /** 검색 진입 시 카드 스택·PC 리스트 초기 포커스 (패널 언마운트 시 초기화됨) */
  const [stackFocusCompanyId, setStackFocusCompanyId] = useState(null)
  const companyListRef = useRef(null)
  const setZonePanelSearchDeepLink = useMapStore((state) => state.setZonePanelSearchDeepLink)

  const companies = useMemo(() => getCompaniesForZone(zoneId), [zoneId])

  useLayoutEffect(() => {
    if (!zoneId) return
    const link = useMapStore.getState().zonePanelSearchDeepLink
    if (link?.focusCompanyId != null && companies.some((c) => c.id === link.focusCompanyId)) {
      setStackFocusCompanyId(link.focusCompanyId)
      setActiveTab('companies')
    } else {
      setStackFocusCompanyId(null)
      setActiveTab('intro')
    }
  }, [zoneId, companies])

  useEffect(() => {
    const link = useMapStore.getState().zonePanelSearchDeepLink
    if (!zoneId || link?.focusCompanyId == null) return
    if (!companies.some((c) => c.id === link.focusCompanyId)) {
      setZonePanelSearchDeepLink(null)
      return
    }
    const id = requestAnimationFrame(() => {
      setZonePanelSearchDeepLink(null)
    })
    return () => cancelAnimationFrame(id)
  }, [zoneId, companies, setZonePanelSearchDeepLink])

  useEffect(() => {
    if (activeTab !== 'companies' || stackFocusCompanyId == null) return
    const root = companyListRef.current
    if (!root) return
    const el = root.querySelector(`[data-company-id="${stackFocusCompanyId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeTab, stackFocusCompanyId, zoneId])

  const zoneDescriptions = useMemo(
    () => ({
      'zone-1': {
        title: 'Zone 1',
        description:
          "This zone represents our creative workspace where innovative ideas come to life. It's a space dedicated to collaboration and innovation.",
      },
      'zone-2': {
        title: 'Zone 2',
        description:
          'A hub for technology and development. This zone showcases our technical capabilities and engineering excellence.',
      },
      'zone-3': {
        title: 'Zone 3',
        description:
          'The heart of our design process. This zone is where creativity meets functionality, where concepts transform into beautiful realities.',
      },
      'zone-4': {
        title: 'Zone 4',
        description:
          'A space for experimentation and learning. This zone represents our commitment to continuous improvement and innovation.',
      },
      'zone-5': {
        title: 'Zone 5',
        description:
          'Where ideas scale and grow. This zone demonstrates our ability to take concepts from prototype to production.',
      },
      'zone-6': {
        title: 'Zone 6',
        description:
          'A collaborative environment for team building and creative sessions. This zone fosters innovation through teamwork.',
      },
      'zone-7': {
        title: 'Zone 7',
        description:
          'The central hub of our operations. This zone connects all aspects of our work and serves as the foundation for everything we do.',
      },
      'zone-8': {
        title: 'Zone 8',
        description:
          'A space dedicated to automation and efficiency. This zone showcases our technical infrastructure and scalable systems.',
      },
    }),
    []
  )

  const setSelectedCompany = useMapStore((state) => state.setSelectedCompany)
  const closeFullscreenCanvas = useMapStore((state) => state.closeFullscreenCanvas)
  const mapLayoutBrowserWidthPx = useMapStore((state) => state.mapLayoutBrowserWidthPx)
  const isMobileSheet = mapLayoutBrowserWidthPx < 768

  const richPanel = getZoneRichPanel(zoneId)
  const zoneLabel = ZONE_GLB_FOCUS_LIST.find((z) => z.id === zoneId)?.text
  const introPlainText = getZoneIntroPlain(zoneId)

  const handleClose = () => {
    closeFullscreenCanvas()
    onClose()
  }

  /** 「방문하기」 — visitExternalUrl 있으면 현재 창에서 이동, 3D 룸 있으면 /room/{id}, 없으면 ENVEX */
  const navigateToCompanyRoom = useCallback(
    (company) => {
      const visitOut = company.visitExternalUrl?.trim()
      if (visitOut) {
        handleClose()
        window.location.assign(visitOut)
        return
      }
      if (company.has3dRoom) {
        setSelectedCompany(company.id, company.name)
        handleClose()
        window.history.pushState({}, '', `/room/${company.id}`)
        return
      }
      const url = company.envexOnlineUrl?.trim() || ENVEX_ONLINE_ENTERPRISE_DEFAULT
      handleClose()
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [setSelectedCompany, handleClose],
  )

  const zoneInfo = zoneDescriptions[zoneId] || {
    title: zoneLabel || `Zone ${zoneId?.replace('zone-', '')}`,
    description: 'Zone information',
  }

  // 패널 슬라이드 (구역 변경 시)
  useLayoutEffect(() => {
    if (!panelRef.current || !boxRef.current) return

    const isSameZone = prevZoneIdRef.current === zoneId
    if (isVisibleRef.current && isSameZone) return

    if (isVisibleRef.current && !isSameZone) {
      prevZoneIdRef.current = zoneId
      isVisibleRef.current = true
      return
    }

    const slideDist =
      typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.55, 960) : 600
    /* 넓은 화면: 패널을 왼쪽에 두므로 화면 왼쪽 바깥에서 슬라이드 인 */
    const enterX = isMobileSheet ? 0 : -slideDist

    gsap.killTweensOf(panelRef.current)
    gsap.killTweensOf(boxRef.current)

    if (isMobileSheet) {
      gsap.set(panelRef.current, { opacity: 0, x: 0, yPercent: 100 })
      gsap.set(boxRef.current, { rotationY: 0 })
      gsap.to(panelRef.current, {
        opacity: 1,
        yPercent: 0,
        duration: 0.52,
        ease: 'power3.out',
        delay: 0.04,
      })
    } else {
      gsap.set(panelRef.current, { opacity: 0, x: enterX, yPercent: 0 })
      gsap.set(boxRef.current, { rotationY: richPanel ? 0 : -Math.PI / 4 })

      gsap.to(panelRef.current, {
        opacity: 1,
        x: 0,
        duration: 0.55,
        ease: 'power3.out',
        delay: 0.05,
      })

      if (!richPanel) {
        gsap.to(boxRef.current, {
          rotationY: 0,
          duration: 0.5,
          ease: 'power2.out',
          delay: 0.1,
        })
      }
    }

    prevZoneIdRef.current = zoneId
    isVisibleRef.current = true
  }, [zoneId, richPanel, isMobileSheet])

  // 리치 소개 탭: 섹션 스태거 (구역 변경 또는 소개 탭으로 복귀)
  useLayoutEffect(() => {
    if (!richPanel || activeTab !== 'intro') return
    /* 데스크톱은 패널이 왼쪽 → 소개 섹션은 왼쪽에서 스태거 */
    const sectionNudgeX = isMobileSheet ? 0 : -36
    const sectionNudgeY = 28
    const els = sectionsRef.current.filter(Boolean)
    if (!els.length) return
    gsap.killTweensOf(els)
    if (isMobileSheet) {
      gsap.set(els, { opacity: 0, x: 0, y: sectionNudgeY })
      gsap.to(els, {
        opacity: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.09,
        ease: 'power2.out',
        delay: 0.28,
      })
    } else {
      gsap.set(els, { opacity: 0, x: sectionNudgeX, y: 0 })
      gsap.to(els, {
        opacity: 1,
        x: 0,
        duration: 0.42,
        stagger: 0.09,
        ease: 'power2.out',
        delay: 0.28,
      })
    }
  }, [activeTab, zoneId, richPanel, isMobileSheet])

  const overlayClass = isMobileSheet
    ? 'zone-info-overlay zone-info-overlay--mobile-sheet'
    : 'zone-info-overlay zone-info-overlay--left'

  return (
    <div ref={overlayRef} className={overlayClass}>
      <div
        ref={panelRef}
        className={`zone-info-panel zone-info-panel--wide${isMobileSheet ? ' zone-info-panel--mobile-sheet' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={boxRef} className={`zone-info-box ${richPanel ? 'zone-info-box--rich' : ''}`}>
          <div className="zone-info-sheet-header">
            {isMobileSheet ? (
              <div className="zone-info-sheet-header__top">
                <div className="zone-info-sheet-header__title-row">
                  <ZoneMobileBrandIcon />
                  <h2 className="zone-info-title">{zoneLabel || zoneInfo.title}</h2>
                </div>
                <button type="button" className="zone-info-close" onClick={handleClose} aria-label="닫기">
                  ×
                </button>
              </div>
            ) : (
              <div className="zone-info-header">
                <h2 className="zone-info-title">{zoneLabel || zoneInfo.title}</h2>
                <button type="button" className="zone-info-close" onClick={handleClose} aria-label="닫기">
                  ×
                </button>
              </div>
            )}

            <div
              className={isMobileSheet ? 'zone-info-tabs-wrap' : 'zone-info-tabs-wrap zone-info-tabs-wrap--pass-through'}
            >
              <div className="zone-info-tabs" role="tablist" aria-label="구역 정보">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'intro'}
                  className={`zone-info-tab ${activeTab === 'intro' ? 'zone-info-tab--active' : ''}`}
                  onClick={() => setActiveTab('intro')}
                >
                  소개
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'companies'}
                  className={`zone-info-tab ${activeTab === 'companies' ? 'zone-info-tab--active' : ''}`}
                  onClick={() => setActiveTab('companies')}
                >
                  업체 리스트
                </button>
              </div>
            </div>
          </div>

          <div className="zone-info-sheet-body">
            {activeTab === 'intro' && (
              <div
                className={`zone-info-content ${richPanel ? 'zone-info-content--rich' : ''}`}
                role="tabpanel"
              >
                {richPanel ? (
                  <>
                    {richPanel.sections.map((section, i) => (
                      <article
                        key={`${zoneId}-${section.titleKo}-${i}`}
                        ref={(el) => {
                          sectionsRef.current[i] = el
                        }}
                        className="zone-rich-section"
                      >
                        <div className="zone-rich-section__index">{i + 1}</div>
                        <h3 className="zone-rich-section__title">{section.titleKo}</h3>
                        <p className="zone-rich-section__subtitle">{section.titleEn}</p>
                        <p className="zone-rich-intro">{section.intro}</p>
                        <div className="zone-rich-block">
                          <span className="zone-rich-label">주요내용</span>
                          <p className="zone-rich-text">{section.mainPoints}</p>
                        </div>
                        <div className="zone-rich-block zone-rich-block--importance">
                          <span className="zone-rich-label">중요성</span>
                          <p className="zone-rich-text">{section.importance}</p>
                        </div>
                      </article>
                    ))}
                  </>
                ) : introPlainText ? (
                  <p className="zone-intro-plain">{introPlainText}</p>
                ) : (
                  <div className="zone-info-description-text zone-info-description-text--tab">
                    {zoneInfo.description}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'companies' && (
              <div
                className={`zone-info-content${isMobileSheet ? ' zone-info-content--company-stack' : ''}`}
                role="tabpanel"
              >
                {isMobileSheet ? (
                  <ZoneCompanyCardStack
                    companies={companies}
                    onOpenCompany={navigateToCompanyRoom}
                    stackKey={zoneId ?? ''}
                    initialCompanyId={stackFocusCompanyId}
                  />
                ) : (
                  <div className="company-list" ref={companyListRef}>
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        data-company-id={company.id}
                        className={`company-item${stackFocusCompanyId === company.id ? ' company-item--focus' : ''}`}
                        onClick={() => navigateToCompanyRoom(company)}
                      >
                        <div className="company-icon">{company.name.charAt(0)}</div>
                        <div className="company-info">
                          <div className="company-name">{company.name}</div>
                          <div className="company-keywords" role="list" aria-label="키워드">
                            {company.keywords.map((kw) => (
                              <span key={kw} className="company-keyword-tag" role="listitem">
                                {kw}
                              </span>
                            ))}
                          </div>
                          <div className="company-description">{company.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

ZoneInfoPanel.displayName = 'ZoneInfoPanel'

export default ZoneInfoPanel
