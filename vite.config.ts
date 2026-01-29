import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Use '/synthesthesia/' for GitHub Pages (matches repo name)
  // Use '/' for custom domain or local dev
  base: '/synthesthesia/',
})