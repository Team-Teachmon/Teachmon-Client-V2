import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('react-router-dom') || id.includes('@tanstack/react-query')) {
            return 'app-core';
          }

          if (id.includes('@emotion')) {
            return 'emotion';
          }

          if (id.includes('react-toastify')) {
            return 'toast';
          }

          if (id.includes('fullpage.js') || id.includes('lottie-react') || id.includes('lottie-web')) {
            return 'motion';
          }
        },
      },
    },
  },
  server: {
    host: true, // 또는 '0.0.0.0'
    port: 5173,
  },
})
