#!/bin/bash

echo "Building TravianAssistant v0.7.0 with module fix..."

# Clean dist
rm -rf dist
mkdir -p dist

# First, create a wrapper file that properly exports everything
cat > src/content-wrapper.ts << 'WRAPPER'
// Wrapper to ensure proper module exports
import { safeScraper, overviewParser } from './content/index';

// Make sure everything is available globally for the initialize function
(window as any).safeScraper = safeScraper;
(window as any).overviewParser = overviewParser;

// Import and run the main content script
import './content/index';
WRAPPER

# Bundle the wrapper
npx esbuild src/content-wrapper.ts \
  --bundle \
  --outfile=dist/content.js \
  --platform=browser \
  --target=chrome90 \
  --format=iife

# Bundle background normally
npx esbuild src/background.ts \
  --bundle \
  --outfile=dist/background.js \
  --platform=browser \
  --target=chrome90 \
  --format=iife

# Copy static files
echo "Copying static files..."
cp manifest.json dist/
cp public/*.html dist/ 2>/dev/null || true
cp public/*.css dist/ 2>/dev/null || true  
cp public/*.png dist/ 2>/dev/null || true

# Clean up wrapper
rm src/content-wrapper.ts

echo "Build complete!"
ls -la dist/
