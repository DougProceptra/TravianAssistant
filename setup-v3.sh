#!/bin/bash

# TravianAssistant V3 - Quick Setup Script
# Run this in Replit to get everything ready

echo "🚀 TravianAssistant V3 Setup"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 failed"
        exit 1
    fi
}

# 1. Pull latest from GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main
check_status "Git pull"
echo ""

# 2. Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
check_status "Backend npm install"
echo ""

# 3. Initialize database
echo "🗄️ Initializing database..."
node init-db.js
check_status "Database initialization"
echo ""

# 4. Optional: Import map data
echo -e "${YELLOW}Do you want to import map data now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "🗺️ Importing map data (this may take a minute)..."
    node import-map.js
    check_status "Map import"
else
    echo "⏩ Skipping map import (can run later with: node backend/import-map.js)"
fi
echo ""

# 5. Build extension
echo "🏗️ Building Chrome extension..."
cd ../packages/extension
chmod +x build-simple.sh
./build-simple.sh
check_status "Extension build"
echo ""

# 6. Start backend server
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. The backend server will start now"
echo "   2. Download the 'dist' folder from packages/extension/"
echo "   3. Load it in Chrome as unpacked extension"
echo "   4. Navigate to Travian game"
echo "   5. Click chat button to test AI"
echo ""
echo "🚀 Starting backend server on port 3000..."
echo "========================================="
cd ../../backend
node server.js
