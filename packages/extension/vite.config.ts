import { defineConfig } from 'vite';
import { resolve } from 'path';

// Dynamic import for ESM-only module
const loadStaticCopy = async () => {
  const { viteStaticCopy } = await import('vite-plugin-static-copy');
  return viteStaticCopy;
};

export default defineConfig(async () => {
  const viteStaticCopy = await loadStaticCopy();
  
  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          content: resolve(__dirname, 'src/content/index.ts'),
          background: resolve(__dirname, 'src/background.ts'),
          popup: resolve(__dirname, 'src/popup.ts'),
          options: resolve(__dirname, 'src/options/options.ts')
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          // Don't use IIFE with multiple entries - use default format
          // but ensure no exports in content script
        }
      },
      target: 'chrome91'
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: 'manifest.json',
            dest: '.'
          },
          {
            src: 'src/popup/popup.html',
            dest: '.'
          },
          {
            src: 'src/options.html',
            dest: '.'
          },
          {
            src: 'src/content/styles.css',
            dest: '.',
            rename: 'content.css'
          },
          {
            src: 'icons/*.png',
            dest: '.'
          }
        ]
      })
    ]
  };
});
