import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 使用手寫的 sw.js，不透過 workbox-build generateSW
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectRegister: 'inline',
      manifest: {
        name: 'Leon-lab 專業荷官訓練中心',
        short_name: 'Leon-lab',
        description: '德州撲克荷官訓練平台',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      rollupOptions: {
        treeshake: false,
      },
      injectManifest: {
        globPatterns: [],
      },
    }),
  ],
  base: '/', // Firebase Hosting 必須使用絕對根目錄
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  }
})
