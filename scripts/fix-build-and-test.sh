#!/bin/bash

echo "🔧 TravianAssistant Build Fix & Test Script"
echo "==========================================="

# Fix missing dependencies
echo "📦 Installing missing vite plugin..."
cd packages/extension
npm install vite-plugin-static-copy --save-dev

echo "🏗️ Building extension..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📂 Extension built to: packages/extension/dist/"
    echo ""
    echo "To install in Chrome:"
    echo "1. Open chrome://extensions/"
    echo "2. Enable 'Developer mode'"
    echo "3. Click 'Load unpacked'"
    echo "4. Select: $(pwd)/dist"
else
    echo "❌ Build failed. Checking dependencies..."
    npm list vite-plugin-static-copy
fi

echo ""
echo "📋 For testing game data collection:"
echo "=================================="
echo "The inspector scripts are meant to run IN YOUR BROWSER CONSOLE, not in Node.js"
echo ""
echo "1. Open your Travian game in Chrome"
echo "2. Open DevTools (F12)"
echo "3. Go to Console tab"
echo "4. Copy and paste the content of one of these files:"
echo "   - scripts/simple-page-inspector.js (basic inspection)"
echo "   - scripts/inspect-travian-data.js (detailed inspection)"
echo ""
echo "Or use this one-liner in the browser console:"
echo "fetch('https://raw.githubusercontent.com/DougProceptra/TravianAssistant/main/scripts/simple-page-inspector.js').then(r=>r.text()).then(eval)"
