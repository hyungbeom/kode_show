import { useState, useRef, useEffect } from 'react'
import './RoomCarouselIntro.css'

const LEEBIO_HOMEPAGE_URL = 'https://leebio.co.kr/'
/** 드롭다운 메일 링크용 처리 주소 — 실제 운영 메일로 교체 가능 */
const LEEBIO_MAIL_TO = 'mailto:info@leebio.co.kr'

/**
 * /room/1 캐러셀 최초 진입 시 — 왼쪽 상단 카피 + 추가 메뉴(⋯)
 */
export default function RoomCarouselIntro() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuWrapRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  useEffect(() => {
    if (!menuOpen) return
    const onDocDown = (e) => {
      if (!menuWrapRef.current?.contains(/** @type {Node} */ (e.target))) {
        setMenuOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const openMail = (subject, body = '') => {
    const q = new URLSearchParams()
    q.set('subject', subject)
    if (body) q.set('body', body)
    window.location.href = `${LEEBIO_MAIL_TO}?${q.toString()}`
    setMenuOpen(false)
  }

  const handleMeetingRequest = () => {
    openMail('미팅 요청', '안녕하세요. LEEBIO 미팅을 요청드립니다.\n\n')
  }

  const handleSendMessage = () => {
    openMail('문의 메시지', '안녕하세요.\n\n')
  }

  const handleBrochure = () => {
    window.open(LEEBIO_HOMEPAGE_URL, '_blank', 'noopener,noreferrer')
    setMenuOpen(false)
  }

  return (
    <div className="room-carousel-intro">
      <h2 className="room-carousel-intro__title">LEEBIO</h2>
      <p className="room-carousel-intro__desc">
        LEEBIO는 체외진단 기술을 기반으로 수질 및 환경 분석 분야로 확장한 워터테크 기업입니다. 현장에서 즉시
        수질을 측정하고 데이터를 디지털로 관리할 수 있는 솔루션을 개발하여, 공공시설, 수영장, 스마트팜 등 반복적인
        수질 관리가 필요한 환경에서 활용되고 있습니다. 주요 제품인 AQUAL 시리즈는 광학 및 전기화학 센서를 기반으로
        다양한 수질 지표를 신속하게 측정하며, 운영자의 의사결정을 지원합니다. 당사는 2025년 대한민국 물산업
        혁신창업대전 장려상 및 2026년 CES 혁신상을 수상하며 기술력과 시장성을 인정받았습니다.
      </p>
      <div className="room-carousel-intro__actions" ref={menuWrapRef}>
        <div className="room-carousel-intro__more-wrap">
          <button
            type="button"
            className="room-carousel-intro__more"
            aria-label="추가 메뉴"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="room-carousel-intro__more-dot" aria-hidden />
            <span className="room-carousel-intro__more-dot" aria-hidden />
            <span className="room-carousel-intro__more-dot" aria-hidden />
          </button>
          {menuOpen ? (
            <ul className="room-carousel-intro__dropdown" role="menu">
              <li role="none">
                <button type="button" className="room-carousel-intro__dropdown-item" role="menuitem" onClick={handleMeetingRequest}>
                  미팅요청
                </button>
              </li>
              <li role="none">
                <button type="button" className="room-carousel-intro__dropdown-item" role="menuitem" onClick={handleSendMessage}>
                  메세지 보내기
                </button>
              </li>
              <li role="none">
                <button type="button" className="room-carousel-intro__dropdown-item" role="menuitem" onClick={handleBrochure}>
                  브로슈어
                </button>
              </li>
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}
