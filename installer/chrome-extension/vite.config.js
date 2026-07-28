import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Helper plugin to copy manifest.json to output directory
function copyManifestPlugin() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const src = path.resolve(__dirname, 'manifest.json');
      const dest = path.resolve(__dirname, '../dist-extension/manifest.json');
      fs.copyFileSync(src, dest);

      const contentSrc = path.resolve(__dirname, 'src/content.js');
      const contentDest = path.resolve(__dirname, '../dist-extension/content.js');
      if (fs.existsSync(contentSrc)) {
        fs.copyFileSync(contentSrc, contentDest);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  root: __dirname,
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../dist-extension'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'index.html')
      }
    }
  }
});
