import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173, // <--- ¡CAMBIO AQUÍ! Movemos el frontend para no chocar con el backend
        strictPort: true,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 750,
        cssCodeSplit: true,
        reportCompressedSize: false,
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('/features/admin/') || id.includes('/components/AdminDashboard')) return 'admin';
              if (id.includes('/features/merchant/') || id.includes('/components/Dashboard')) return 'merchant';
              if (id.includes('/features/client/') || id.includes('/components/pages/client')) return 'client';
              if (id.includes('node_modules')) {
                if (id.includes('react-router')) return 'router';
                if (
                  id.includes('/react-dom/') ||
                  id.includes('/react/') ||
                  id.includes('/scheduler/') ||
                  id.includes('/use-sync-external-store/')
                )
                  return 'react';
                if (id.includes('firebase')) return 'firebase';
                if (id.includes('@mercadopago')) return 'payments';
                if (id.includes('leaflet')) return 'maps';
                if (id.includes('jspdf') || id.includes('html-to-image')) return 'media';
                if (id.includes('lucide-react') || id.includes('react-icons')) return 'icons';
                return 'vendor';
              }
            },
          },
        },
      },
    };
});
