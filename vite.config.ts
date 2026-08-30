import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [react(), tailwindcss()],
  // Packaged builds load over file://, which has no site root — assets must be relative.
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
})
