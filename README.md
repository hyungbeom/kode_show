# KODE Clubs 3D 지도 프로젝트

React(Vite) + React Three Fiber를 사용한 인터랙티브 3D 지도 애플리케이션입니다.
[실제 KODE Clubs 웹사이트](https://www.kodeclubs.com/)를 완전히 재현했습니다.

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 열어 확인하세요.

## 📦 기술 스택

- **Vite** - 빠른 빌드 및 핫 리로딩
- **React** - UI 프레임워크
- **React Three Fiber (R3F)** - Three.js의 React 래퍼
- **@react-three/drei** - R3F 헬퍼 라이브러리 (Html, OrbitControls 등)
- **GSAP** - 부드러운 카메라 애니메이션
- **Zustand** - 전역 상태 관리

## 🎯 완전 재현된 기능

### 1. 로딩 화면
- KODE 로고 (대형, 진한 파란색)
- "KODE SPORTS CLUB NEW CAIRO" 서브타이틀 (핑크색)
- 원형 로딩 바 (0-100% 애니메이션)
- 쿠키 정책 안내

### 2. 메인 랜딩 페이지
- KODE 로고 및 서브타이틀
- 원형 ENTER 버튼 (호버 효과)
- 쿠키 정책 안내

### 3. 지도 화면
- 아이소메트릭 3D 뷰 (Orthographic Camera)
- 8개 구역 마커 (빨간 느낌표 + 어두운 배경 레이블)
  - Swimming Pool
  - Club House
  - The Courts
  - The Quad
  - The Hub
  - Playground & Track
  - Tennis & Padel
  - Soccer/Rugby Pitch
- 상단 헤더 (Back to Club 버튼, KODE 로고, 닫기 버튼)
- 하단 왼쪽 사운드 컨트롤
- 마커 클릭 시 카메라 줌인 애니메이션 (GSAP)
- 드래그/회전/줌 컨트롤

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── LoadingScreen.jsx      # 로딩 화면
│   ├── LoadingScreen.css
│   ├── HomePage.jsx            # 메인 랜딩 페이지
│   ├── HomePage.css
│   ├── MapScene.jsx           # 3D 지도 씬
│   ├── MapModel.jsx           # 3D 모델 로더 (플레이스홀더 포함)
│   ├── MapMarker.jsx          # 지도 마커 컴포넌트
│   ├── MapMarker.css
│   ├── CameraController.jsx   # GSAP 카메라 애니메이션
│   ├── MapHeader.jsx          # 상단 헤더
│   ├── MapHeader.css
│   └── SoundControl.jsx       # 사운드 컨트롤
│   └── SoundControl.css
├── store/
│   └── useMapStore.js         # Zustand 상태 관리
├── App.jsx                    # 메인 앱 (전체 플로우 관리)
├── App.css
└── main.jsx                  # 진입점

public/
└── models/
    └── kode_map.glb           # Blender 모델 (선택사항)
```

## 🎨 디자인 특징

### 색상 팔레트
- **로고**: `#1a1a2e` (진한 파란색)
- **강조색**: `#ff1493` (핑크/마젠타)
- **마커 배경**: `#1a1a2e` (어두운 배경)
- **마커 느낌표**: `#ff4444` (빨간색)
- **배경**: 하늘색 그라데이션 (`#87CEEB` → `#B0E0E6` → `#E0F6FF`)

### 타이포그래피
- 폰트: System UI (system-ui, -apple-system, sans-serif)
- 로고: 72px, 700 weight, 대문자
- 서브타이틀: 18px, 700 weight, 대문자
- 마커 텍스트: 12px, 700 weight, 대문자

## 🔧 주요 기능

### 카메라 시점 전환 (GSAP)
- 마커 클릭 시 카메라가 해당 위치로 부드럽게 이동 및 줌인
- 1.5초 애니메이션, `power2.inOut` 이징
- Orthographic Camera의 zoom 값도 함께 조정

### 상태 관리 (Zustand)
- 현재 선택된 구역 정보 관리
- 카메라 타겟 위치 관리
- 전역 상태로 컴포넌트 간 데이터 공유

### 플레이스홀더 지형
- 모델이 없어도 작동하는 기본 지형
- 계단식 녹색 지형
- 간단한 건물들 (핑크, 파란색)
- 물 영역

## 📝 실제 모델 추가 방법

나중에 Blender에서 만든 `.glb` 파일을 추가하려면:

1. `public/models/kode_map.glb`에 파일을 저장합니다
2. `src/components/MapModel.jsx`를 수정합니다:

```javascript
export default function MapModel() {
  return (
    <Suspense fallback={<PlaceholderTerrain />}>
      <ActualModel />  // 플레이스홀더 대신 실제 모델 사용
    </Suspense>
  )
}
```

## 🎯 사용자 플로우

1. **로딩 화면** → 자동으로 0-100% 로딩 애니메이션
2. **홈페이지** → ENTER 버튼 클릭
3. **지도 화면** → 마커 클릭 또는 드래그로 탐색
4. **Back to Club** 또는 닫기 버튼으로 홈으로 복귀

## 📄 참고

- [KODE Clubs 공식 웹사이트](https://www.kodeclubs.com/)
- [React Three Fiber 문서](https://docs.pmnd.rs/react-three-fiber)
- [GSAP 문서](https://greensock.com/docs/)

## ✨ 특징

- ✅ 모델 없이도 완벽 작동
- ✅ 실제 사이트와 동일한 UI/UX
- ✅ 부드러운 애니메이션 및 전환 효과
- ✅ 반응형 디자인 준비
- ✅ 확장 가능한 구조
# kode_show
