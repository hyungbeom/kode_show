import { useLayoutEffect, useRef, memo, useMemo, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { useMapStore } from '../store/useMapStore'
import { ZONE_GLB_FOCUS_LIST } from '../utils/constants'
import { getZoneRichPanel } from '../data/zoneRichPanels'
import { getZoneIntroPlain } from '../data/zoneIntroPlain'
import './ZoneInfoPanel.css'

const ZoneInfoPanel = memo(function ZoneInfoPanel({ zoneId, onClose }) {
  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const boxRef = useRef(null)
  const sectionsRef = useRef([])
  const prevZoneIdRef = useRef(null)
  const isVisibleRef = useRef(false)
  /** 모든 관 공통: 소개 | 업체 리스트 */
  const [activeTab, setActiveTab] = useState('intro')

  useEffect(() => {
    setActiveTab('intro')
  }, [zoneId])

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

  const companies = useMemo(
    () => [
      { id: 1, name: 'GreenFi', category: 'Fintech', description: 'Talk with GreenFi and water a tree.' },
      { id: 2, name: 'Aven', category: 'Real Estate', description: 'Talk with Aven to renovate a house.' },
      { id: 3, name: 'TechCorp', category: 'Technology', description: 'Complete 6 fintech quests.' },
      { id: 4, name: 'DesignStudio', category: 'Design', description: 'Create amazing designs.' },
      { id: 5, name: 'DataLab', category: 'Data', description: 'Analyze data insights.' },
    ],
    []
  )

  const setSelectedCompany = useMapStore((state) => state.setSelectedCompany)
  const closeFullscreenCanvas = useMapStore((state) => state.closeFullscreenCanvas)

  const richPanel = getZoneRichPanel(zoneId)
  const zoneLabel = ZONE_GLB_FOCUS_LIST.find((z) => z.id === zoneId)?.text
  const introPlainText = getZoneIntroPlain(zoneId)

  const handleClose = () => {
    closeFullscreenCanvas()
    onClose()
  }

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

    const slideFrom = richPanel?.slideFrom ?? 'right'
    const slideDist =
      typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.55, 960) : 600
    const enterX = slideFrom === 'right' ? slideDist : -slideDist

    gsap.killTweensOf(panelRef.current)
    gsap.killTweensOf(boxRef.current)

    gsap.set(panelRef.current, { opacity: 0, x: enterX })
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

    prevZoneIdRef.current = zoneId
    isVisibleRef.current = true
  }, [zoneId, richPanel])

  // 리치 소개 탭: 섹션 스태거 (구역 변경 또는 소개 탭으로 복귀)
  useLayoutEffect(() => {
    if (!richPanel || activeTab !== 'intro') return
    const slideFrom = richPanel.slideFrom ?? 'right'
    const sectionNudge = slideFrom === 'right' ? 36 : -36
    const els = sectionsRef.current.filter(Boolean)
    if (!els.length) return
    gsap.killTweensOf(els)
    gsap.set(els, { opacity: 0, x: sectionNudge })
    gsap.to(els, {
      opacity: 1,
      x: 0,
      duration: 0.42,
      stagger: 0.09,
      ease: 'power2.out',
      delay: 0.28,
    })
  }, [activeTab, zoneId, richPanel])

  const overlayClass =
    richPanel?.slideFrom === 'left'
      ? 'zone-info-overlay zone-info-overlay--left'
      : 'zone-info-overlay zone-info-overlay--right'

  return (
    <div ref={overlayRef} className={overlayClass}>
      <div
        ref={panelRef}
        className="zone-info-panel zone-info-panel--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={boxRef} className={`zone-info-box ${richPanel ? 'zone-info-box--rich' : ''}`}>
          <div className="zone-info-header">
            <h2 className="zone-info-title">{zoneLabel || zoneInfo.title}</h2>
            <button type="button" className="zone-info-close" onClick={handleClose} aria-label="닫기">
              ×
            </button>
          </div>

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
                        <span className="zone-rich-label">주요 내용</span>
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
            <div className="zone-info-content" role="tabpanel">
              <div className="company-list">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="company-item"
                    onClick={() => {
                      setSelectedCompany(company.id, company.name)
                      handleClose()
                      window.history.pushState({}, '', `/room/${company.id}`)
                    }}
                  >
                    <div className="company-icon">{company.name.charAt(0)}</div>
                    <div className="company-info">
                      <div className="company-name">{company.name}</div>
                      <div className="company-category">{company.category}</div>
                      <div className="company-description">{company.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ZoneInfoPanel.displayName = 'ZoneInfoPanel'

export default ZoneInfoPanel
