#!/bin/bash

# Puppeteer Setup Script for Replit - Fixed Version
# Uses system Chromium instead of downloading Chrome

echo "╔════════════════════════════════════════════════╗"
echo "║     Puppeteer Kirilloid Extractor Setup       ║"
echo "║              (Fixed Version)                   ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if we're on Replit
if [ -n "$REPL_ID" ]; then
    echo "✅ Running on Replit (ID: $REPL_ID)"
else
    echo "⚠️  Not running on Replit - some features may not work"
fi

# Set environment variable to skip Chrome download
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

echo ""
echo "🔧 Setting up Puppeteer to use system Chromium..."
echo "   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true"
echo "   PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser"

# Install required NPM packages WITHOUT downloading Chrome
echo ""
echo "📦 Installing NPM packages (without Chrome download)..."
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer-core@21.0.0 better-sqlite3@9.0.0

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ NPM packages installed successfully"
else
    echo "⚠️  Trying alternative installation method..."
    # Try with just puppeteer-core which doesn't download Chrome
    npm install puppeteer-core@21.0.0 better-sqlite3@9.0.0
    
    if [ $? -eq 0 ]; then
        echo "✅ Alternative installation successful"
    else
        echo "❌ Failed to install NPM packages"
        exit 1
    fi
fi

# Check for Chromium
echo ""
echo "🔍 Checking for Chromium..."
if command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium found at: $(which chromium-browser)"
    CHROMIUM_PATH=$(which chromium-browser)
elif command -v chromium &> /dev/null; then
    echo "✅ Chromium found at: $(which chromium)"
    CHROMIUM_PATH=$(which chromium)
elif command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome found at: $(which google-chrome)"
    CHROMIUM_PATH=$(which google-chrome)
else
    echo "⚠️  No Chromium/Chrome found in PATH"
    echo "   Puppeteer will try to use bundled Chrome"
    CHROMIUM_PATH=""
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
    
    # Create init script
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

# Create a wrapper script that sets the Chrome path
echo ""
echo "📝 Creating extraction wrapper with Chrome path..."

cat > scripts/run-extraction.sh << EOF
#!/bin/bash
# Wrapper script to run extraction with correct Chrome path

export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH="${CHROMIUM_PATH:-/usr/bin/chromium-browser}"

echo "Using Chrome at: \$PUPPETEER_EXECUTABLE_PATH"

if [ "\$1" == "minimal" ]; then
    echo "Running minimal extraction..."
    node scripts/extract-kirilloid-minimal-fixed.js
elif [ "\$1" == "full" ]; then
    echo "Running full extraction..."
    node scripts/extract-kirilloid-puppeteer-fixed.js
else
    echo "Usage: ./scripts/run-extraction.sh [minimal|full]"
    echo "  minimal - Extract only Main Building for validation"
    echo "  full    - Extract all game data"
fi
EOF

chmod +x scripts/run-extraction.sh

# Display summary
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ Setup complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Run minimal extraction (recommended first):"
echo "   ./scripts/run-extraction.sh minimal"
echo ""
echo "2. After validation passes, run full extraction:"
echo "   ./scripts/run-extraction.sh full"
echo ""
echo "🔧 If you encounter Chrome issues, try:"
echo "   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser"
echo "   node scripts/extract-kirilloid-minimal-fixed.js"
echo ""
if [ -n "$CHROMIUM_PATH" ]; then
    echo "📍 Chrome detected at: $CHROMIUM_PATH"
else
    echo "⚠️  Chrome not detected - you may need to install it"
fi
