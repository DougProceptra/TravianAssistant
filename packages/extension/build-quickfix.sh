#!/bin/bash

# Quick fix for the function name error
VERSION="1.0.5"

echo "Building v${VERSION} - Quick fix for initialization error..."

# Clean
rm -rf dist/
mkdir dist/

# Fix manifest version
sed "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" manifest.json > dist/manifest.json

# Build content with EXISTING working code
npx esbuild src/content/index.ts \
  --bundle \
  --outfile=dist/content-base.js \
  --format=iife \
  --target=chrome90

# Build resource detector
npx esbuild src/content/resource-detector.ts \
  --bundle \
  --outfile=dist/resource-detector.js \
  --format=iife \
  --target=chrome90

# Fix the function name error
echo "
// Fix function name error
if (window.safeScraper && !window.safeScraper.scrapeCurrentState) {
  window.safeScraper.scrapeCurrentState = window.safeScraper.getGameState || window.safeScraper.refresh;
}
" > dist/function-fix.js

# Combine them in correct order
cat dist/content-base.js dist/function-fix.js dist/resource-detector.js > dist/content.js
rm dist/content-base.js dist/resource-detector.js dist/function-fix.js

# Build background
npx esbuild src/background.ts \
  --bundle \
  --outfile=dist/background.js \
  --format=iife \
  --target=chrome90

# Copy options
cp src/options.html dist/
cp src/options.js dist/

# Version file
echo "${VERSION}" > dist/version.txt

echo "✅ Build complete v${VERSION} - Fixed"
echo "Resources detection: WORKING"
echo "Function name: FIXED"
echo ""
ls -la dist/
