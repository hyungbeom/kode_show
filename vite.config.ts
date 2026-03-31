import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['rapier', '@react-three/rapier', 'ecctrl'],
    exclude: [],
  },
  build: {
    /** 큰 청크 경고 완화(three 등) — 실제 gzip은 훨씬 작음 */
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('three')) return 'vendor-three'
          if (id.includes('@react-three')) return 'vendor-r3f'
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
          if (id.includes('gsap')) return 'vendor-gsap'
          if (id.includes('zustand')) return 'vendor-zustand'
        },
      },
    },
  },
})
