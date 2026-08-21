import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const themesDir = path.join(__dirname, 'public', 'themes')
const supplementalThemesDir = path.join(__dirname, 'supplemental-themes')
const includeSupplementalThemes = process.env.VITE_INCLUDE_SUPPLEMENTAL_THEMES !== 'false'

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

function contentTypeFor(filePath) {
  if (filePath.endsWith('.css')) {
    return 'text/css; charset=utf-8'
  }
  if (filePath.endsWith('.json')) {
    return 'application/json; charset=utf-8'
  }
  if (filePath.endsWith('.png')) {
    return 'image/png'
  }
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  if (filePath.endsWith('.webp')) {
    return 'image/webp'
  }
  if (filePath.endsWith('.svg')) {
    return 'image/svg+xml'
  }
  return 'application/octet-stream'
}

function copyDirectoryRecursive(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true })

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath)
      continue
    }

    fs.copyFileSync(sourcePath, targetPath)
  }
}

function supplementalThemesPlugin() {
  return {
    name: 'picocrank-supplemental-themes',
    configureServer(server) {
      if (!includeSupplementalThemes || !fs.existsSync(supplementalThemesDir)) {
        return
      }

      server.middlewares.use('/supplemental-themes', (req, res, next) => {
        const requestPath = decodeURIComponent((req.url || '/').split('?')[0])
        const relativePath = requestPath.replace(/^\/+/, '')
        const filePath = path.resolve(supplementalThemesDir, relativePath)

        if (!filePath.startsWith(path.resolve(supplementalThemesDir))) {
          res.statusCode = 403
          res.end('Forbidden')
          return
        }

        if (!existsSync(filePath)) {
          next()
          return
        }

        stat(filePath).then((fileStat) => {
          if (!fileStat.isFile()) {
            next()
            return
          }

          res.setHeader('Content-Type', contentTypeFor(filePath))
          createReadStream(filePath).pipe(res)
        }).catch(() => {
          next()
        })
      })
    },
    closeBundle() {
      if (!includeSupplementalThemes || !fs.existsSync(supplementalThemesDir)) {
        return
      }

      const outDir = path.resolve(__dirname, 'dist', 'supplemental-themes')
      copyDirectoryRecursive(supplementalThemesDir, outDir)
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
    supplementalThemesPlugin(),
    Components({
      dirs: ['./vue/components/'],
      extensions: ['vue'],
      deep: true,
      dts: false,
    }),
    vue(),
  ],
})
