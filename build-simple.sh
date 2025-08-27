#!/bin/bash

echo "Building TravianAssistant..."

# Auto-increment version BEFORE build
current=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
IFS='.' read -ra PARTS <<< "$current"
PARTS[2]=$((PARTS[2]+1))
new_version="${PARTS[0]}.${PARTS[1]}.${PARTS[2]}"

# Update version in SOURCE files
sed -i "s/\"version\": \".*\"/\"version\": \"$new_version\"/" manifest.json
sed -i "s/VERSION = \".*\"/VERSION = \"$new_version\"/" src/version.ts

echo "Version bumped to $new_version"

# Clean dist
rm -rf dist
mkdir -p dist

# Bundle with esbuild
echo "Bundling..."
npx esbuild src/content/index.ts --bundle --outfile=dist/content.js --platform=browser --target=chrome90 --format=iife
npx esbuild src/background.ts --bundle --outfile=dist/background.js --platform=browser --target=chrome90 --format=iife

# Copy static files (INCLUDING the updated manifest)
echo "Copying files..."
cp manifest.json dist/
cp public/*.html dist/ 2>/dev/null || true
cp public/*.css dist/ 2>/dev/null || true  
cp public/*.png dist/ 2>/dev/null || true

echo "Build complete with version $new_version"
ls -la dist/
