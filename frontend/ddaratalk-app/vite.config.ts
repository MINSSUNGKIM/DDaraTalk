import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // '/api'로 시작하는 요청을 http://localhost:8080으로 전달
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true, // true로 설정하면 요청 헤더의 Host를 target URL로 변경
        // rewrite: (path) => path.replace(/^\/api/, '') // 필요에 따라 /api 부분을 제거하고 싶을 때
      }
    }
  }
})