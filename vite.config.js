import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const themesDir = path.join(__dirname, 'public', 'themes')

function scanThemeNames() {
  if (!fs.existsSync(themesDir)) {
    return []
  }

  return fs
    .readdirSync(themesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(themesDir, entry.name, 'theme.css')))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

function writeThemesIndex() {
  fs.mkdirSync(themesDir, { recursive: true })
  const themes = scanThemeNames()
  const indexPath = path.join(themesDir, 'index.json')
  fs.writeFileSync(indexPath, `${JSON.stringify({ themes }, null, 2)}\n`)
  return themes
}

function themesIndexPlugin() {
  return {
    name: 'picocrank-themes-index',
    buildStart() {
      writeThemesIndex()
    },
    configureServer(server) {
      writeThemesIndex()

      const refreshIndex = (filePath) => {
        if (!filePath) {
          return
        }
        const normalized = path.resolve(filePath)
        if (!normalized.startsWith(themesDir)) {
          return
        }
        writeThemesIndex()
      }

      server.watcher.add(themesDir)
      server.watcher.on('add', refreshIndex)
      server.watcher.on('unlink', refreshIndex)
      server.watcher.on('addDir', refreshIndex)
      server.watcher.on('unlinkDir', refreshIndex)
    },
  }
}

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'assets/femtocrank-[hash].css'
          }
          if (assetInfo.name === 'dark.css') {
            return 'assets/femtocrank-dark-[hash].css'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/lang': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  plugins: [
    themesIndexPlugin(),
    Components({
      dirs: "./vue/",
      extensions: ['vue'],
      deep: true,
      dts: false,
    }),
    vue(),
  ],
})
