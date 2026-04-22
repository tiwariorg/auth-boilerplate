import { defineConfig } from 'vite'
import { mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default mergeConfig(
  defineConfig({
    plugins: [react()],
  }),
  {
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['src/test/setup.ts'],
    },
  },
)
