/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'preact/hooks', replacement: 'react' },
      { find: 'preact', replacement: 'react' },
      { find: '@', replacement: '/src' },
    ],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
