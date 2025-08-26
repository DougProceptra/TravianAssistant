#!/bin/bash

echo "=== Settlement-Specific Data Extraction ==="
echo ""

cd ~/workspace/kirilloid-travian

echo "CRITICAL SETTLEMENT DATA"
echo "========================"
echo ""

echo "1. CHECK T5 BUILDINGS FILE EXISTS:"
ls -la src/model/t5/buildings.ts 2>/dev/null || echo "Not found - checking other versions..."

echo ""
echo "2. MAIN BUILDING DATA (Required for Academy):"
echo "----------------------------------------------"
# Main Building is ID 15 in most versions
grep -A 50 "MAIN_BUILDING" src/model/*/buildings.ts | grep -E "cost:|cp:|time:" | head -20

echo ""
echo "3. ACADEMY DATA (Required for Residence):"
echo "-----------------------------------------"
grep -A 50 "ACADEMY" src/model/*/buildings.ts | grep -E "cost:|cp:|requires:" | head -20

echo ""
echo "4. RESIDENCE/PALACE DATA (For Settlers):"
echo "----------------------------------------"
grep -A 50 "RESIDENCE\|PALACE" src/model/*/buildings.ts | grep -E "cost:|cp:|maxLevel:" | head -20

echo ""
echo "5. SETTLER TRAINING COSTS:"
echo "--------------------------"
# Look for settler definitions
find src/model -name "*.ts" -exec grep -l "settler\|SETTLER" {} \; | while read file; do
    echo "File: $file"
    grep -B2 -A5 "settler\|SETTLER" "$file" | head -15
    echo "---"
done

echo ""
echo "6. CULTURE POINT VALUES:"
echo "------------------------"
echo "Looking for CP generation rates..."
grep -r "culture.*points\|cp.*per\|culture.*production" src/model/ | grep -v ".spec" | head -10

echo ""
echo "7. BUILDING PREREQUISITES:"
echo "--------------------------"
grep -r "requires:\|prerequisite\|dependencies" src/model/*/buildings.ts | head -15

echo ""
echo "8. TIME CALCULATION FUNCTIONS:"
echo "-------------------------------"
# Find the time calculation formulas
grep -B2 -A10 "const time\|function.*time" src/model/t5/buildings.ts | head -30

echo ""
echo "9. RESOURCE FIELD LEVELS:"
echo "--------------------------"
# Resource field production by level
grep -A 20 "const prod\|production.*level" src/model/base/buildings.ts | head -30

echo ""
echo "10. ACTUAL BUILDING COSTS - LET'S GET THE RAW DATA:"
echo "----------------------------------------------------"
# Try to find the actual cost arrays
grep -A 100 "const.*buildings\|export.*buildings" src/model/t5/buildings.ts | head -100

echo ""
echo "=== DIRECT FILE INSPECTION ==="
echo ""
echo "Let's look at the actual T5 buildings file structure:"
echo "------------------------------------------------------"
head -200 src/model/t5/buildings.ts

echo ""
echo "=== END OF EXTRACTION ==="
