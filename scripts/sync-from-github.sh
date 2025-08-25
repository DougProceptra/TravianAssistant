#!/bin/bash

# Sync from GitHub to Replit
# Run this to pull latest changes from GitHub

echo "================================================"
echo "Syncing from GitHub to Replit"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Not in TravianAssistant root directory"
    echo "Run: cd ~/TravianAssistant"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to stash these changes? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Stashing local changes..."
        git stash push -m "Auto-stash before sync $(date)"
        echo "✅ Changes stashed"
    else
        echo "❌ Aborting sync. Please handle local changes first:"
        echo "  - Commit them: git add . && git commit -m 'your message'"
        echo "  - Or discard: git reset --hard HEAD"
        exit 1
    fi
    echo ""
fi

# Fetch latest
echo "🔍 Fetching latest from GitHub..."
git fetch origin main

# Check if we're behind
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Already up-to-date with GitHub!"
    echo ""
else
    BEHIND=$(git rev-list --count HEAD..origin/main)
    echo "📥 Pulling $BEHIND new commits from GitHub..."
    echo ""
    
    # Pull the changes
    git pull origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully synced!"
        echo ""
        echo "New commits:"
        git log ${LOCAL_COMMIT}..HEAD --oneline
    else
        echo "❌ Pull failed - may need manual intervention"
        exit 1
    fi
fi

echo ""
echo "================================================"
echo "Post-Sync Tasks"
echo "================================================"
echo ""

# Check if package.json was updated
if git diff ${LOCAL_COMMIT}..HEAD --name-only | grep -q "package.json"; then
    echo "📦 package.json was updated - installing dependencies..."
    npm install
    echo "✅ Dependencies updated"
    echo ""
fi

# Check if extension source was updated
if git diff ${LOCAL_COMMIT}..HEAD --name-only | grep -q "packages/extension/src"; then
    echo "🔨 Extension source code was updated"
    echo "Building extension..."
    cd packages/extension
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Extension built successfully!"
        VERSION=$(grep '"version"' dist/manifest.json | cut -d'"' -f4)
        echo "Version: $VERSION"
    else
        echo "❌ Build failed - check error messages above"
        exit 1
    fi
    cd ../..
    echo ""
fi

# Check if backend was updated
if git diff ${LOCAL_COMMIT}..HEAD --name-only | grep -q "backend/"; then
    echo "🔄 Backend code was updated"
    echo "You may need to restart the backend server"
    echo "Run: npm run server"
    echo ""
fi

echo "================================================"
echo "Sync Complete!"
echo "================================================"
echo ""
echo "Current status:"
git log -1 --oneline
echo ""

# Check if extension is ready
if [ -f "packages/extension/dist/manifest.json" ]; then
    VERSION=$(grep '"version"' packages/extension/dist/manifest.json | cut -d'"' -f4)
    echo "✅ Extension ready - Version $VERSION"
    echo ""
    echo "Next steps:"
    echo "1. Download the extension: packages/extension/dist"
    echo "2. Load in Chrome at chrome://extensions/"
    echo "3. Test on your Travian game"
else
    echo "⚠️  Extension not built"
    echo "Run: cd packages/extension && npm run build"
fi

echo ""
echo "================================================"