import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// One source of truth for the version: package.json. The app reads it
// as __APP_VERSION__ (footer, .tworship manifest); the splash screen
// gets it from Electron's app.getVersion(), which reads the same file.
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(version) },
})
