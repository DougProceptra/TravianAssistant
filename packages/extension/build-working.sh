#!/bin/bash
VERSION="0.8.7"  # Bump version to force update

echo "Building TravianAssistant v${VERSION}"

# Clean
rm -rf dist
mkdir -p dist

# Update version
sed -i "s/export const VERSION = .*/export const VERSION = '${VERSION}';/g" src/version.ts

# Build using the old working method
if which rollup > /dev/null; then
  echo "Building with Rollup..."
  npx rollup -c rollup.config.js
else
  echo "Rollup failed, using esbuild..."
  
  # Build content - use index-fixed.ts which was working
  npx esbuild src/content/index-fixed.ts \
    --bundle \
    --outfile=dist/content.js \
    --format=iife
    
  # Build background  
  npx esbuild src/background.ts \
    --bundle \
    --outfile=dist/background.js \
    --format=iife
fi

# Update manifest
node -e "
  const fs = require('fs');
  const manifest = require('./manifest.json');
  manifest.version = '${VERSION}';
  fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
"

echo "Build complete with version ${VERSION}"
