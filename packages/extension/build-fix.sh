#!/bin/bash

# Build script that ADDS resource detection to EXISTING working code
VERSION="1.0.5"

echo "Building v${VERSION} - Adding resource detection to working v1.0.4..."

# Clean
rm -rf dist/
mkdir dist/

# Fix manifest version
sed "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" manifest.json > dist/manifest.json

# Build content with EXISTING working code + resource detector
echo "Building content script with working drag/resize and overview parser..."
npx esbuild src/content/index.ts \
  --bundle \
  --outfile=dist/content-base.js \
  --format=iife \
  --target=chrome90

# Build resource detector separately
npx esbuild src/content/resource-detector.ts \
  --bundle \
  --outfile=dist/resource-detector.js \
  --format=iife \
  --target=chrome90

# Combine them
cat dist/content-base.js dist/resource-detector.js > dist/content.js
rm dist/content-base.js dist/resource-detector.js

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

echo "✅ Build complete v${VERSION}"
echo "Preserved: drag/resize, overview parser (9 villages)"
echo "Added: resource detection"
echo ""
ls -la dist/
