#!/bin/bash
# File cleanup and organization script for TravianAssistant
# Created: September 4, 2025
# Purpose: Clean up repository by archiving old files and removing unused ones

echo "======================================"
echo "TravianAssistant Repository Cleanup"
echo "======================================"
echo ""

# Create archived directory if it doesn't exist
if [ ! -d "archived" ]; then
    echo "Creating archived directory..."
    mkdir archived
fi

echo "This script will:"
echo "1. Move old/unused files to archived/"
echo "2. Delete empty or obsolete files"
echo "3. Organize the repository structure"
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Moving files to archive..."

# Move old server files to archive
if [ -f "server-enhanced.js" ]; then
    echo "  Moving server-enhanced.js to archived/"
    git mv server-enhanced.js archived/ 2>/dev/null || mv server-enhanced.js archived/
fi

if [ -f "server-updates.js" ]; then
    echo "  Moving server-updates.js to archived/"
    git mv server-updates.js archived/ 2>/dev/null || mv server-updates.js archived/
fi

if [ -f "server.backup.js" ]; then
    echo "  Moving server.backup.js to archived/"
    git mv server.backup.js archived/ 2>/dev/null || mv server.backup.js archived/
fi

# Move old test files
if [ -f "test-backend.js" ]; then
    echo "  Moving test-backend.js to archived/"
    git mv test-backend.js archived/ 2>/dev/null || mv test-backend.js archived/
fi

if [ -f "test-api.html" ]; then
    echo "  Moving test-api.html to archived/"
    git mv test-api.html archived/ 2>/dev/null || mv test-api.html archived/
fi

if [ -f "admin.html" ]; then
    echo "  Moving admin.html to archived/"
    git mv admin.html archived/ 2>/dev/null || mv admin.html archived/
fi

# Move old patches and migration scripts
if [ -f "add-ai-chat.patch" ]; then
    echo "  Moving add-ai-chat.patch to archived/"
    git mv add-ai-chat.patch archived/ 2>/dev/null || mv add-ai-chat.patch archived/
fi

if [ -f "add-ai-chat-endpoint.patch" ]; then
    echo "  Moving add-ai-chat-endpoint.patch to archived/"
    git mv add-ai-chat-endpoint.patch archived/ 2>/dev/null || mv add-ai-chat-endpoint.patch archived/
fi

if [ -f "migrate-to-clean.sh" ]; then
    echo "  Moving migrate-to-clean.sh to archived/"
    git mv migrate-to-clean.sh archived/ 2>/dev/null || mv migrate-to-clean.sh archived/
fi

if [ -f "run-cleanup.sh" ]; then
    echo "  Moving run-cleanup.sh to archived/"
    git mv run-cleanup.sh archived/ 2>/dev/null || mv run-cleanup.sh archived/
fi

# Move Replit files if not using Replit
read -p "Are you still using Replit? (y/n): " use_replit

if [ "$use_replit" != "y" ]; then
    echo "  Moving Replit files to archived/"
    
    if [ -f "replit-start.js" ]; then
        git mv replit-start.js archived/ 2>/dev/null || mv replit-start.js archived/
    fi
    
    if [ -f "replit.md" ]; then
        git mv replit.md archived/ 2>/dev/null || mv replit.md archived/
    fi
    
    if [ -f "setup-replit.sh" ]; then
        git mv setup-replit.sh archived/ 2>/dev/null || mv setup-replit.sh archived/
    fi
    
    if [ -f ".replit" ]; then
        git mv .replit archived/ 2>/dev/null || mv .replit archived/
    fi
    
    if [ -f "REPLIT_QUICKSTART.md" ]; then
        git mv REPLIT_QUICKSTART.md archived/ 2>/dev/null || mv REPLIT_QUICKSTART.md archived/
    fi
    
    if [ -f "REPLIT_TROUBLESHOOTING.md" ]; then
        git mv REPLIT_TROUBLESHOOTING.md archived/ 2>/dev/null || mv REPLIT_TROUBLESHOOTING.md archived/
    fi
fi

echo ""
echo "Removing empty/obsolete files..."

# Delete empty kirilloid-travian file
if [ -f "kirilloid-travian" ] && [ ! -s "kirilloid-travian" ]; then
    echo "  Deleting empty kirilloid-travian file"
    git rm kirilloid-travian 2>/dev/null || rm kirilloid-travian
fi

# Delete old deployment scripts if not needed
if [ -f "deploy-ai.sh" ]; then
    read -p "Delete old deploy-ai.sh script? (y/n): " del_deploy
    if [ "$del_deploy" = "y" ]; then
        echo "  Deleting deploy-ai.sh"
        git rm deploy-ai.sh 2>/dev/null || rm deploy-ai.sh
    fi
fi

echo ""
echo "======================================"
echo "Cleanup Summary:"
echo "======================================"
echo ""
echo "Files moved to archived/:"
ls -la archived/ 2>/dev/null | tail -n +4 | awk '{print "  - " $9}'

echo ""
echo "Current repository structure:"
echo ""
tree -L 2 -I 'node_modules|.git|pnpm-lock.yaml|package-lock.json' 2>/dev/null || ls -la

echo ""
echo "======================================"
echo "Cleanup complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git status"
echo "2. Commit the cleanup: git add . && git commit -m 'Repository cleanup and file organization'"
echo "3. Push to GitHub: git push origin main"
echo ""
echo "To restore any file from archive:"
echo "  git mv archived/[filename] ./"