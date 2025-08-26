#!/bin/bash

# Simple sync script for Replit
echo "=== Syncing TravianAssistant from GitHub to Replit ==="
echo ""

cd ~/workspace

# Check if repo exists
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Cloning fresh..."
    cd ~
    rm -rf workspace
    git clone https://github.com/DougProceptra/TravianAssistant.git workspace
    cd workspace
else
    echo "✅ Git repository found. Pulling latest changes..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
fi

echo ""
echo "=== Repository Status ==="
git status

echo ""
echo "=== Recent Commits ==="
git log --oneline -5

echo ""
echo "=== Files Created Today ==="
find . -type f -name "*.md" -o -name "*.sh" | grep -E "(docs|scripts)" | head -10

echo ""
echo "✅ Sync complete! You can now run:"
echo "   chmod +x scripts/analyze-kirilloid.sh"
echo "   ./scripts/analyze-kirilloid.sh"
