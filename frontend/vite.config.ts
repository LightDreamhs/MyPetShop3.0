import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 将 /api/v1 请求转发到后端服务器
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 不重写路径，保持 /api/v1 前缀
      },
    },
  },
})
