import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS === 'true'
    ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''}/`
    : '/',
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  },
  worker: {
    format: 'es'
  },
  build: {
    // Performance optimizations for production
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor code
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@mui')) {
              return 'mui-vendor';
            }
            if (id.includes('cytoscape')) {
              return 'graph-vendor';
            }
            if (id.includes('@apollo/client')) {
              return 'apollo-vendor';
            }
          }
        }
      }
    },
    // Enable source maps for production debugging (can disable for smaller builds)
    sourcemap: false,
    // Increase chunk size warning limit (we have large graph libs)
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'esbuild',
    // Target modern browsers for better performance
    target: 'esnext',
  }
})
