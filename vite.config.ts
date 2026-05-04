import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

function copyGameAssets() {
  return {
    name: 'copy-game-assets',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const root = __dirname
      const gameSrc = resolve(root, 'game.html')
      if (existsSync(gameSrc)) {
        copyFileSync(gameSrc, resolve(dist, 'index.html'))
        copyFileSync(gameSrc, resolve(dist, 'game.html'))
      }
      const imgSrc = resolve(root, 'images')
      const imgDst = resolve(dist, 'images')
      if (existsSync(imgSrc)) cpSync(imgSrc, imgDst, { recursive: true })
      const libDst = resolve(dist, 'lib')
      if (!existsSync(libDst)) mkdirSync(libDst, { recursive: true })
      copyFileSync(resolve(root, 'lib/cloudbase-sdk.js'), resolve(libDst, 'cloudbase-sdk.js'))
      console.log('[copy-game-assets] game.html→index.html + images/ + lib/ → dist/')
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyGameAssets()],
  base: '/mental-hospital/',
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
})
