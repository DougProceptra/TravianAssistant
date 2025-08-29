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
  // Keep existing compiled JS files if they exist
  const keepFiles = ['content.js', 'background.js', 'popup.js'];
  const existingFiles = {};
  
  keepFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      existingFiles[file] = fs.readFileSync(filePath);
    }
  });
  
  fs.rmSync(distPath, { recursive: true });
  fs.mkdirSync(distPath, { recursive: true });
  
  // Restore existing compiled files
  Object.entries(existingFiles).forEach(([file, content]) => {
    fs.writeFileSync(path.join(distPath, file), content);
    console.log(`✅ Restored existing ${file}`);
  });
} else {
  fs.mkdirSync(distPath, { recursive: true });
}

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

// Check for compiled files
console.log('📦 Checking compiled JavaScript files...');
const requiredFiles = ['content.js', 'background.js', 'popup.js'];
let missingFiles = [];

requiredFiles.forEach(file => {
  const distFile = path.join(distPath, file);
  if (!fs.existsSync(distFile)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n⚠️  Note: Some JavaScript files not found:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
  console.log('   These may have been previously compiled. If the extension fails to load,');
  console.log('   you may need to compile TypeScript sources or use the previous build.\n');
} else {
  console.log('✅ All required JavaScript files present');
}

console.log('\n✅ Build complete! Extension ready in dist/ folder');
console.log('📦 To install:');
console.log('   1. Open Chrome and go to chrome://extensions/');
console.log('   2. Enable "Developer mode" (top right)');
console.log('   3. Click "Load unpacked"');
console.log('   4. Select the packages/extension/dist/ folder\n');
