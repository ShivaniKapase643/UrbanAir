import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 85, branches: 85, functions: 85, statements: 85 },
      include: ['src/utils/**/*.ts', 'src/services/**/*.ts', 'src/components/**/*.tsx', 'src/hooks/**/*.ts'],
    },
  },
})
