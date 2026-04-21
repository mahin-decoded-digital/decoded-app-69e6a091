import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Local dev: leave VITE_API_URL unset — `/api` is proxied to the Express app below.
// Production (e.g. Render): build with VITE_API_URL=<backend origin> so `apiUrl()` in `@/lib/api` resolves correctly.

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})