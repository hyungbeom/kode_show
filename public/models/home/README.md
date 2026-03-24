# 홈페이지 전용 모델 폴더

이 폴더는 홈페이지(`/` 페이지)에서 사용하는 GLB 모델 파일들을 저장하는 곳입니다.

## 폴더 구조

```
public/models/
├── home/              # 홈페이지 전용 모델
│   ├── background.glb
│   ├── logo.glb
│   └── ...
├── show_room2.glb     # 룸 씬 모델
├── amongus.glb        # 플레이어 모델
└── car.glb            # 차량 모델
```

## 사용 방법

홈페이지 컴포넌트에서 모델을 로드할 때:

```typescript
import { useGLTF } from '@react-three/drei'
import { MODEL_PATHS } from '@/utils/constants'

// 모델 로드
const { scene } = useGLTF(MODEL_PATHS.HOME.BACKGROUND)

// 프리로드
useGLTF.preload(MODEL_PATHS.HOME.BACKGROUND)
```

## 경로 관리

모든 모델 경로는 `src/utils/constants.ts`의 `MODEL_PATHS` 객체에서 중앙 관리됩니다.
이렇게 하면 경로 변경 시 한 곳만 수정하면 됩니다.
