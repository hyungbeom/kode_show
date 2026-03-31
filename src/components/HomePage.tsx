import './HomePage.css'

interface HomePageProps {
  onEnter: () => void
}

/**
 * 메인 랜딩 — 왼쪽 상단 PROGIST + 설명 + EXPLORER (텍스트 영역 배경 투명)
 */
export default function HomePage({ onEnter }: HomePageProps) {
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-logo">PROGIST</h1>

        <div className="home-copy">
          <h2 className="home-headline">프로지스트 회사</h2>
          <p className="home-desc">
            저희 프로지스트는 2년차 webgl 회사이며 앞으로도 성장을 멈추지 않습니다
          </p>
          <button type="button" className="home-explorer" onClick={onEnter}>
            EXPLORER
          </button>
        </div>
      </div>

      <div className="home-cookie">
        By continuing to use this website, you agree to the use of cookies which allow us to measure user behaviour on our site, for more information{' '}
        <a href="#" className="cookie-link">view our cookie policy.</a>
      </div>
    </div>
  )
}
