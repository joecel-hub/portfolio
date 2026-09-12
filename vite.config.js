import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/postprocessing')) {
            return 'three'
          }
        },
      },
    },
  },
  server: {
    open: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
  },
})
