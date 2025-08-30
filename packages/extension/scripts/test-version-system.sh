#!/bin/bash
# Test version management system

echo "======================================="
echo "TravianAssistant Version System Test"
echo "======================================="
echo ""

cd packages/extension

echo "1. Getting current version from manifest..."
CURRENT_VERSION=$(node ./scripts/version-manager.cjs get)
echo "   Current version: $CURRENT_VERSION"
echo ""

echo "2. Validating all versions match..."
node ./scripts/version-manager.cjs validate
if [ $? -eq 0 ]; then
    echo "   ✓ All versions validated"
else
    echo "   ✗ Version mismatch detected"
    echo ""
    echo "3. Syncing all files to manifest version..."
    node ./scripts/version-manager.cjs sync
    echo "   ✓ Synced to version $CURRENT_VERSION"
fi
echo ""

echo "4. Checking generated files..."
if [ -f "src/version.ts" ]; then
    echo "   ✓ version.ts exists"
    grep "VERSION = " src/version.ts | head -1
else
    echo "   ✗ version.ts missing"
fi
echo ""

echo "5. Testing version bump..."
echo "   Current: $CURRENT_VERSION"
NEW_VERSION=$(node ./scripts/version-manager.cjs bump 2>&1 | grep "Bumped to" | cut -d' ' -f3)
echo "   Bumped to: $NEW_VERSION"
echo ""

echo "6. Reverting to original version..."
node ./scripts/version-manager.cjs set "$CURRENT_VERSION" > /dev/null 2>&1
echo "   ✓ Reverted to $CURRENT_VERSION"
echo ""

echo "7. Final validation..."
node ./scripts/version-manager.cjs validate
if [ $? -eq 0 ]; then
    echo "   ✓ Version system working correctly!"
else
    echo "   ✗ Version system has issues"
fi
echo ""

echo "======================================="
echo "Version Commands Available:"
echo "======================================="
echo "npm run version:get      - Show current version"
echo "npm run version:sync     - Sync all files to manifest"
echo "npm run version:validate - Check all versions match"
echo "npm run version:bump     - Bump patch version"
echo "npm run version:bump:minor - Bump minor version"
echo "npm run version:bump:major - Bump major version"
echo "npm run version:set X.Y.Z - Set specific version"
echo ""