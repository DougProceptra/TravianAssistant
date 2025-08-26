#!/bin/bash

echo "=== Analyzing Kirilloid Data Structure ==="
echo ""
echo "This script analyzes what data we can extract from Kirilloid"
echo ""

# Clone Kirilloid repo if not exists
if [ ! -d "kirilloid-travian" ]; then
    echo "Cloning Kirilloid repository..."
    git clone https://github.com/kirilloid/travian.git kirilloid-travian
else
    echo "Kirilloid repo already exists, pulling latest..."
    cd kirilloid-travian && git pull && cd ..
fi

echo ""
echo "=== Data Structure Analysis ==="
echo ""

# Find all TypeScript model files
echo "1. MODEL FILES (Game Data Definitions):"
echo "----------------------------------------"
find kirilloid-travian/src/model -name "*.ts" -type f | head -20

echo ""
echo "2. KEY DATA CATEGORIES:"
echo "------------------------"
ls -la kirilloid-travian/src/model/ 2>/dev/null | grep -E "^d" || echo "Model directory not found"

echo ""
echo "3. BUILDING DATA SAMPLE:"
echo "------------------------"
if [ -f "kirilloid-travian/src/model/t5/buildings.ts" ]; then
    echo "Found T5 buildings file. First 50 lines:"
    head -50 kirilloid-travian/src/model/t5/buildings.ts
else
    echo "Looking for any buildings file..."
    find kirilloid-travian -name "*building*.ts" -type f | head -5
fi

echo ""
echo "4. TROOPS DATA STRUCTURE:"
echo "-------------------------"
find kirilloid-travian -name "*troops*.ts" -o -name "*unit*.ts" | head -5

echo ""
echo "5. HERO DATA:"
echo "-------------"
find kirilloid-travian -name "*hero*.ts" | head -5

echo ""
echo "6. ARTIFACTS/ITEMS:"
echo "-------------------"
find kirilloid-travian -name "*artifact*.ts" -o -name "*item*.ts" | head -5

echo ""
echo "7. SERVER CONFIGURATIONS:"
echo "-------------------------"
find kirilloid-travian -name "*server*.ts" -o -name "*speed*.ts" | head -5

echo ""
echo "8. CALCULATION LOGIC:"
echo "---------------------"
find kirilloid-travian/src -name "*calc*.ts" -o -name "*formula*.ts" | head -10

echo ""
echo "=== SUMMARY OF AVAILABLE DATA ==="
echo ""
echo "Categories found:"
echo "- Buildings (costs, CP, prerequisites, effects)"
echo "- Troops (stats, costs, training times)"
echo "- Hero (skills, items, adventures)"
echo "- Artifacts (effects, requirements)"
echo "- Server speeds (1x, 2x, 3x, 5x, 10x)"
echo "- Calculation formulas (ROI, combat, etc.)"
echo ""
echo "Next step: Extract and structure this data for our extension"
