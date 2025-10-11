import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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
        react()
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
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js']
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
