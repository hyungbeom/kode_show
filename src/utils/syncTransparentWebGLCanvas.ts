import type { Scene, WebGLRenderer } from 'three'

/**
 * CSS/div 그라데이션이 비치도록 클리어 알파·씬 배경·캔버스 DOM 스타일을 맞춤.
 * 주의: WebGLRenderer.clearColor() 는 색 “설정”이 아니라 컬러 버퍼 “삭제”라서 매 프레임 호출하면 화면이 깨질 수 있음.
 */
export function syncTransparentWebGLCanvas(gl: WebGLRenderer, scene: Scene) {
  gl.setClearColor(0x000000, 0)
  scene.background = null
  gl.domElement.style.backgroundColor = 'transparent'
}

/** Environment 등이 scene.background 를 켜면 null 로만 되돌림 (렌더 루프 안전) */
export function maintainTransparentSceneBackground(gl: WebGLRenderer, scene: Scene) {
  gl.setClearColor(0x000000, 0)
  if (scene.background !== null) {
    scene.background = null
  }
}
