import { fileURLToPath } from 'url';
import path from 'path';

// Set up __dirname for ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Polyfill import.meta.dirname for vite server compatibility
const originalImportMeta = import.meta;
Object.defineProperty(import.meta, 'dirname', {
  value: __dirname,
  writable: false,
  enumerable: true,
  configurable: false
});

// Now import and start the main server
import('./index.js');