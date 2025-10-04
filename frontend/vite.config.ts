import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 13200,
    proxy: {
      '/api': {
        target: 'http://localhost:14200',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI libraries chunk
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // State management chunk
          store: ['@reduxjs/toolkit', 'react-redux'],
          // Utility libraries chunk
          utils: ['ace-builds', 'react-ace', 'react-split-pane']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
})