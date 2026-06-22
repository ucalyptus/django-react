import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: '../backend/staticfiles/frontend' },
  server: { proxy: { '/items': 'http://localhost:8000' } },
})
