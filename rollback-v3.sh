#!/bin/bash

# Rollback script to undo V3 changes and focus on fixing existing issues
echo "🔄 Rolling back unnecessary V3 changes..."
echo "========================================="

# Reset to last known good commit before V3 changes
git reset --hard f942ad19e4707dcbcf0af36ad2b31197c1350c49

# Force push to overwrite remote (BE CAREFUL!)
echo "⚠️  This will overwrite remote changes. Type 'yes' to confirm:"
read confirmation

if [ "$confirmation" = "yes" ]; then
    git push --force origin main
    echo "✅ Rolled back to commit f942ad19"
    echo ""
    echo "Now focusing on:"
    echo "1. Testing if chat fix from previous session works"
    echo "2. Fixing getAllCachedVillages error"
    echo "3. Getting real game data collection working"
else
    echo "❌ Rollback cancelled"
fi
