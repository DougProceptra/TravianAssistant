#!/bin/bash

# TravianAssistant Replit Setup Script
# Run this once to initialize your Replit environment

echo "🚀 TravianAssistant Replit Setup"
echo "================================"

# Check if we're in Replit
if [ -z "$REPL_SLUG" ]; then
  echo "⚠️  Warning: Not running in Replit environment"
  echo "   Some features may not work correctly"
fi

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 2: Create data directory if it doesn't exist
echo ""
echo "📁 Creating data directories..."
mkdir -p data
mkdir -p db

# Step 3: Initialize database
echo ""
echo "🗄️  Initializing SQLite database..."
if [ -f "scripts/init-v3-database.js" ]; then
  node scripts/init-v3-database.js
else
  echo "   Database will be initialized on first run"
fi

# Step 4: Set up environment variables
echo ""
echo "🔐 Setting up environment..."
if [ ! -f ".env" ]; then
  cat > .env << EOF
# TravianAssistant Environment Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DB_PATH=./db/travian.db

# Add your Anthropic API key here (optional for AI features)
# ANTHROPIC_API_KEY=your_key_here

# Replit URLs (auto-detected)
REPLIT_URL=https://${REPL_SLUG}.${REPL_OWNER}.repl.co
EOF
  echo "   Created .env file (add your API keys if needed)"
else
  echo "   .env file already exists"
fi

# Step 5: Display important URLs
echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Important URLs for your extension:"
echo "   Backend URL: https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
echo "   Admin Panel: https://${REPL_SLUG}.${REPL_OWNER}.repl.co/admin.html"
echo "   Health Check: https://${REPL_SLUG}.${REPL_OWNER}.repl.co/health"
echo ""
echo "🎮 Next Steps:"
echo "   1. Run 'npm start' to start the server"
echo "   2. Install the Chrome extension"
echo "   3. Configure extension with backend URL above"
echo "   4. Start playing Travian!"
echo ""
echo "👥 Multi-Player Support:"
echo "   3-5 players can use this backend simultaneously"
echo "   Each player's data is stored separately"
echo ""
