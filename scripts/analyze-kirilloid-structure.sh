#!/bin/bash

echo "=== Analyzing Kirilloid Data Structure ==="
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
echo "=== Repository Structure ==="
echo ""

# Show main source structure
echo "Main source folders:"
ls -la kirilloid-travian/src/

echo ""
echo "Model folder structure (game data):"
find kirilloid-travian/src/model -type f -name "*.ts" -o -name "*.js" | head -20

echo ""
echo "Key data files found:"
echo "-------------------"

# Check for buildings data
echo "Buildings data:"
find kirilloid-travian/src -name "*building*" -type f | head -10

# Check for troops data  
echo ""
echo "Troops data:"
find kirilloid-travian/src -name "*troop*" -o -name "*unit*" | head -10

# Check for formulas
echo ""
echo "Formula files:"
find kirilloid-travian/src -name "*formula*" -o -name "*calc*" | head -10

echo ""
echo "=== Sample Data Structure ==="
echo ""

# Show a sample of building data
if [ -f "kirilloid-travian/src/model/t4.6/buildings.ts" ]; then
    echo "Sample from T4.6 buildings.ts:"
    head -50 kirilloid-travian/src/model/t4.6/buildings.ts
elif [ -f "kirilloid-travian/src/model/t4/buildings.ts" ]; then
    echo "Sample from T4 buildings.ts:"
    head -50 kirilloid-travian/src/model/t4/buildings.ts
fi

echo ""
echo "=== Language/Translation Files ==="
find kirilloid-travian -name "*.json" -path "*/lang/*" | head -5

echo ""
echo "Script complete. Ready to extract data!"
