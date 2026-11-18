import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         → build padrão (assets separados, ideal para GitHub Pages/Vercel)
// `npm run build:single`  → um único index.html autocontido (wasm e worker embutidos)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 2000,
  },
  worker: { format: 'es' },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 30000 },
}));
