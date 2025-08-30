#!/bin/bash
# Wrapper script to run extraction with correct Chrome path

export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium-browser"

echo "Using Chrome at: $PUPPETEER_EXECUTABLE_PATH"

if [ "$1" == "minimal" ]; then
    echo "Running minimal extraction..."
    node scripts/extract-kirilloid-minimal-fixed.js
elif [ "$1" == "full" ]; then
    echo "Running full extraction..."
    node scripts/extract-kirilloid-puppeteer-fixed.js
else
    echo "Usage: ./scripts/run-extraction.sh [minimal|full]"
    echo "  minimal - Extract only Main Building for validation"
    echo "  full    - Extract all game data"
fi
