#!/bin/bash

# Verify Git-Replit Sync Status
# Run this FIRST to check current state

echo "================================================"
echo "Git-Replit Sync Verification"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Not in TravianAssistant root directory"
    echo "Run: cd ~/TravianAssistant"
    exit 1
fi

echo "✅ In TravianAssistant directory"
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  WARNING: Not on main branch"
fi
echo ""

# Check for uncommitted changes
echo "📝 Checking for local changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  WARNING: You have uncommitted local changes:"
    git status --short
    echo ""
    echo "Options:"
    echo "1. Stash changes: git stash"
    echo "2. Commit changes: git add . && git commit -m 'Local changes'"
    echo "3. Discard changes: git reset --hard HEAD"
else
    echo "✅ No uncommitted changes"
fi
echo ""

# Fetch latest from GitHub without pulling
echo "🔍 Fetching latest from GitHub..."
git fetch origin main --quiet

# Compare local vs remote
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

echo "📊 Sync Status:"
echo "Local commit:  $LOCAL_COMMIT"
echo "Remote commit: $REMOTE_COMMIT"
echo ""

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ SYNCED: Replit is up-to-date with GitHub"
    echo ""
    echo "Latest commit:"
    git log -1 --oneline
else
    # Check if we're ahead or behind
    BEHIND=$(git rev-list --count HEAD..origin/main)
    AHEAD=$(git rev-list --count origin/main..HEAD)
    
    if [ "$BEHIND" -gt 0 ] && [ "$AHEAD" -gt 0 ]; then
        echo "⚠️  DIVERGED: Local is $AHEAD commits ahead and $BEHIND commits behind GitHub"
        echo "This needs manual resolution!"
    elif [ "$BEHIND" -gt 0 ]; then
        echo "⬇️  BEHIND: Replit is $BEHIND commits behind GitHub"
        echo ""
        echo "New commits on GitHub:"
        git log HEAD..origin/main --oneline
        echo ""
        echo "Run: ./scripts/sync-from-github.sh to update"
    else
        echo "⬆️  AHEAD: Replit is $AHEAD commits ahead of GitHub"
        echo "You have local commits not pushed to GitHub"
        echo ""
        echo "Local commits not on GitHub:"
        git log origin/main..HEAD --oneline
    fi
fi

echo ""
echo "================================================"
echo "Extension Status Check"
echo "================================================"
echo ""

# Check if extension is built
if [ -d "packages/extension/dist" ]; then
    # Get manifest version
    if [ -f "packages/extension/dist/manifest.json" ]; then
        VERSION=$(grep '"version"' packages/extension/dist/manifest.json | cut -d'"' -f4)
        echo "✅ Extension built - Version: $VERSION"
    else
        echo "⚠️  Extension dist exists but no manifest.json"
    fi
else
    echo "❌ Extension not built (no dist folder)"
    echo "Run: cd packages/extension && npm run build"
fi

echo ""
echo "================================================"
echo "Summary"
echo "================================================"
echo ""

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ] && [ -d "packages/extension/dist" ]; then
    echo "✅ Ready to test!"
    echo "1. Extension is built"
    echo "2. Code is synced with GitHub"
elif [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    echo "⚠️  Action needed: Sync with GitHub first"
    echo "Run: ./scripts/sync-from-github.sh"
else
    echo "⚠️  Action needed: Build extension"
    echo "Run: cd packages/extension && npm run build"
fi

echo ""
echo "================================================"