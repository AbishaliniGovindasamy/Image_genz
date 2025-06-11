import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',  // ✅ for relative paths in Netlify
  plugins: [react()],
  publicDir: 'public',  // ✅ include _redirects in build
})
