#!/bin/bash

# Fix the conversational-ai-fixed.ts file
cat > /tmp/chat-fixes.txt << 'FIXES'
# Find this line (around line 180):
    chat.innerHTML = `
      <div class="tla-chat-header">
        <span class="tla-chat-title">TravianAssistant AI</span>
        <span class="tla-chat-version">v${VERSION}</span>

# Replace with:
    chat.innerHTML = `
      <div class="tla-chat-header">
        <span class="tla-chat-title">TravianAssistant AI</span>
        <span class="tla-chat-version">v${VERSION}</span>
        <span class="tla-profile-status ${this.chatState.isInitialized ? 'tla-profile-initialized' : 'tla-profile-not-initialized'}">
          ${this.chatState.isInitialized ? '✓ Profile' : '⚠ No Profile'}
        </span>

# Find the style for #tla-chat-interface (around line 210):
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 550px;

# Replace with:
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      height: 500px;
      max-height: calc(100vh - 100px);

# Find .tla-chat-messages style (around line 250):
        flex: 1;
        overflow-y: auto;
        padding: 16px;

# Replace with:
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        min-height: 200px;
        max-height: 350px;
FIXES

# Apply comprehensive fixes
sed -i '/<div class="tla-chat-header">/,/<\/div>/ {
  s|<span class="tla-chat-version">v\${VERSION}</span>|<span class="tla-chat-version">v${VERSION}</span>\n        <span class="tla-profile-status">${this.chatState.isInitialized ? "✓ Profile" : "⚠ Setup Required"}</span>|
}' src/content/conversational-ai-fixed.ts

# Fix the height issue - messages running off bottom
sed -i 's/height: 550px;/height: 500px;\n      max-height: calc(100vh - 100px);/' src/content/conversational-ai-fixed.ts

# Fix the messages area to have proper scrolling
sed -i '/.tla-chat-messages {/,/}/ {
  s/flex: 1;/flex: 1;\n        min-height: 200px;\n        max-height: 350px;/
}' src/content/conversational-ai-fixed.ts

# Add profile status styles
sed -i '/\.tla-chat-version {/a\
      }\n\
      \n\
      .tla-profile-status {\n\
        font-size: 11px;\n\
        padding: 2px 6px;\n\
        border-radius: 3px;\n\
        margin-left: 8px;\n\
      }\n\
      \n\
      .tla-profile-status:contains("✓") {\n\
        background: rgba(0, 255, 0, 0.2);\n\
        color: #4f4;\n\
      }\n\
      \n\
      .tla-profile-status:contains("⚠") {\n\
        background: rgba(255, 100, 0, 0.2);\n\
        color: #ffa500;\n\
' src/content/conversational-ai-fixed.ts

# Update version to 0.8.8 to track this fix
sed -i 's/VERSION="0.8.[0-9]"/VERSION="0.8.8"/' build-minimal.sh
sed -i "s/VERSION = '0.8.[0-9]'/VERSION = '0.8.8'/" src/version.ts
sed -i 's/"version": "0.8.[0-9]"/"version": "0.8.8"/' manifest.json

echo "Fixes applied. Building..."
