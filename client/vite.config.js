import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "./", // 🔥 This is required for Netlify/static hosting
  plugins: [react()],
})
