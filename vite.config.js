import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: path.resolve(__dirname, 'src'),
  server: {
    port: 5173, // Changed to default 5173 to match Electron
    strictPort: true, // Don't try other ports if 5173 is taken
  },
  build: {
    outDir: path.resolve(__dirname, 'src/dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}); 