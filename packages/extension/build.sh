#!/bin/bash

# Load Replit Secrets
BACKEND_URL=${TLA_BACKEND_URL:-"https://travian-proxy-simple.vercel.app"}

# Build settings
BUILD_TYPE=${1:-dev}
VERSION="0.8.0"

if [ "$BUILD_TYPE" = "prod" ]; then
  echo "🚀 Production Build v${VERSION}"
  MINIFY="true"
else
  echo "🔧 Development Build v${VERSION}-dev"  
  VERSION="${VERSION}-dev"
  MINIFY="false"
fi

echo "Backend: ${BACKEND_URL}"
echo "Version: ${VERSION}"

# Clean
rm -rf dist
mkdir -p dist

# Update imports to use the fixed chat version
if [ -f "src/content/index.ts" ]; then
  sed -i "s|'./conversational-ai'|'./conversational-ai-fixed'|g" src/content/index.ts 2>/dev/null || true
fi

# Build content script (use index.ts as entry point)
if [ -f "src/content/index.ts" ]; then
  echo "Building content script..."
  npx esbuild src/content/index.ts \
    --bundle \
    --outfile=dist/content.js \
    --format=iife \
    --define:BACKEND_URL=\"${BACKEND_URL}\" \
    --define:VERSION=\"${VERSION}\" \
    --minify=${MINIFY}
elif [ -f "src/content/index-fixed.ts" ]; then
  echo "Building content script from index-fixed.ts..."
  npx esbuild src/content/index-fixed.ts \
    --bundle \
    --outfile=dist/content.js \
    --format=iife \
    --define:BACKEND_URL=\"${BACKEND_URL}\" \
    --define:VERSION=\"${VERSION}\" \
    --minify=${MINIFY}
else
  echo "Error: No content entry point found"
  exit 1
fi

# Build background script
if [ -f "src/background.ts" ]; then
  echo "Building background script..."
  # Fix the backend URL in background
  sed -i "s|http://localhost:3000|${BACKEND_URL}|g" src/background.ts 2>/dev/null || true
  
  npx esbuild src/background.ts \
    --bundle \
    --outfile=dist/background.js \
    --format=iife \
    --define:BACKEND_URL=\"${BACKEND_URL}\" \
    --define:VERSION=\"${VERSION}\" \
    --minify=${MINIFY}
else
  echo "Error: src/background.ts not found"
  exit 1
fi

# Update manifest
if [ -f "manifest.json" ]; then
  node -e "
    const fs = require('fs');
    const manifest = require('./manifest.json');
    manifest.version = '${VERSION}'.replace('-dev', '');
    fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
  "
else
  echo "Warning: manifest.json not found"
fi

echo "✅ Build complete!"
echo "Reload extension in Chrome to test"
