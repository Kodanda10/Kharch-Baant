import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
// Diagnostic plugin (temporary) to trace Vite startup phases
const diagPlugin = () => ({
  name: 'diag-startup',
  config(config) {
    // eslint-disable-next-line no-console
    console.log('[VITE DIAG] initial config hook');
    return config;
  },
  configResolved(resolved) {
    // eslint-disable-next-line no-console
    console.log('[VITE DIAG] config resolved: root=%s mode=%s plugins=%d', resolved.root, resolved.mode, resolved.plugins.length);
  },
  buildStart() {
    // eslint-disable-next-line no-console
    console.log('[VITE DIAG] buildStart (dev server bootstrap)');
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        // Only add diag plugin in development
        ...(isProduction ? [] : [diagPlugin()]),
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Kharch Baant - Expense Tracker',
            short_name: 'KharchBaant',
            description: 'Track and split expenses with friends and family',
            theme_color: '#3b82f6',
            background_color: '#ffffff',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            orientation: 'portrait',
            icons: [
              {
                src: 'pwa-192x192.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'pwa-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              },
              {
                src: 'pwa-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/api\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-api-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 // 24 hours
                  }
                }
              }
            ]
          }
        })
      ],
      envPrefix: ['VITE_', 'REACT_APP_'],
      define: {
        // Support both VITE_ and REACT_APP_ prefixes for compatibility
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
        'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL),
        'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY),
        'process.env.REACT_APP_API_MODE': JSON.stringify(env.VITE_API_MODE || env.REACT_APP_API_MODE || 'mock'),
      },
      build: {
        // Optimize for production - use esbuild for faster builds
        minify: 'esbuild',
        sourcemap: false,
        chunkSizeWarningLimit: 600, // Increase slightly from default 500kb
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              // Split vendor libraries
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('@supabase/supabase-js')) {
                  return 'supabase';
                }
                if (id.includes('@google/genai')) {
                  return 'genai';
                }
                if (id.includes('@testing-library') || id.includes('vitest')) {
                  return 'test-utils';
                }
                // Group other vendor libraries
                return 'vendor';
              }
              
              // Split components by feature
              if (id.includes('/components/')) {
                if (id.includes('Modal')) {
                  return 'modals';
                }
                if (id.includes('Transaction') || id.includes('Payment')) {
                  return 'transaction-components';
                }
                if (id.includes('Group')) {
                  return 'group-components';
                }
              }
              
              // Split services
              if (id.includes('/services/')) {
                return 'services';
              }
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
