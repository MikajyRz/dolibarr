import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/dolibarr-api': {
        target: 'http://localhost',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/dolibarr-api/, '/dolibarr/htdocs/api/index.php'),
      },

      '/backend-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend-api/, '/api'),
      },
    },
  },
})