import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html'],
      exclude: [
        'node_modules/',
        'public/',
        'src/pages/**',

        // UI compleja
        'src/components/auth/**',
        'src/components/chat/**',
        'src/components/home/**',
        'src/components/layout/**',
        'src/components/map/**',
        'src/components/pets/**',
        'src/components/profile/**',
        'src/components/reports/**',

        // No lógica
        'src/data/**',
        'src/services/__mocks__/**',
        'src/services/*Config*.*',
        'src/services/overpass.js',
        'src/test/',
        'src/push/**',
        '**/*.config.*',
        '**/main.jsx',
        '**/AppRouter.jsx',
        '**/*.css',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

