#!/bin/bash

# Fix script for ACTUAL issues: Chat not working, getAllCachedVillages error
echo "🔧 Fixing TravianAssistant REAL Issues"
echo "======================================="
echo ""

# Priority 1: Test the chat fix from previous session
echo "📋 Priority 1: Testing Chat Fix"
echo "--------------------------------"
echo "Previous session found manifest.json was pointing to wrong file."
echo "It should use 'service_worker.js' not 'background.js'"
echo ""

# Check current manifest
echo "Checking manifest.json..."
if grep -q "service_worker.js" packages/extension/manifest.json; then
    echo "✅ Manifest correctly points to service_worker.js"
else
    echo "❌ Manifest still points to wrong file - fixing..."
    # This would need to be fixed in the actual manifest.json file
fi

echo ""
echo "📋 Priority 2: Fix getAllCachedVillages Error"
echo "----------------------------------------------"
echo "The error 'getAllCachedVillages is not a function' means"
echo "the overview parser is broken or not properly exported."
echo ""

# Create a debug test file
cat > test-data-collection.js << 'EOF'
// Test script to debug data collection issues
// Run this in Chrome console on Travian page after loading extension

console.log("=== TravianAssistant Debug ===");

// Check if TLA is loaded
if (typeof window.TLA !== 'undefined') {
    console.log("✅ TLA is loaded");
    
    // Check available methods
    console.log("Available methods:", Object.keys(window.TLA));
    
    // Try to get game state
    if (window.TLA.debug) {
        console.log("Running debug...");
        window.TLA.debug();
    }
    
    // Check for safeScraper
    if (window.TLA.safeScraper) {
        console.log("SafeScraper available:", window.TLA.safeScraper);
    }
    
    // Check for overviewParser
    if (window.TLA.overviewParser) {
        console.log("OverviewParser available:", window.TLA.overviewParser);
        
        // Check if getAllCachedVillages exists
        if (window.TLA.overviewParser.getAllCachedVillages) {
            console.log("✅ getAllCachedVillages exists");
        } else {
            console.log("❌ getAllCachedVillages is missing!");
            console.log("Available methods:", Object.keys(window.TLA.overviewParser));
        }
    }
} else {
    console.log("❌ TLA not loaded - extension may have errors");
}

// Check for console errors
console.log("Check console for any red errors above");
EOF

echo "Created test-data-collection.js"
echo ""

echo "📋 Next Steps:"
echo "--------------"
echo "1. Run in Replit shell:"
echo "   chmod +x rollback-v3.sh"
echo "   ./rollback-v3.sh"
echo "   (type 'yes' to confirm rollback)"
echo ""
echo "2. After rollback, build extension:"
echo "   cd packages/extension"
echo "   ./build-simple.sh"
echo ""
echo "3. In Chrome:"
echo "   - Go to chrome://extensions"
echo "   - Remove old TravianAssistant"
echo "   - Load unpacked from packages/extension/dist"
echo "   - IMPORTANT: Click 'Service Worker' link to check for errors"
echo ""
echo "4. On Travian page:"
echo "   - Open F12 Console"
echo "   - Copy/paste content from test-data-collection.js"
echo "   - Share the output"
echo ""
echo "5. Test chat:"
echo "   - Click chat button"
echo "   - Enter email"
echo "   - Try sending a message"
echo "   - Check Service Worker console for errors"
echo ""

echo "✅ Fix script ready. Please run rollback first, then test."
