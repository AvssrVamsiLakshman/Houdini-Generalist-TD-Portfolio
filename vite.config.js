import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Generates relative asset paths for GitHub Pages compatibility
  build: {
    outDir: 'dist',
  }
});
