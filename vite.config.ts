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
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
  plugins: [diagPlugin(), react()],
      envPrefix: ['VITE_', 'REACT_APP_'],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL),
        'process.env.REACT_APP_SUPABASE_ANON_KEY': JSON.stringify(env.REACT_APP_SUPABASE_ANON_KEY),
        'process.env.REACT_APP_API_MODE': JSON.stringify(env.REACT_APP_API_MODE || 'mock'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
