#!/bin/bash

# TravianAssistant Extension Build Script
# Version: 1.1.0 - With Game Optimizer
# This script builds the extension using the -fixed.ts files

echo "🔧 TravianAssistant Build Script v1.1.0"
echo "======================================="

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo "❌ TypeScript compiler not found. Installing..."
    npm install -g typescript
fi

# Clean previous build
echo "🗑️  Cleaning previous build..."
rm -rf dist/
mkdir -p dist

echo "📦 Building extension with optimizer..."

# Build the background script
echo "  → Building background.ts..."
tsc src/background.ts --outDir dist --module esnext --target es2020 --lib es2020,dom

# Build the game optimizer and AI enhancer
echo "  → Building game-start-optimizer.ts..."
tsc src/game-start-optimizer.ts --outDir dist --module esnext --target es2020 --lib es2020,dom

echo "  → Building ai-prompt-enhancer.ts..."
tsc src/ai-prompt-enhancer.ts --outDir dist --module esnext --target es2020 --lib es2020,dom

# Build the content scripts using -fixed versions
echo "  → Building content scripts (using -fixed.ts files)..."

# CRITICAL: Build the -fixed versions, not the regular ones!
tsc src/content/index-fixed.ts \
    src/content/conversational-ai-fixed.ts \
    src/content/conversational-ai-integrated.ts \
    src/content/game-integration.ts \
    src/content/safe-scraper.ts \
    src/content/overview-scraper.ts \
    src/content/village-scraper.ts \
    src/content/db-interface.ts \
    --outDir dist/temp --module esnext --target es2020 --lib es2020,dom

# Concatenate all content scripts into one file
echo "  → Concatenating content scripts..."
cat dist/temp/content/safe-scraper.js \
    dist/temp/content/overview-scraper.js \
    dist/temp/content/village-scraper.js \
    dist/temp/content/db-interface.js \
    dist/temp/game-start-optimizer.js \
    dist/temp/ai-prompt-enhancer.js \
    dist/temp/content/game-integration.js \
    dist/temp/content/conversational-ai-integrated.js \
    dist/temp/content/index-fixed.js > dist/content.js

# Clean up temp directory
rm -rf dist/temp

# Copy manifest and assets
echo "  → Copying manifest and assets..."
cp manifest.json dist/
cp -r icons dist/ 2>/dev/null || true

# Create a version file
echo "  → Creating version info..."
echo "{
  \"version\": \"1.1.0\",
  \"build\": \"$(date +%Y%m%d_%H%M%S)\",
  \"features\": [
    \"Game Start Optimizer\",
    \"AI Strategic Enhancement\",
    \"Phase Detection\",
    \"Settlement Predictor\",
    \"Action Prioritization\"
  ]
}" > dist/version.json

echo ""
echo "✅ Build complete! Extension v1.1.0 ready in dist/"
echo ""
echo "🎯 New Features in v1.1.0:"
echo "  • Game Start Optimizer - Top-5 settlement targeting"
echo "  • AI Strategic Context - Phase-aware recommendations"
echo "  • Quick Analysis HUD - Real-time metrics"
echo "  • Action Planning - Immediate/daily/weekly plans"
echo "  • Settlement Predictor - ETA to 2nd village"
echo ""
echo "📋 To install:"
echo "  1. Download the 'dist' folder"
echo "  2. Go to chrome://extensions/"
echo "  3. Enable 'Developer mode'"
echo "  4. Click 'Load unpacked' and select the dist folder"
echo ""
echo "💡 Test commands in chat:"
echo "  • Type 'analyze' for full analysis"
echo "  • Type 'plan' for action plan"
echo "  • Ask strategic questions for AI advice"
