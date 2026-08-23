import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy Overpass during dev to avoid CORS issues
      '/api/overpass': {
        target: 'https://overpass.kumi.systems',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/overpass/, '/api/interpreter'),
      },
      // Proxy Nominatim during dev to avoid CORS issues
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, '/search'),
      },
    },
  },
})
