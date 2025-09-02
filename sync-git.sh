#!/bin/bash
# Git sync script - always takes remote version for manifest and version files

echo "Syncing with GitHub (remote wins)..."

# Save current directory
CURRENT_DIR=$(pwd)

# Go to repo root
cd ~/workspace/TravianAssistant 2>/dev/null || cd ~/workspace

# Reset any local changes to frequently conflicting files
git checkout -- packages/extension/manifest.json 2>/dev/null
git checkout -- packages/extension/src/version.ts 2>/dev/null
git checkout -- packages/extension/package.json 2>/dev/null

# Pull latest
git pull --rebase

# Return to original directory
cd "$CURRENT_DIR"

echo "Sync complete - all changes from remote applied"
