#!/bin/bash

echo "=== Extracting Critical Travian Game Data ==="
echo ""

cd ~/workspace

# Check if Kirilloid repo exists
if [ ! -d "kirilloid-travian" ]; then
    echo "Cloning Kirilloid repository..."
    git clone https://github.com/kirilloid/travian.git kirilloid-travian
fi

cd kirilloid-travian

echo "1. BUILDING DATA STRUCTURE (T5):"
echo "================================="
echo ""
echo "Main Building, Academy, Residence costs:"
echo "-----------------------------------------"
grep -A 30 "MAIN_BUILDING\|ACADEMY\|RESIDENCE" src/model/t5/buildings.ts | head -50

echo ""
echo "2. CULTURE POINTS BY BUILDING:"
echo "==============================="
grep -B2 -A2 "culture\|CP\|cp:" src/model/t5/buildings.ts | head -30

echo ""
echo "3. TROOP COSTS (T5):"
echo "===================="
if [ -f "src/model/t5/units.ts" ]; then
    echo "Settler costs per tribe:"
    grep -A 10 "SETTLER\|settler" src/model/t5/units.ts | head -20
else
    echo "Looking for unit definitions..."
    grep -A 5 "cost:" src/model/*/units.ts | grep -A 3 "settler" | head -20
fi

echo ""
echo "4. SERVER SPEEDS:"
echo "================="
cat src/model/speeds.ts | head -40

echo ""
echo "5. BUILDING TIME FORMULAS:"
echo "=========================="
grep -A 10 "time\|duration" src/model/t5/buildings.ts | head -30

echo ""
echo "6. TRIBE BONUSES:"
echo "================="
grep -A 20 "tribe\|TRIBE" src/model/base/tribes.ts | head -40

echo ""
echo "7. RESOURCE FIELD PRODUCTION:"
echo "=============================="
grep -A 10 "production\|prod:" src/model/base/buildings.ts | head -30

echo ""
echo "8. CP REQUIREMENTS FOR VILLAGES:"
echo "================================="
grep -r "culture.*village\|village.*culture\|200\|500\|1000" src/ | grep -v ".spec" | head -10

echo ""
echo "=== KEY FINDINGS ==="
echo ""
echo "Now let's look at the actual TypeScript interfaces..."
echo ""

echo "9. BUILDING INTERFACE:"
echo "======================"
grep -A 20 "interface Building\|type Building" src/model/base/buildings.ts | head -30

echo ""
echo "10. UNIT INTERFACE:"
echo "==================="
grep -A 20 "interface Unit\|type Unit" src/model/base/units.ts | head -30

echo ""
echo "Ready to extract this data into our extension!"
