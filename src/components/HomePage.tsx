import { useState } from 'react'
import './HomePage.css'

interface HomePageProps {
  onEnter: () => void
}

/**
 * 메인 랜딩 페이지 컴포넌트
 * KODE Clubs 실제 사이트의 홈페이지를 재현합니다.
 */
export default function HomePage({ onEnter }: HomePageProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-logo">KODE</h1>
        <h2 className="home-subtitle">KODE SPORTS CLUB NEW CAIRO</h2>
        
        <button
          className="enter-button"
          onClick={onEnter}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="enter-text">ENTER</span>
        </button>
      </div>
      
      <div className="home-cookie">
        By continuing to use this website, you agree to the use of cookies which allow us to measure user behaviour on our site, for more information{' '}
        <a href="#" className="cookie-link">view our cookie policy.</a>
      </div>
    </div>
  )
}
