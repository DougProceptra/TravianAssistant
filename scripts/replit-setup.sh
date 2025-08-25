#!/bin/bash

# TravianAssistant Replit Setup & Test Script
# This script sets up and tests the SQLite backend in Replit
# Run from Replit Shell: bash scripts/replit-setup.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${MAGENTA}╔════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${MAGENTA}║  TravianAssistant Replit Setup Script  ║${NC}"
echo -e "${BOLD}${MAGENTA}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check if we're in Replit
print_status "Checking environment..."
if [ -n "$REPL_ID" ] || [ -n "$REPLIT_DB_URL" ]; then
    print_success "Running in Replit environment"
    echo "  Repl: $REPL_SLUG"
    echo "  Owner: $REPL_OWNER"
else
    print_warning "Not running in Replit, but continuing anyway..."
fi

# Step 2: Pull latest from GitHub
print_status "Syncing with GitHub..."
if git pull origin main; then
    print_success "GitHub sync complete"
    LATEST_COMMIT=$(git log -1 --oneline)
    echo "  Latest commit: $LATEST_COMMIT"
else
    print_warning "Git pull failed, continuing with local files"
fi

# Step 3: Check project structure
print_status "Checking project structure..."
REQUIRED_DIRS=("backend" "scripts" "packages/extension" "docs" "api")
MISSING_DIRS=()

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_success "Directory exists: $dir"
    else
        print_error "Missing directory: $dir"
        MISSING_DIRS+=("$dir")
    fi
done

if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
    print_error "Some directories are missing. Creating them..."
    for dir in "${MISSING_DIRS[@]}"; do
        mkdir -p "$dir"
        print_success "Created: $dir"
    done
fi

# Step 4: Install backend dependencies
print_status "Installing backend dependencies..."
cd backend

if [ ! -f "package.json" ]; then
    print_error "backend/package.json not found!"
    cd ..
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_warning "node_modules exists, skipping install (use 'npm install' to update)"
else
    print_status "Running npm install..."
    if npm install; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install dependencies"
        cd ..
        exit 1
    fi
fi

# Step 5: Check/Initialize database
print_status "Checking database..."
if [ -f "travian.db" ]; then
    DB_SIZE=$(du -h travian.db | cut -f1)
    print_success "Database exists (size: $DB_SIZE)"
    
    # Test database structure
    TABLE_COUNT=$(sqlite3 travian.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null)
    if [ -n "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -gt 0 ]; then
        print_success "Database has $TABLE_COUNT tables"
    else
        print_warning "Database appears empty, reinitializing..."
        node ../scripts/init-db-v3.js
    fi
else
    print_warning "Database not found, initializing..."
    if node ../scripts/init-db-v3.js; then
        print_success "Database initialized"
    else
        print_error "Failed to initialize database"
    fi
fi

# Step 6: Start the backend server
print_status "Starting SQLite backend server..."
echo ""
echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}Starting Backend Server${NC}"
echo -e "${BOLD}${BLUE}════════════════════════════════════════${NC}"
echo ""

# Check if server is already running
if lsof -i:3001 > /dev/null 2>&1; then
    print_warning "Server already running on port 3001"
    PID=$(lsof -t -i:3001)
    echo "  PID: $PID"
    echo ""
    read -p "Kill existing server and restart? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $PID
        sleep 2
        print_success "Previous server stopped"
    else
        print_status "Keeping existing server"
    fi
fi

# Create a simple server test file
cat > test-server.js << 'EOF'
const { spawn } = require('child_process');
const http = require('http');

console.log('Starting server and waiting for it to be ready...\n');

// Start the server
const server = spawn('node', ['server-sqlite.js'], {
  stdio: 'inherit',
  env: { ...process.env, USE_SQLITE: 'true' }
});

// Wait a moment for server to start
setTimeout(() => {
  // Test if server is running
  const req = http.get('http://localhost:3001/api/health', (res) => {
    if (res.statusCode === 200) {
      console.log('\n✅ Server is running successfully!');
      console.log('🌐 Access URLs:');
      console.log('   API: http://localhost:3001');
      console.log('   Health: http://localhost:3001/api/health');
      console.log('   WebSocket: ws://localhost:3001');
      console.log('\n📝 Next steps:');
      console.log('1. Open a new Shell tab');
      console.log('2. Run: node scripts/test-backend-sqlite.js');
      console.log('3. Check the test results');
      console.log('\nPress Ctrl+C to stop the server');
    }
  });
  
  req.on('error', (error) => {
    console.error('❌ Server failed to start:', error.message);
    server.kill();
    process.exit(1);
  });
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill();
  process.exit(0);
});
EOF

# Run the server
print_status "Launching server..."
echo ""
node test-server.js

# This line will only execute after server is stopped
cd ..
echo ""
print_success "Setup complete!"
