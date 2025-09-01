#!/bin/bash
# Execute repository cleanup
# Run this from the repository root

echo "======================================="
echo "TravianAssistant Repository Cleanup"
echo "======================================="
echo ""
echo "This will reorganize the repository."
echo "Files will be moved to /archive/ folder."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

# Make the migration script executable
chmod +x migrate-to-clean.sh

# Run the migration
./migrate-to-clean.sh

echo ""
echo "======================================="
echo "Post-Cleanup Tasks"
echo "======================================="
echo ""
echo "✅ Files moved to archive/"
echo "✅ Documentation created"
echo "✅ .gitignore updated"
echo ""
echo "Now you should:"
echo "1. Review the archive/ folder"
echo "2. Commit the changes:"
echo "   git add -A"
echo "   git commit -m 'Repository cleanup: Archive old files, establish AI-first structure'"
echo "   git push"
echo ""
echo "3. Tag the working version:"
echo "   git tag v0.9.5-working a00eca9"
echo "   git push --tags"
echo ""
echo "Repository cleanup complete!"
