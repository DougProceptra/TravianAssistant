#!/bin/bash

# FOOLPROOF Build Script - Version 1.0.5
# This script ACTUALLY sets the version correctly everywhere

VERSION="1.0.5"
echo "Building TravianAssistant v${VERSION} - WITH PROPER VERSION THIS TIME"

# Clean
rm -rf dist/
mkdir dist/

# STEP 1: Update manifest.json version BEFORE copying
echo "Setting version ${VERSION} in manifest.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" manifest.json

# STEP 2: Update package.json version
echo "Setting version ${VERSION} in package.json..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" package.json

# STEP 3: Update version.ts
echo "Setting version ${VERSION} in src/version.ts..."
echo "export const VERSION = '${VERSION}';" > src/version.ts

# STEP 4: Copy manifest (now with correct version)
cp manifest.json dist/

# STEP 5: Build JavaScript files
npx esbuild src/content/index.ts --bundle --outfile=dist/content.js --format=iife --target=chrome90
npx esbuild src/background.ts --bundle --outfile=dist/background.js --format=iife --target=chrome90

# STEP 6: Copy options files
cp src/options.html dist/
cp src/options.js dist/

# STEP 7: Create version file
echo "${VERSION}" > dist/version.txt

# STEP 8: VERIFY everything has the right version
echo ""
echo "=== VERSION VERIFICATION ==="
echo -n "manifest.json version: "
grep -o '"version": "[^"]*"' dist/manifest.json
echo -n "version.txt: "
cat dist/version.txt
echo -n "package.json version: "
grep -o '"version": "[^"]*"' package.json

echo ""
echo "✅ Build complete - version ${VERSION} set EVERYWHERE"
echo ""
echo "Files in dist/:"
ls -la dist/
echo ""
echo "NOW you can download and Chrome will see v${VERSION}!"
