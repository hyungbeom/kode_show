import { useState, useEffect } from 'react'
import './LoadingScreen.css'

/**
 * 로딩 화면 컴포넌트
 * KODE Clubs 실제 사이트의 로딩 화면을 재현합니다.
 */
export default function LoadingScreen({ onComplete, isInitial = false }) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    // 로딩 애니메이션
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            onComplete()
          }, 500)
          return 100
        }
        return prev + 2
      })
    }, 30)
    
    return () => clearInterval(interval)
  }, [onComplete])
  
  return (
    <div className={`loading-screen ${isInitial ? 'initial-loading' : ''}`}>
      <div className="loading-content">
        <h1 className="loading-logo">KODE</h1>
        <h2 className="loading-subtitle">KODE SPORTS CLUB NEW CAIRO</h2>
        
        <div className="loading-circle">
          <svg className="loading-circle-svg" viewBox="0 0 100 100">
            <circle
              className="loading-circle-bg"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="2"
            />
            <circle
              className="loading-circle-progress"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#ff1493"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span className="loading-percentage">{progress}%</span>
        </div>
      </div>
      
      <div className="loading-cookie">
        By continuing to use this website, you agree to the use of cookies which allow us to measure user behaviour on our site, for more information{' '}
        <a href="#" className="cookie-link">view our cookie policy.</a>
      </div>
    </div>
  )
}
