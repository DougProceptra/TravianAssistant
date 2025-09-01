#!/bin/bash

# Build script for v1.0.5 that includes resource detection
VERSION="1.0.5"

echo "Building TravianAssistant v${VERSION} with resource detection..."

# Clean
rm -rf dist/
mkdir dist/

# Update manifest version
sed "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" manifest.json > dist/manifest.json

# Build content script with resource detector
npx esbuild src/content/index-v105.ts \
  --bundle \
  --outfile=dist/content.js \
  --format=iife \
  --target=chrome90 \
  --external:chrome

# Build background script  
npx esbuild src/background.ts \
  --bundle \
  --outfile=dist/background.js \
  --format=iife \
  --target=chrome90

# Copy options
cp src/options.html dist/
cp src/options.js dist/

# Create version file
echo "${VERSION}" > dist/version.txt

echo "✅ Build complete v${VERSION}"
echo ""
echo "Files:"
ls -la dist/
echo ""
echo "Version check:"
grep version dist/manifest.json
