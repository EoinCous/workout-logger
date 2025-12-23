import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'RepLog',
        short_name: 'RepLog',
        theme_color: '#121212',
        icons: [
          {
            "src": "/images/replog-icon-1.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/images/replog-icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ]
      }
    })
  ]
})