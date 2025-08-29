#!/bin/bash

# TravianAssistant Data Update Script
# Pulls latest from Kirilloid and regenerates our game data

echo "=== Travian Game Data Update Script ==="
echo "Checking for updates from Kirilloid..."
echo ""

# Store current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Pull latest Kirilloid data
echo "Step 1: Updating Kirilloid repository..."
if [ ! -d "kirilloid-travian" ]; then
    git clone https://github.com/kirilloid/travian.git kirilloid-travian
else
    cd kirilloid-travian
    # Store current commit for comparison
    OLD_COMMIT=$(git rev-parse HEAD)
    
    # Pull latest changes
    git pull
    
    # Get new commit
    NEW_COMMIT=$(git rev-parse HEAD)
    
    if [ "$OLD_COMMIT" == "$NEW_COMMIT" ]; then
        echo "✓ Kirilloid is already up to date"
        cd ..
    else
        echo "✓ Kirilloid updated from $OLD_COMMIT to $NEW_COMMIT"
        cd ..
        
        # Show what changed
        echo ""
        echo "Changes detected:"
        cd kirilloid-travian
        git log --oneline $OLD_COMMIT..$NEW_COMMIT
        cd ..
    fi
fi

echo ""
echo "Step 2: Running extraction script..."
node scripts/extract-kirilloid-data.js

echo ""
echo "Step 3: Transforming to TypeScript..."
node scripts/transform-to-typescript.js

echo ""
echo "Step 4: Running validation tests..."
npm run test:game-data

echo ""
echo "Step 5: Generating update report..."

# Create update log
UPDATE_LOG="packages/extension/src/game-data/UPDATE_LOG.md"
echo "# Game Data Update Log" > $UPDATE_LOG
echo "" >> $UPDATE_LOG
echo "## Update: $(date '+%Y-%m-%d %H:%M:%S')" >> $UPDATE_LOG
echo "" >> $UPDATE_LOG

if [ "$OLD_COMMIT" != "$NEW_COMMIT" ]; then
    echo "### Kirilloid Changes:" >> $UPDATE_LOG
    cd kirilloid-travian
    git log --pretty=format:"- %s (%an, %ar)" $OLD_COMMIT..$NEW_COMMIT >> ../$UPDATE_LOG
    cd ..
else
    echo "No changes from Kirilloid" >> $UPDATE_LOG
fi

echo "" >> $UPDATE_LOG
echo "### Files Updated:" >> $UPDATE_LOG
git status --short packages/extension/src/game-data/ >> $UPDATE_LOG

echo ""
echo "=== Update Complete ==="
echo ""
echo "Next steps:"
echo "1. Review changes in $UPDATE_LOG"
echo "2. Test the extension with new data"
echo "3. Commit if everything looks good:"
echo "   git add packages/extension/src/game-data/"
echo "   git commit -m 'Update game data from Kirilloid'"
