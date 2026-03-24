import { useState } from 'react'
import './SoundControl.css'

/**
 * 사운드 컨트롤 버튼 컴포넌트
 * 지도 화면 하단 왼쪽에 표시됩니다.
 */
export default function SoundControl() {
  const [isSoundOn, setIsSoundOn] = useState(true)
  
  const toggleSound = () => {
    setIsSoundOn(!isSoundOn)
    // 실제 사운드 제어 로직은 여기에 추가
  }
  
  return (
    <button
      className="sound-control"
      onClick={toggleSound}
      aria-label={isSoundOn ? 'Sound on' : 'Sound off'}
    >
      {isSoundOn ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9V15H7L12 20V4L7 9H3Z" fill="currentColor"/>
          <path d="M16.5 12C16.5 10.23 15.5 8.71 14 7.97V16.02C15.5 15.29 16.5 13.77 16.5 12Z" fill="currentColor"/>
          <path d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="currentColor"/>
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M16.5 12C16.5 10.23 15.5 8.71 14 7.97V9.18C15.09 9.6 15.9 10.73 15.9 12C15.9 13.27 15.09 14.4 14 14.82V16.02C15.5 15.29 16.5 13.77 16.5 12Z" fill="currentColor"/>
          <path d="M3 9V15H7L12 20V4L7 9H3Z" fill="currentColor"/>
          <path d="M19.28 3L3 19.28L4.72 21L21 4.72L19.28 3Z" fill="currentColor"/>
        </svg>
      )}
    </button>
  )
}
