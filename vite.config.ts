import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Use '/' for custom domain (synthesthesia.mvicari.com)
  // Use '/synthesthesia/' only for github.io subpath
  base: '/',
})