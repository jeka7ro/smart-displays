import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  define: {
    'process.env.REACT_APP_BACKEND_URL': JSON.stringify(
      process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'
    ),
  },
});
