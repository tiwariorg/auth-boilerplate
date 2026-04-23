import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
// base is set to '/auth-boilerplate/' so that all JS/CSS/asset paths are
// prefixed correctly when deployed to https://tiwariorg.github.io/auth-boilerplate/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/auth-boilerplate/',
  build: {
    outDir: 'dist',
  },
})
