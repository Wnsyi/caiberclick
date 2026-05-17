import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync } from 'fs'
import { resolve } from 'path'

function copyGameAssets() {
  return {
    name: 'copy-game-assets',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const root = __dirname

      // Copy images to dist
      const imgSrc = resolve(root, 'images')
      const imgDst = resolve(dist, 'images')
      if (existsSync(imgSrc)) cpSync(imgSrc, imgDst, { recursive: true })

      // Copy downloads (skip .apk to avoid recursive bundling into Capacitor APK)
      // The APK should be uploaded to cloudbase separately after build
      const dlsSrc = resolve(root, 'public/downloads')
      const dlsDst = resolve(dist, 'downloads')
      if (existsSync(dlsSrc)) {
        cpSync(dlsSrc, dlsDst, {
          recursive: true,
          filter: (src) => !src.endsWith('.apk'),
        })
      }

      console.log('[copy-game-assets] images/ + downloads/ → dist/')
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [react(), copyGameAssets()],
  base: command === 'build' ? '/mental-hospital/' : '/',
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
      },
    },
  },
}))
