#!/bin/bash
# TravianAssistant Repository Cleanup Script
# Preserves: SESSION_CONTEXT.md and TravianAssistantv4.md
# Archives everything else that's cluttering the repo

echo "==================================="
echo "TravianAssistant Repository Cleanup"
echo "==================================="
echo ""
echo "This script will reorganize the repository:"
echo "- Preserve working code and critical docs"
echo "- Archive old/experimental files"
echo "- Create clean structure"
echo ""

# Create archive structure
echo "Creating archive directories..."
mkdir -p archive/old-docs
mkdir -p archive/old-versions
mkdir -p archive/test-files
mkdir -p archive/experiments
mkdir -p archive/build-artifacts
mkdir -p archive/server-experiments
mkdir -p archive/data-samples

# Move old documentation (preserving SESSION_CONTEXT.md and TravianAssistantv4.md)
echo ""
echo "Moving old documentation to archive..."
[ -f "DEVELOPMENT_PLAN.md" ] && mv DEVELOPMENT_PLAN.md archive/old-docs/ && echo "  ✓ Moved DEVELOPMENT_PLAN.md"
[ -f "DEVELOPMENT_GUIDE.md" ] && mv DEVELOPMENT_GUIDE.md archive/old-docs/ && echo "  ✓ Moved DEVELOPMENT_GUIDE.md"
[ -f "FIX_INSTRUCTIONS.md" ] && mv FIX_INSTRUCTIONS.md archive/old-docs/ && echo "  ✓ Moved FIX_INSTRUCTIONS.md"
[ -f "QUICKSTART.md" ] && mv QUICKSTART.md archive/old-docs/ && echo "  ✓ Moved QUICKSTART.md"
[ -f "VERCEL_DEPLOY.md" ] && mv VERCEL_DEPLOY.md archive/old-docs/ && echo "  ✓ Moved VERCEL_DEPLOY.md"
[ -f "replit.md" ] && mv replit.md archive/old-docs/ && echo "  ✓ Moved replit.md"

# Move test files
echo ""
echo "Moving test files to archive..."
for file in test-*.js debug-*.js; do
    [ -f "$file" ] && mv "$file" archive/test-files/ && echo "  ✓ Moved $file"
done

# Move data extract files
for file in *_extract.json diagnostic_* found_js_*.txt; do
    [ -f "$file" ] && mv "$file" archive/data-samples/ && echo "  ✓ Moved $file"
done

[ -f "game-data-output.txt" ] && mv game-data-output.txt archive/data-samples/ && echo "  ✓ Moved game-data-output.txt"
[ -f "settlement-data-output.txt" ] && mv settlement-data-output.txt archive/data-samples/ && echo "  ✓ Moved settlement-data-output.txt"

# Move experimental files
echo ""
echo "Moving experimental files to archive..."
for file in kirilloid*; do
    [ -f "$file" ] && mv "$file" archive/experiments/ && echo "  ✓ Moved $file"
done

[ -d "calculation-engine" ] && mv calculation-engine archive/experiments/ && echo "  ✓ Moved calculation-engine/"
[ -d "implementation" ] && mv implementation archive/experiments/ && echo "  ✓ Moved implementation/"
[ -d "extension-v3" ] && mv extension-v3 archive/old-versions/ && echo "  ✓ Moved extension-v3/"
[ -d "client" ] && mv client archive/old-versions/ && echo "  ✓ Moved client/"
[ -d "backend" ] && mv backend archive/old-versions/ && echo "  ✓ Moved backend/"
[ -d "server" ] && mv server archive/old-versions/ && echo "  ✓ Moved server/"

# Move server experiment files
echo ""
echo "Moving server experiments to archive..."
[ -f "basic-server.js" ] && mv basic-server.js archive/server-experiments/ && echo "  ✓ Moved basic-server.js"
[ -f "simple-server.js" ] && mv simple-server.js archive/server-experiments/ && echo "  ✓ Moved simple-server.js"
[ -f "http-server.js" ] && mv http-server.js archive/server-experiments/ && echo "  ✓ Moved http-server.js"

# Move build artifacts
echo ""
echo "Moving build artifacts to archive..."
[ -f "tla_addon_pack.zip" ] && mv tla_addon_pack.zip archive/build-artifacts/ && echo "  ✓ Moved tla_addon_pack.zip"
[ -f "generated-icon.png" ] && mv generated-icon.png archive/build-artifacts/ && echo "  ✓ Moved generated-icon.png"

# Move old build scripts (keep only essential ones)
echo ""
echo "Moving old build scripts to archive..."
for script in rollback-v3.sh setup-v3.sh cleanup-repo.sh fix-real-issues.sh sync.sh add_extension.sh; do
    [ -f "$script" ] && mv "$script" archive/build-artifacts/ && echo "  ✓ Moved $script"
done

# Move simple utility files that aren't needed
[ -f "simple-village-finder.js" ] && mv simple-village-finder.js archive/experiments/ && echo "  ✓ Moved simple-village-finder.js"
[ -f "buildings_array.js" ] && mv buildings_array.js archive/experiments/ && echo "  ✓ Moved buildings_array.js"

# Clean up root config files we don't need
echo ""
echo "Archiving unused config files..."
[ -f "components.json" ] && mv components.json archive/old-versions/ && echo "  ✓ Moved components.json"
[ -f "drizzle.config.ts" ] && mv drizzle.config.ts archive/old-versions/ && echo "  ✓ Moved drizzle.config.ts"
[ -f "tailwind.config.ts" ] && mv tailwind.config.ts archive/old-versions/ && echo "  ✓ Moved tailwind.config.ts"
[ -f "vite.config.ts" ] && mv vite.config.ts archive/old-versions/ && echo "  ✓ Moved vite.config.ts"
[ -f "vite.config.ts.backup" ] && mv vite.config.ts.backup archive/old-versions/ && echo "  ✓ Moved vite.config.ts.backup"
[ -f "postcss.config.js" ] && mv postcss.config.js archive/old-versions/ && echo "  ✓ Moved postcss.config.js"

# Move the empty/test HTML files
[ -f "index.html" ] && mv index.html archive/old-versions/ && echo "  ✓ Moved index.html"

echo ""
echo "==================================="
echo "Cleanup Summary:"
echo "==================================="
echo "✅ Archive structure created"
echo "✅ Old files moved to archive/"
echo "✅ Preserved: SESSION_CONTEXT.md"
echo "✅ Preserved: TravianAssistantv4.md"
echo ""
echo "Next steps:"
echo "1. Review archive/ folder"
echo "2. Update .gitignore to exclude archive/"
echo "3. Commit cleaned structure"
echo ""
