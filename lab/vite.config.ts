import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // 移除 root 設定，改由指令控制或保持預設
  server: {
    port: 5174,
    open: true,
    fs: {
      allow: ['..'] // 允許存取上一層的 node_modules 和 src
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
})