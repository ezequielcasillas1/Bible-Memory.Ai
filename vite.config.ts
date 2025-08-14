import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/scripture': {
        target: 'https://api.scripture.api.bible/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/scripture/, ''),
        headers: {
          'api-key': '6d078a413735440025d1f98883a8d372'
        }
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
