#!/bin/bash
# Pull latest changes from GitHub to Replit

echo "🔄 Pulling latest changes from GitHub..."
git pull origin main

echo "✅ Pull complete!"
echo ""
echo "📊 Now running Kirilloid scraper..."
echo "=================================="
python scripts/scrape-kirilloid.py
