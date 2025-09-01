#!/bin/bash

# Enhanced build script for TravianAssistant v1.0.5
# Uses the new prompt system and fixed scrapers

echo "Building TravianAssistant v1.0.5 with enhanced features..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Must run from packages/extension directory"
    exit 1
fi

# Clean previous build
echo -e "${YELLOW}Cleaning previous build...${NC}"
rm -rf dist/
mkdir -p dist

# Update version
echo -e "${YELLOW}Setting version to 1.0.5...${NC}"
node scripts/version-manager.cjs set 1.0.5
node scripts/version-manager.cjs sync

# Copy manifest and static files
echo -e "${YELLOW}Copying manifest and static files...${NC}"
cp manifest.json dist/
cp src/options.html dist/
cp src/options.js dist/

# Create a simple webpack config for the enhanced build
cat > webpack.enhanced.config.js << 'EOF'
const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    content: './src/content/index-enhanced.ts',
    background: './src/background-enhanced.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
EOF

# Create enhanced content script that uses fixed scraper
cat > src/content/index-enhanced.ts << 'EOF'
// Enhanced content script with fixed scrapers and prompt system
import { initConversationalAI } from './conversational-ai';
import { safeScraper } from './safe-scraper-fixed';
import { overviewParser } from './overview-parser';
import { ajaxInterceptor } from './ajax-interceptor';
import { dataStore } from './data-persistence';

console.log('[TLA Content] Enhanced version loading...');

// Initialize all components
async function initialize() {
  try {
    // Initialize data persistence
    await dataStore.initialize();
    
    // Initialize safe scraper with fixed selectors
    await safeScraper.initialize();
    
    // Initialize AJAX interceptor
    ajaxInterceptor.initialize();
    
    // Initialize chat interface
    initConversationalAI();
    
    // Perform initial scrape
    const gameState = await safeScraper.getGameState();
    console.log('[TLA Content] Initial game state:', {
      villages: gameState.villages.length,
      currentVillage: gameState.currentVillageName,
      currentPage: gameState.currentPage,
      hasResources: gameState.totals?.resources?.wood > 0
    });
    
    // Set up periodic scraping
    setInterval(async () => {
      const state = await safeScraper.getGameState();
      console.log('[TLA Content] Periodic update:', {
        currentVillage: state.currentVillageName,
        resources: state.totals?.resources
      });
    }, 30000); // Every 30 seconds
    
    console.log('[TLA Content] Enhanced initialization complete');
  } catch (error) {
    console.error('[TLA Content] Initialization error:', error);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
EOF

# Build with webpack
echo -e "${YELLOW}Building with webpack...${NC}"
if [ -f "webpack.enhanced.config.js" ]; then
    npx webpack --config webpack.enhanced.config.js
else
    # Fallback to simple concatenation if webpack fails
    echo -e "${YELLOW}Webpack not available, using simple build...${NC}"
    
    # Bundle content script
    cat src/content/safe-scraper-fixed.ts \
        src/content/overview-parser.ts \
        src/content/ajax-interceptor.ts \
        src/content/data-persistence.ts \
        src/content/conversational-ai.ts \
        src/content/index-enhanced.ts > dist/content.js
    
    # Bundle background script  
    cat src/prompts/system-prompt.ts \
        src/background-enhanced.ts > dist/background.js
fi

# Copy prompt system
mkdir -p dist/prompts
cp src/prompts/system-prompt.ts dist/prompts/

# Create version file
echo "1.0.5" > dist/version.txt

# Summary
echo -e "${GREEN}✓ Build complete!${NC}"
echo -e "${GREEN}Enhanced features:${NC}"
echo "  - Fixed resource scraping with updated selectors"
echo "  - Current village/page detection"
echo "  - Customizable AI prompts via options page"
echo "  - Smart data gathering through conversation"
echo ""
echo -e "${YELLOW}To install:${NC}"
echo "  1. Open Chrome Extensions (chrome://extensions/)"
echo "  2. Enable Developer Mode"
echo "  3. Click 'Load unpacked'"
echo "  4. Select the 'dist' folder"
echo "  5. Open Options to configure server settings and prompts"
echo ""
echo -e "${GREEN}Version 1.0.5 ready for deployment!${NC}"
