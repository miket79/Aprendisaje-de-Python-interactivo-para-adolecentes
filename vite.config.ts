/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  // Relative base + hash routing = the build works from any folder or sub-path
  // (GitHub Pages, Netlify, a USB stick, a school intranet...).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Self-host the Python runtime (Pyodide) instead of loading it from a CDN:
    // many school networks block CDNs, and this keeps the app working offline later.
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pyodide/{pyodide.asm.mjs,pyodide.asm.wasm,python_stdlib.zip,pyodide-lock.json}',
          dest: 'pyodide',
          rename: { stripBase: 2 },
        },
      ],
    }),
    // Installable app (PWA): after the first visit everything, including Python,
    // is cached on the device and works offline. No OS security prompts.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: './',
        name: 'Python Quest',
        short_name: 'Python Quest',
        description:
          'Learn Python in 30 days: interactive lessons for teens, in English and Spanish.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f0f9ff',
        theme_color: '#3776ab',
        categories: ['education'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the whole app: Pyodide (~13 MB), voice-overs, fonts and code.
        globPatterns: ['**/*.{html,js,mjs,css,json,wasm,zip,svg,png,woff2,mp3}'],
        globIgnores: ['audio/manifest.json'],
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  optimizeDeps: { exclude: ['pyodide'] },
  // The lesson chunk bundles the code editor (~210 kB gzipped); that's expected.
  build: { chunkSizeWarningLimit: 800 },
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
