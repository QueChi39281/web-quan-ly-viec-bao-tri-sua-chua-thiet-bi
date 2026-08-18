import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/departments': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/devices': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/maintenance-requests': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/inventory': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/inventories': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/audits': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/notifications': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/reports': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/maintenances': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
