import { useState } from 'react'
import './HomePage.css'

/**
 * 메인 랜딩 페이지 — ENVEX
 */
export default function HomePage({ onEnter }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div className="home-page">
      <div className="home-content">
        <h1 className="home-logo">ENVEX</h1>
        <h2 className="home-subtitle">2026 · Environmental Technology &amp; Green Energy</h2>
        
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
