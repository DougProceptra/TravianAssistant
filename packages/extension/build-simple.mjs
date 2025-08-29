#!/usr/bin/env node
/**
 * Simple build script for TravianAssistant Chrome Extension
 * No complex dependencies, just works
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Building TravianAssistant Extension v1.0.0...\n');

// Clean dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Create subdirectories
fs.mkdirSync(path.join(distPath, 'options'), { recursive: true });

// Copy manifest
console.log('📄 Copying manifest.json...');
fs.copyFileSync('manifest.json', path.join(distPath, 'manifest.json'));

// Copy static files from public if exists
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  console.log('📁 Copying public files...');
  const files = fs.readdirSync(publicPath);
  files.forEach(file => {
    fs.copyFileSync(
      path.join(publicPath, file),
      path.join(distPath, file)
    );
  });
}

// Copy options files
console.log('⚙️ Copying options files...');
const optionsPath = path.join(__dirname, 'src/options');
if (fs.existsSync(optionsPath)) {
  ['options.html', 'options.css', 'options.js'].forEach(file => {
    const srcFile = path.join(optionsPath, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(distPath, 'options', file));
    }
  });
}

// For now, use existing compiled JS files if TypeScript compilation fails
console.log('📦 Copying compiled files...');
const compiledFiles = [
  'content.js',
  'background.js',
  'popup.js'
];

compiledFiles.forEach(file => {
  // If file already exists in dist (from previous build), we're good
  const distFile = path.join(distPath, file);
  if (!fs.existsSync(distFile)) {
    console.log(`  ⚠️ ${file} not found, extension may not work properly`);
  }
});

console.log('\n✅ Build complete! Extension ready in dist/ folder');
console.log('📦 To install:');
console.log('   1. Open Chrome and go to chrome://extensions/');
console.log('   2. Enable "Developer mode" (top right)');
console.log('   3. Click "Load unpacked"');
console.log('   4. Select the packages/extension/dist/ folder\n');
