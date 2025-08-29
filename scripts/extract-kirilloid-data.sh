#!/bin/bash

echo "=== Extracting Kirilloid Data to TypeScript ==="
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
echo "Creating game-data directory structure..."
mkdir -p packages/extension/src/game-data

echo ""
echo "=== Analyzing Available Data ==="
echo ""

# Find all model versions
echo "Available game versions in Kirilloid:"
ls -d kirilloid-travian/src/model/t* 2>/dev/null | xargs -n1 basename

echo ""
echo "=== Key Files Found ==="

# Buildings
echo ""
echo "Building data files:"
find kirilloid-travian/src/model -name "*building*" -type f | while read file; do
    echo "  - $file"
    echo "    Lines: $(wc -l < "$file")"
done

# Units/Troops
echo ""
echo "Troop data files:"
find kirilloid-travian/src/model -name "*unit*" -o -name "*troop*" -type f | while read file; do
    echo "  - $file"
    echo "    Lines: $(wc -l < "$file")"
done

# Combat
echo ""
echo "Combat/Formula files:"
find kirilloid-travian/src -name "*combat*" -o -name "*formula*" -type f | while read file; do
    echo "  - $file"
    echo "    Lines: $(wc -l < "$file")"
done

echo ""
echo "=== Sample Data Structures ==="

# Show building structure
echo ""
echo "Sample building data structure:"
if [ -f "kirilloid-travian/src/model/t4.6/buildings.ts" ]; then
    echo "From t4.6/buildings.ts:"
    sed -n '1,30p' kirilloid-travian/src/model/t4.6/buildings.ts
elif [ -f "kirilloid-travian/src/model/t4/buildings.ts" ]; then
    echo "From t4/buildings.ts:"
    sed -n '1,30p' kirilloid-travian/src/model/t4/buildings.ts
elif [ -f "kirilloid-travian/src/model/base/buildings.ts" ]; then
    echo "From base/buildings.ts:"
    sed -n '1,30p' kirilloid-travian/src/model/base/buildings.ts
fi

# Show units structure
echo ""
echo "Sample units data structure:"
if [ -f "kirilloid-travian/src/model/t4.6/units.ts" ]; then
    echo "From t4.6/units.ts:"
    sed -n '1,30p' kirilloid-travian/src/model/t4.6/units.ts
elif [ -f "kirilloid-travian/src/model/base/units.ts" ]; then
    echo "From base/units.ts:"
    sed -n '1,30p' kirilloid-travian/src/model/base/units.ts
fi

echo ""
echo "=== Checking for T4.6 (Latest Travian Legends) ==="
if [ -d "kirilloid-travian/src/model/t4.6" ]; then
    echo "✓ T4.6 data found (Travian Legends compatible)"
    ls -la kirilloid-travian/src/model/t4.6/
else
    echo "⚠ T4.6 not found, checking alternatives..."
    ls -d kirilloid-travian/src/model/t* | tail -1
fi

echo ""
echo "Ready to extract and transform data!"
