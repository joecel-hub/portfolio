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
  },
  preview: {
    allowedHosts: true,
  },
})
