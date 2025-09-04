#!/bin/bash
# TravianAssistant Extension Clean Test Script
# Purpose: Complete cleanup for fresh testing of mem0 integration
# Created: September 4, 2025

echo "=========================================="
echo "TravianAssistant Complete Cleanup & Reset"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will DELETE all extension data!"
echo "   - All localStorage data"
echo "   - All sessionStorage data"
echo "   - All saved preferences"
echo "   - All conversation history"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "📋 Creating cleanup instructions..."

# Create the JavaScript cleanup file
cat > cleanup-extension-data.js << 'EOF'
// TravianAssistant Complete Data Cleanup
// Run this in Chrome DevTools Console on any Travian page

console.log('Starting TravianAssistant cleanup...');

// List of all TLA localStorage keys
const TLA_KEYS = [
    'TLA_USER_ID',
    'TLA_ACCOUNT_ID',
    'TLA_USER_EMAIL_MASKED',
    'TLA_MEMORY_STATUS',
    'TLA_HUD_POSITION',
    'TLA_CP_DATA',
    'TLA_PRODUCTION',
    'TLA_HERO_DATA',
    'TLA_CONVERSATION_ID'
];

// Remove all TLA localStorage items
console.log('\n📦 Cleaning localStorage...');
TLA_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
        console.log(`  ✓ Removing ${key}: ${localStorage.getItem(key)?.substring(0, 20)}...`);
        localStorage.removeItem(key);
    }
});

// Clean any other TLA_ prefixed items we might have missed
const allKeys = Object.keys(localStorage);
allKeys.forEach(key => {
    if (key.startsWith('TLA_')) {
        console.log(`  ✓ Removing additional key: ${key}`);
        localStorage.removeItem(key);
    }
});

// Clear sessionStorage
console.log('\n📦 Cleaning sessionStorage...');
const sessionKeys = Object.keys(sessionStorage);
sessionKeys.forEach(key => {
    if (key.startsWith('TLA_')) {
        console.log(`  ✓ Removing session key: ${key}`);
        sessionStorage.removeItem(key);
    }
});

console.log('\n✅ Cleanup complete!');
console.log('\nCurrent state:');
console.log('  localStorage TLA items:', Object.keys(localStorage).filter(k => k.startsWith('TLA_')).length);
console.log('  sessionStorage TLA items:', Object.keys(sessionStorage).filter(k => k.startsWith('TLA_')).length);

console.log('\n🔄 Next steps:');
console.log('1. Go to chrome://extensions');
console.log('2. Reload TravianAssistant');
console.log('3. Refresh this Travian tab');
console.log('4. You should see the email prompt on first load');
EOF

# Create a Python version for automated cleanup
cat > cleanup_extension.py << 'EOF'
#!/usr/bin/env python3
"""
TravianAssistant Extension Cleanup Script
Automates cleanup via Chrome DevTools Protocol
"""

import json
import time

print("""
================================================
TravianAssistant Automated Cleanup (Python)
================================================

This script will:
1. Connect to Chrome via DevTools
2. Navigate to your Travian game
3. Clear all extension data
4. Prepare for fresh testing

NOTE: Requires Chrome to be running with:
  --remote-debugging-port=9222

To start Chrome with debugging:
  Mac: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
  Windows: "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
  Linux: google-chrome --remote-debugging-port=9222
""")

try:
    import requests
    from websocket import create_connection
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call(["pip", "install", "requests", "websocket-client"])
    import requests
    from websocket import create_connection

def cleanup_extension_data():
    # Connect to Chrome DevTools
    try:
        response = requests.get('http://localhost:9222/json')
        tabs = response.json()
        
        # Find Travian tab
        travian_tab = None
        for tab in tabs:
            if 'travian.com' in tab.get('url', ''):
                travian_tab = tab
                break
        
        if not travian_tab:
            print("❌ No Travian tab found. Please open Travian first.")
            return False
        
        # Connect to the tab
        ws_url = travian_tab['webSocketDebuggerUrl']
        ws = create_connection(ws_url)
        
        # Execute cleanup JavaScript
        cleanup_js = """
            const TLA_KEYS = [
                'TLA_USER_ID', 'TLA_ACCOUNT_ID', 'TLA_USER_EMAIL_MASKED',
                'TLA_MEMORY_STATUS', 'TLA_HUD_POSITION', 'TLA_CP_DATA',
                'TLA_PRODUCTION', 'TLA_HERO_DATA', 'TLA_CONVERSATION_ID'
            ];
            
            TLA_KEYS.forEach(key => localStorage.removeItem(key));
            
            Object.keys(localStorage)
                .filter(k => k.startsWith('TLA_'))
                .forEach(k => localStorage.removeItem(k));
            
            Object.keys(sessionStorage)
                .filter(k => k.startsWith('TLA_'))
                .forEach(k => sessionStorage.removeItem(k));
            
            'Cleanup complete';
        """
        
        # Send the command
        ws.send(json.dumps({
            "id": 1,
            "method": "Runtime.evaluate",
            "params": {"expression": cleanup_js}
        }))
        
        # Get response
        result = ws.recv()
        ws.close()
        
        print("✅ Extension data cleared successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure Chrome is running with --remote-debugging-port=9222")
        return False

if __name__ == "__main__":
    cleanup_extension_data()
EOF

echo ""
echo "✅ Cleanup scripts created!"
echo ""
echo "=========================================="
echo "Option 1: Manual Cleanup (Recommended)"
echo "=========================================="
echo "1. Open Chrome DevTools on any Travian page (F12)"
echo "2. Go to Console tab"
echo "3. Copy and paste the contents of cleanup-extension-data.js"
echo "4. Press Enter to run"
echo ""
echo "=========================================="
echo "Option 2: Quick Chrome Console Command"
echo "=========================================="
echo "Run this one-liner in Chrome Console:"
echo ""
cat << 'EOF'
['TLA_USER_ID','TLA_ACCOUNT_ID','TLA_USER_EMAIL_MASKED','TLA_MEMORY_STATUS','TLA_HUD_POSITION','TLA_CP_DATA','TLA_PRODUCTION','TLA_HERO_DATA'].forEach(k=>localStorage.removeItem(k));Object.keys(localStorage).filter(k=>k.startsWith('TLA_')).forEach(k=>localStorage.removeItem(k));Object.keys(sessionStorage).filter(k=>k.startsWith('TLA_')).forEach(k=>sessionStorage.removeItem(k));console.log('✅ TLA data cleared!');
EOF
echo ""
echo ""
echo "=========================================="
echo "Option 3: Automated Cleanup (Advanced)"
echo "=========================================="
echo "1. Start Chrome with debugging enabled:"
echo "   Mac: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222"
echo "2. Open Travian in that Chrome instance"
echo "3. Run: python3 cleanup_extension.py"
echo ""
echo "=========================================="
echo "After Cleanup"
echo "=========================================="
echo "1. Go to chrome://extensions"
echo "2. Reload TravianAssistant"
echo "3. Refresh your Travian tab"
echo "4. You should see the email prompt (fresh start)"
echo ""
echo "Files created:"
echo "  📄 cleanup-extension-data.js (full cleanup script)"
echo "  🐍 cleanup_extension.py (automated cleanup)"
echo ""