/**
 * Vite가 `import './App'` 시 `.jsx`를 `.tsx`보다 먼저 해석하므로,
 * 이 파일에서 TS 구현을 재내보내 단일 소스(App.tsx)만 유지합니다.
 */
export { default } from './App.tsx'
