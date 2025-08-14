import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/bible': {
        target: 'https://labs.bible.org/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bible/, ''),
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
