import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.ts'),
        background: resolve(__dirname, 'src/background.ts'),
        popup: resolve(__dirname, 'src/popup/popup.ts'),
        options: resolve(__dirname, 'src/options/options.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        // CRITICAL: Use IIFE format for content scripts, not ES modules
        format: 'iife'
      }
    },
    // Disable module preload polyfill
    modulePreload: false,
    // Target older browsers for compatibility
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
});