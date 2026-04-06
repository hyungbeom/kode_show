import { useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import './RoomCompanyIntro.css'

/**
 * @param {{
 *   variant?: 'overlay' | 'scroll'
 *   company: import('../data/exhibitorsByZone').ZoneExhibitor | null
 *   onBack: () => void
 *   onEnterRoom: () => void
 * }} props
 */
export default function RoomCompanyIntro({
  variant = 'overlay',
  company,
  onBack,
  onEnterRoom,
}) {
  const rootRef = useRef(null)
  const isScroll = variant === 'scroll'

  const handleEnter = useCallback(() => {
    if (isScroll) return
    const el = rootRef.current
    if (!el) {
      onEnterRoom()
      return
    }
    gsap.to(el, {
      opacity: 0,
      duration: 0.38,
      ease: 'power2.in',
      onComplete: () => onEnterRoom(),
    })
  }, [isScroll, onEnterRoom])

  const rootClass = ['room-company-intro', isScroll ? 'room-company-intro--scroll' : '']
    .filter(Boolean)
    .join(' ')

  if (!company) {
    return (
      <div className={`${rootClass} room-company-intro--empty`} ref={isScroll ? undefined : rootRef}>
        <p className="room-company-intro__empty-msg">업체 정보를 불러올 수 없습니다.</p>
        <button type="button" className="room-company-intro__cta" onClick={onBack}>
          돌아가기
        </button>
      </div>
    )
  }

  const category =
    company.categoryLabel?.trim() ||
    (company.keywords.length > 0 ? company.keywords[0] : '업체 소개')

  const rows = [
    company.ceoName != null && company.ceoName !== ''
      ? { label: '대표자', value: String(company.ceoName) }
      : null,
    company.address?.trim() ? { label: '주소', value: company.address.trim() } : null,
    company.phone?.trim() ? { label: '연락처', value: company.phone.trim() } : null,
    company.websiteUrl?.trim()
      ? {
          label: '홈페이지',
          value: company.websiteUrl.trim(),
          href: company.websiteUrl.trim().startsWith('http')
            ? company.websiteUrl.trim()
            : `https://${company.websiteUrl.trim()}`,
        }
      : null,
    company.foundedYear != null && company.foundedYear !== ''
      ? { label: '설립년도', value: String(company.foundedYear) }
      : null,
    company.employeeCount?.trim() ? { label: '직원수', value: company.employeeCount.trim() } : null,
    company.revenue?.trim() ? { label: '매출액', value: company.revenue.trim() } : null,
  ].filter(Boolean)

  return (
    <div ref={isScroll ? undefined : rootRef} className={rootClass}>
      <header className="room-company-intro__header">
        <button type="button" className="room-company-intro__back" onClick={onBack} aria-label="뒤로">
          <span aria-hidden>←</span>
        </button>
        <div className="room-company-intro__brand">
          {company.imageUrl ? (
            <img
              src={company.imageUrl}
              alt=""
              className="room-company-intro__logo"
              loading="eager"
              decoding="async"
            />
          ) : null}
          <h1 className="room-company-intro__title">{company.name}</h1>
        </div>
        <span className="room-company-intro__header-spacer" aria-hidden />
      </header>

      <div className="room-company-intro__scroll">
        <p className="room-company-intro__category">{category}</p>

        {company.keywords.length > 0 ? (
          <div className="room-company-intro__tags" aria-label="키워드">
            {company.keywords.map((kw) => (
              <span key={kw} className="room-company-intro__tag">
                #{kw}
              </span>
            ))}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <dl className="room-company-intro__specs">
            {rows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="room-company-intro__spec-row">
                <dt className="room-company-intro__spec-label">{row.label}</dt>
                <dd className="room-company-intro__spec-value">
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="room-company-intro__link"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        <section className="room-company-intro__about" aria-labelledby="room-company-intro-about-h">
          <h2 id="room-company-intro-about-h" className="room-company-intro__about-title">
            회사소개
          </h2>
          <p className="room-company-intro__about-text">{company.description}</p>
        </section>

        {isScroll ? (
          <p className="room-company-intro__scroll-hint" role="status">
            <span className="room-company-intro__scroll-hint-chev" aria-hidden>
              ↓
            </span>
            아래로 스크롤하면 3D 전시 룸이 열립니다
          </p>
        ) : null}
      </div>

      {!isScroll ? (
        <div className="room-company-intro__footer">
          <button type="button" className="room-company-intro__cta" onClick={handleEnter}>
            3D 전시 룸 입장
          </button>
        </div>
      ) : null}
    </div>
  )
}
