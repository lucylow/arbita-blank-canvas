import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 8080,
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ''),
      'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(env.VITE_SUPABASE_PROJECT_ID || process.env.VITE_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID || ''),
    },
  };
});
