#!/bin/bash

echo "Building TravianAssistant..."

# Auto-increment version BEFORE build
current=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
IFS='.' read -ra PARTS <<< "$current"
PARTS[2]=$((PARTS[2]+1))
new_version="${PARTS[0]}.${PARTS[1]}.${PARTS[2]}"

# Update version in SOURCE files
sed -i "s/\"version\": \".*\"/\"version\": \"$new_version\"/" manifest.json
sed -i "s/export const VERSION = .*/export const VERSION = '$new_version';/" src/version.ts

echo "Version bumped to $new_version"

# Clean everything
rm -rf dist
mkdir -p dist

# Bundle with rollup instead of esbuild for better module handling
echo "Installing rollup if needed..."
npm install --no-save rollup @rollup/plugin-typescript @rollup/plugin-node-resolve 2>/dev/null

echo "Bundling with rollup..."
npx rollup src/content/index-fixed.ts \
  --file dist/content.js \
  --format iife \
  --plugin @rollup/plugin-node-resolve \
  --plugin @rollup/plugin-typescript

# If rollup fails, fall back to esbuild with proper settings
if [ $? -ne 0 ]; then
  echo "Rollup failed, using esbuild..."
  npx esbuild src/content/index-fixed.ts \
    --bundle \
    --outfile=dist/content.js \
    --platform=browser \
    --target=chrome90 \
    --format=iife \
    --global-name=TLA \
    --keep-names
fi

# Bundle background
npx esbuild src/background.ts --bundle --outfile=dist/background.js --platform=browser --target=chrome90 --format=iife

# Copy static files
cp manifest.json dist/
cp public/*.html dist/ 2>/dev/null || true
cp public/*.css dist/ 2>/dev/null || true
cp public/*.png dist/ 2>/dev/null || true

echo "Build complete with version $new_version"
