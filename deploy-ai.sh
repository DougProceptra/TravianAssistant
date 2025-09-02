#!/bin/bash

# TravianAssistant Quick Deploy Script
# Sets up enhanced backend with AI integration

echo "🚀 TravianAssistant AI Integration Setup"
echo "========================================"

# Check if running in Replit
if [ -n "$REPL_SLUG" ]; then
    echo "✅ Replit environment detected"
    BACKEND_URL="https://$REPL_SLUG.$REPL_OWNER.repl.co"
else
    echo "📍 Local environment detected"
    BACKEND_URL="http://localhost:3002"
fi

echo ""
echo "Step 1: Backend Setup"
echo "--------------------"

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express cors better-sqlite3 node-fetch
else
    echo "✅ Dependencies already installed"
fi

# Check for ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo ""
    echo "⚠️  IMPORTANT: AI features require ANTHROPIC_API_KEY"
    echo "   Set it in Replit Secrets or .env file:"
    echo "   ANTHROPIC_API_KEY=your-api-key-here"
    echo ""
    echo "   Without this, the AI chat will not work!"
    read -p "Press Enter to continue without AI, or Ctrl+C to exit and set the key..."
fi

# Create database directory
mkdir -p db

echo ""
echo "Step 2: Extension Setup"
echo "----------------------"

# Build extension with connector
cat > packages/extension/dist/content.js << 'EOF'
// TravianAssistant v3.0 - AI Enhanced
console.log('[TravianAssistant] Loading AI-enhanced version...');

// Load the HUD connector
const script = document.createElement('script');
script.src = chrome.runtime.getURL('hud-connector.js');
document.head.appendChild(script);

// Store backend URL
localStorage.setItem('TLA_BACKEND_URL', '${BACKEND_URL}');
console.log('[TravianAssistant] Backend URL set to:', '${BACKEND_URL}');
EOF

# Copy connector to dist
cp packages/extension/src/content/hud-connector.js packages/extension/dist/

# Update manifest to include connector
cat > packages/extension/dist/manifest.json << EOF
{
  "manifest_version": 3,
  "name": "TravianAssistant AI",
  "version": "3.0.0",
  "description": "AI-powered Travian strategy assistant",
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "*://*.travian.com/*",
    "${BACKEND_URL}/*"
  ],
  "content_scripts": [{
    "matches": ["*://*.travian.com/*.php*"],
    "js": ["content.js"],
    "run_at": "document_end"
  }],
  "web_accessible_resources": [{
    "resources": ["hud-connector.js"],
    "matches": ["*://*.travian.com/*"]
  }]
}
EOF

echo "✅ Extension built with AI integration"

echo ""
echo "Step 3: Start Enhanced Backend"
echo "------------------------------"

# Check which server file to use
if [ -f "server-enhanced.js" ]; then
    echo "🚀 Starting enhanced server with AI..."
    node server-enhanced.js &
    SERVER_PID=$!
    echo "✅ Enhanced server started (PID: $SERVER_PID)"
else
    echo "⚠️  Enhanced server not found, using standard server..."
    node server.js &
    SERVER_PID=$!
    echo "✅ Standard server started (PID: $SERVER_PID)"
fi

echo ""
echo "========================================"
echo "✅ SETUP COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "1. Load extension from: packages/extension/dist/"
echo "2. Visit any Travian page (*.travian.com)"
echo "3. Enter your email when prompted"
echo "4. Look for the AI HUD in top-right corner"
echo ""
echo "🔗 Backend URL: $BACKEND_URL"
echo "📊 Admin Panel: $BACKEND_URL/admin.html"
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  REMINDER: Set ANTHROPIC_API_KEY for AI features!"
else
    echo "✅ AI Chat is ENABLED!"
fi

echo ""
echo "💡 Tips:"
echo "- The HUD will sync every 30 seconds"
echo "- Click 'Ask AI Strategy Advisor' for help"
echo "- Drag the HUD to reposition it"
echo "- Check console for debug messages"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"

# Keep script running
wait $SERVER_PID
