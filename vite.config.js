import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'postprocessing'],
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
