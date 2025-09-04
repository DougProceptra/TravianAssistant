#!/bin/bash
# TravianAssistant Extension Restore Script
# Created: September 4, 2025
# Purpose: Quick rollback to pre-mem0 working state

echo "==================================="
echo "TravianAssistant Emergency Restore"
echo "==================================="
echo ""

# Check if backup exists
if [ ! -f "content-backup-20250904.js" ]; then
    echo "❌ ERROR: Backup file not found!"
    echo "   Looking for: content-backup-20250904.js"
    echo ""
    echo "   Please ensure you're in the packages/extension/dist/ directory"
    exit 1
fi

# Create safety copy of current (potentially broken) version
echo "📦 Creating safety copy of current version..."
cp content.js content-mem0-attempt-$(date +%Y%m%d-%H%M%S).js

# Restore from backup
echo "🔄 Restoring from backup..."
cp content-backup-20250904.js content.js

echo "✅ SUCCESS: Extension restored to pre-mem0 state!"
echo ""
echo "Next steps:"
echo "1. Go to chrome://extensions"
echo "2. Click the refresh icon on TravianAssistant"
echo "3. Refresh your Travian game tab"
echo ""
echo "The current (potentially broken) version was saved as:"
echo "   content-mem0-attempt-$(date +%Y%m%d-%H%M%S).js"
echo ""
echo "==================================="