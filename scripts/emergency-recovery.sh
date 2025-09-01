# Quick Recovery Script - RUN THIS FIRST NEXT SESSION

echo "=== TravianAssistant Emergency Recovery ==="
echo "Current broken state: Chat UI works but messages don't send"
echo ""

# Step 1: Check current state
echo "Step 1: Checking current branch and status..."
git status
git log --oneline -5

# Step 2: Stash any local changes
echo -e "\nStep 2: Stashing local changes..."
git stash

# Step 3: Create recovery branch
echo -e "\nStep 3: Creating recovery branch..."
git checkout -b recovery-$(date +%Y%m%d-%H%M%S)

# Step 4: Apply only the WORKING fixes
echo -e "\nStep 4: Applying working fixes..."

# Keep the parser fix (this works)
cp packages/extension/src/content/overview-parser-v6.ts packages/extension/src/content/overview-parser.ts
echo "✓ Parser fix applied"

# Fix the message handler in background
cat > packages/extension/src/background-fix.ts << 'EOF'
// Temporary fix for message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[TLA BG] Message received:', request.type);
  
  if (request.type === 'CHAT_MESSAGE') {
    // Make sure we have game context
    const gameContext = request.gameContext || {
      error: 'No game context provided',
      timestamp: Date.now()
    };
    
    console.log('[TLA BG] Sending to AI with context:', gameContext);
    
    // Call the AI proxy
    fetch('https://travian-assistant-proxy.vercel.app/api/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: request.message,
        gameContext: gameContext,
        model: 'claude-sonnet-4-20250514'
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('[TLA BG] AI response:', data);
      sendResponse({ reply: data.response || 'Error: No response from AI' });
    })
    .catch(error => {
      console.error('[TLA BG] Error:', error);
      sendResponse({ reply: 'Error connecting to AI: ' + error.message });
    });
    
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'REQUEST_GAME_STATE') {
    // Forward to content script
    chrome.tabs.sendMessage(sender.tab.id, request, sendResponse);
    return true;
  }
});
EOF

# Step 5: Set version correctly
echo -e "\nStep 5: Setting version to 1.1.0..."
cat > packages/extension/src/version.ts << 'EOF'
export const VERSION = '1.1.0';
EOF

# Update manifest
sed -i 's/"version": ".*"/"version": "1.1.0"/' packages/extension/manifest.json

# Step 6: Build
echo -e "\nStep 6: Building extension..."
cd packages/extension
npm run build

echo -e "\n=== Recovery Complete ==="
echo "1. Reload extension in Chrome"
echo "2. Test that:"
echo "   - Villages show (should be 9)"
echo "   - Chat messages send"
echo "   - AI responds with game context"
echo ""
echo "If still broken, run: git checkout 98b28e8e"
