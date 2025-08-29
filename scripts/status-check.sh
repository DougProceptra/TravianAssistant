#!/bin/bash

# TravianAssistant Development Status Check
# Run this to verify all components are ready

echo "==================================="
echo "TravianAssistant Development Status"
echo "==================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

# Track overall status
ERRORS=0

echo "1. REPOSITORY STATUS"
echo "-------------------"
# Check Git status
git status --short > /dev/null 2>&1
check_status $? "Git repository accessible" || ((ERRORS++))

# Check for uncommitted changes
CHANGES=$(git status --short | wc -l)
if [ $CHANGES -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No uncommitted changes"
else
    echo -e "${YELLOW}⚠${NC} $CHANGES uncommitted changes"
fi

echo ""
echo "2. BACKEND STATUS"
echo "----------------"
# Check if backend directory exists
if [ -d "backend" ]; then
    echo -e "${GREEN}✓${NC} Backend directory exists"
    
    # Check for node_modules
    if [ -d "backend/node_modules" ]; then
        echo -e "${GREEN}✓${NC} Backend dependencies installed"
    else
        echo -e "${RED}✗${NC} Backend dependencies not installed - run: cd backend && npm install"
        ((ERRORS++))
    fi
    
    # Check if backend is running
    curl -s http://localhost:3001/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Backend server is running"
    else
        echo -e "${YELLOW}⚠${NC} Backend server not running - run: cd backend && npm start"
    fi
    
    # Check database
    if [ -f "backend/travian.db" ]; then
        echo -e "${GREEN}✓${NC} SQLite database exists"
    else
        echo -e "${YELLOW}⚠${NC} Database not initialized (will be created on first run)"
    fi
else
    echo -e "${RED}✗${NC} Backend directory not found"
    ((ERRORS++))
fi

echo ""
echo "3. EXTENSION STATUS"
echo "------------------"
# Check extension directory
if [ -d "packages/extension" ]; then
    echo -e "${GREEN}✓${NC} Extension directory exists"
    
    # Check for node_modules
    if [ -d "packages/extension/node_modules" ]; then
        echo -e "${GREEN}✓${NC} Extension dependencies installed"
    else
        echo -e "${RED}✗${NC} Extension dependencies not installed - run: cd packages/extension && npm install"
        ((ERRORS++))
    fi
    
    # Check if built
    if [ -f "packages/extension/dist/manifest.json" ]; then
        echo -e "${GREEN}✓${NC} Extension built"
        VERSION=$(grep '"version"' packages/extension/dist/manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
        echo -e "    Version: $VERSION"
    else
        echo -e "${RED}✗${NC} Extension not built - run: cd packages/extension && npm run build"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Extension directory not found"
    ((ERRORS++))
fi

echo ""
echo "4. GAME DATA STATUS"
echo "------------------"
# Check game data directory
if [ -d "packages/extension/src/game-data" ]; then
    echo -e "${GREEN}✓${NC} Game data directory exists"
    
    # Check for TypeScript files
    if [ -f "packages/extension/src/game-data/index.ts" ]; then
        echo -e "${GREEN}✓${NC} Game data index.ts exists"
    else
        echo -e "${RED}✗${NC} Game data index.ts missing"
        ((ERRORS++))
    fi
    
    if [ -f "packages/extension/src/game-data/types.ts" ]; then
        echo -e "${GREEN}✓${NC} Game data types.ts exists"
    else
        echo -e "${RED}✗${NC} Game data types.ts missing"
        ((ERRORS++))
    fi
    
    # Check for pending data files
    for file in static-data.ts formulas.ts server-config.ts constants.ts; do
        if [ -f "packages/extension/src/game-data/$file" ]; then
            echo -e "${GREEN}✓${NC} $file exists"
        else
            echo -e "${YELLOW}⚠${NC} $file pending (will be created from Kirilloid)"
        fi
    done
else
    echo -e "${RED}✗${NC} Game data directory not found"
    ((ERRORS++))
fi

echo ""
echo "5. KIRILLOID STATUS"
echo "------------------"
# Check if Kirilloid repo is cloned
if [ -d "kirilloid-travian" ]; then
    echo -e "${GREEN}✓${NC} Kirilloid repository cloned"
    cd kirilloid-travian
    KIRI_COMMIT=$(git rev-parse --short HEAD)
    echo -e "    Commit: $KIRI_COMMIT"
    cd ..
else
    echo -e "${YELLOW}⚠${NC} Kirilloid not cloned - run: git clone https://github.com/kirilloid/travian.git kirilloid-travian"
fi

# Check extraction scripts
if [ -f "scripts/extract-kirilloid-data.js" ]; then
    echo -e "${GREEN}✓${NC} Extraction script exists"
else
    echo -e "${RED}✗${NC} Extraction script missing"
    ((ERRORS++))
fi

echo ""
echo "6. VERCEL PROXY STATUS"
echo "---------------------"
# Check Vercel proxy
curl -s https://travian-assistant.vercel.app/api/anthropic -X POST \
    -H "Content-Type: application/json" \
    -d '{"test": true}' > /dev/null 2>&1
    
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Vercel proxy accessible"
else
    echo -e "${YELLOW}⚠${NC} Vercel proxy not responding (check deployment)"
fi

echo ""
echo "7. DOCUMENTATION STATUS"
echo "----------------------"
# Check key documentation files
docs=("README.md" "DEVELOPMENT_GUIDE.md" "docs/SESSION_CONTEXT.md" "docs/UPDATING_GAME_DATA.md")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc exists"
    else
        echo -e "${YELLOW}⚠${NC} $doc missing"
    fi
done

echo ""
echo "==================================="
echo "SUMMARY"
echo "==================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical components ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Clone Kirilloid if needed: git clone https://github.com/kirilloid/travian.git kirilloid-travian"
    echo "2. Run extraction: node scripts/extract-kirilloid-data.js"
    echo "3. Start backend: cd backend && npm start"
    echo "4. Build extension: cd packages/extension && npm run build"
else
    echo -e "${RED}❌ $ERRORS critical issues found${NC}"
    echo ""
    echo "Fix the issues above before proceeding."
fi

echo ""
echo "Run this script anytime with: ./scripts/status-check.sh"
