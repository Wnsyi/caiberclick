import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const BUILD_VERSION = String(Date.now())

function copyGameAssets() {
  return {
    name: 'copy-game-assets',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      const root = __dirname
      const gameSrc = resolve(root, 'game.html')
      if (existsSync(gameSrc)) {
        let html = readFileSync(gameSrc, 'utf-8')
        // 给所有 images/... 图片链接加 ?v=BUILD_VERSION 防止浏览器缓存旧图
        // file:// 协议 (Electron) 也能正确处理 URL query string
        html = html.replace(/(images\/[^"')\s]+)(\?v=\d+)?/g, function(match, path, hasVersion) {
          if (hasVersion) return match
          return path + '?v=' + BUILD_VERSION
        })
        writeFileSync(resolve(dist, 'index.html'), html)
        writeFileSync(resolve(dist, 'game.html'), html)
      }
      const imgSrc = resolve(root, 'images')
      const imgDst = resolve(dist, 'images')
      if (existsSync(imgSrc)) cpSync(imgSrc, imgDst, { recursive: true })
      const libDst = resolve(dist, 'lib')
      if (!existsSync(libDst)) mkdirSync(libDst, { recursive: true })
      copyFileSync(resolve(root, 'lib/cloudbase-sdk.js'), resolve(libDst, 'cloudbase-sdk.js'))
      const dlsSrc = resolve(root, 'public/downloads')
      const dlsDst = resolve(dist, 'downloads')
      if (existsSync(dlsSrc)) cpSync(dlsSrc, dlsDst, { recursive: true })
      console.log('[copy-game-assets] game.html→index.html + images/ + lib/ + downloads/ → dist/ (v=' + BUILD_VERSION + ')')
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
