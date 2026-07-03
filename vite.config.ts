import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { VitePWA } from 'vite-plugin-pwa'

const buildId = process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || `${Date.now()}`
const builtAt = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __SITE_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    inspectAttr(),
    react(),
    {
      name: 'site-version',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'site-version.json',
          source: JSON.stringify({ version: buildId, builtAt }),
        })
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-1024.png'],
      manifest: {
        name: 'Mevera Studios Docs',
        short_name: 'Mevera Docs',
        description: 'Documentation for Mevera Studio development libraries and tools',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-1024.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,xml}'],
        globIgnores: ['**/site-version.json'],
        navigateFallbackDenylist: [/\.xml$/],
        maximumFileSizeToCacheInBytes: 4000000, // 4MB to allow React/UI vendor chunks
        runtimeCaching: [
          {
            urlPattern: /\/site-version\.json$/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/docs-nav\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'docs-nav',
              expiration: { maxAgeSeconds: 60 * 60 * 24 }, // 1 day
            },
          },
          {
            urlPattern: /\/docs-content\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'docs-content',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days cache for static document content
            },
          },
          {
            urlPattern: /\/search-index\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'search-index',
              expiration: { maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    }
  }
});
