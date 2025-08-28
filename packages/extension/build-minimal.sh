#!/bin/bash
VERSION="0.9.3"
echo "Minimal build v${VERSION}"

# Clean
rm -rf dist
mkdir -p dist

# Update version
sed -i "s/export const VERSION = .*/export const VERSION = '${VERSION}';/g" src/version.ts

# Simple esbuild without any fancy options
npx esbuild src/content/index-fixed.ts --bundle --outfile=dist/content.js --format=iife
npx esbuild src/background.ts --bundle --outfile=dist/background.js --format=iife

# Copy manifest
cp manifest.json dist/
sed -i "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/g" dist/manifest.json

echo "Done - check dist/ folder"
ls -la dist/
