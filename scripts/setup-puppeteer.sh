#!/bin/bash

# Puppeteer Setup Script for Replit
# Ensures all dependencies are installed for Kirilloid extraction

echo "╔════════════════════════════════════════════════╗"
echo "║     Puppeteer Kirilloid Extractor Setup       ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if we're on Replit
if [ -n "$REPL_ID" ]; then
    echo "✅ Running on Replit (ID: $REPL_ID)"
else
    echo "⚠️  Not running on Replit - some features may not work"
fi

# Install required NPM packages
echo ""
echo "📦 Installing NPM packages..."
npm install puppeteer@21.0.0 better-sqlite3@9.0.0

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ NPM packages installed successfully"
else
    echo "❌ Failed to install NPM packages"
    exit 1
fi

# Create backend directory if it doesn't exist
if [ ! -d "backend" ]; then
    echo ""
    echo "📁 Creating backend directory..."
    mkdir -p backend
fi

# Initialize database if it doesn't exist
if [ ! -f "backend/travian.db" ]; then
    echo ""
    echo "🗄️ Initializing SQLite database..."
    
    # Create empty database with schema
    cat > scripts/init-puppeteer-db.js << 'EOF'
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'backend', 'travian.db'));

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS game_data_buildings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_version TEXT NOT NULL,
        server_speed INTEGER NOT NULL,
        building_id TEXT NOT NULL,
        building_name TEXT NOT NULL,
        level INTEGER NOT NULL,
        wood_cost INTEGER,
        clay_cost INTEGER,
        iron_cost INTEGER,
        crop_cost INTEGER,
        time_seconds INTEGER,
        population INTEGER,
        culture_points INTEGER,
        effect_value REAL,
        effect_description TEXT,
        UNIQUE(server_version, server_speed, building_id, level)
    );

    CREATE TABLE IF NOT EXISTS game_data_troops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_version TEXT NOT NULL,
        server_speed INTEGER NOT NULL,
        tribe TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        attack INTEGER,
        defense_infantry INTEGER,
        defense_cavalry INTEGER,
        speed_fields_per_hour INTEGER,
        carry_capacity INTEGER,
        upkeep_per_hour INTEGER,
        training_time_seconds INTEGER,
        wood_cost INTEGER,
        clay_cost INTEGER,
        iron_cost INTEGER,
        crop_cost INTEGER,
        UNIQUE(server_version, server_speed, tribe, unit_id)
    );

    CREATE TABLE IF NOT EXISTS game_data_mechanics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_version TEXT NOT NULL,
        server_speed INTEGER NOT NULL,
        mechanic_type TEXT NOT NULL,
        mechanic_key TEXT NOT NULL,
        mechanic_value TEXT NOT NULL,
        UNIQUE(server_version, server_speed, mechanic_type, mechanic_key)
    );
`);

console.log('✅ Database initialized with schema');
db.close();
EOF

    node scripts/init-puppeteer-db.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Database initialized"
    else
        echo "❌ Failed to initialize database"
    fi
else
    echo ""
    echo "✅ Database already exists"
fi

# Test Puppeteer installation
echo ""
echo "🧪 Testing Puppeteer installation..."

cat > scripts/test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto('http://example.com');
        const title = await page.title();
        console.log('✅ Puppeteer works! Test page title:', title);
        await browser.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Puppeteer test failed:', error.message);
        process.exit(1);
    }
})();
EOF

node scripts/test-puppeteer.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Puppeteer is working correctly"
else
    echo ""
    echo "❌ Puppeteer test failed"
    echo "You may need to configure Chromium in replit.nix"
fi

# Display available extraction scripts
echo ""
echo "📝 Available extraction scripts:"
echo ""
echo "1. Minimal POC (recommended to start):"
echo "   node scripts/extract-kirilloid-minimal.js"
echo ""
echo "2. Full extractor (all buildings, troops, mechanics):"
echo "   node scripts/extract-kirilloid-puppeteer.js"
echo ""
echo "🎯 Next steps:"
echo "1. Run the minimal extractor first to validate the approach"
echo "2. Check if Main Building Level 6 matches expected values"
echo "3. If validation passes, run the full extractor"
echo ""
echo "✅ Setup complete!"
