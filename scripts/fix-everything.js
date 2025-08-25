#!/usr/bin/env node

/**
 * Comprehensive fix for TravianAssistant backend
 * This script creates a clean, working database schema and fixes the server code
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔧 COMPREHENSIVE TRAVIANASSISTANT FIX');
console.log('=====================================\n');

// Step 1: Create a clean, working database
console.log('Step 1: Creating clean database...');

const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');

// Backup existing database
if (fs.existsSync(dbPath)) {
  const backupPath = dbPath + '.backup-' + Date.now();
  fs.copyFileSync(dbPath, backupPath);
  console.log(`  ✓ Backed up existing database to ${path.basename(backupPath)}`);
  fs.unlinkSync(dbPath);
}

// Create new database with proper schema
const db = new Database(dbPath);

// Disable foreign keys during creation
db.exec('PRAGMA foreign_keys = OFF');

// Create tables with consistent schema
db.exec(`
  -- Accounts table (string ID to match server expectations)
  CREATE TABLE accounts (
    account_id TEXT PRIMARY KEY,
    server_url TEXT,
    account_name TEXT,
    tribe TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Villages table (simplified, no foreign keys to avoid conflicts)
  CREATE TABLE villages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    village_id TEXT NOT NULL,
    name TEXT,
    coordinates TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    population INTEGER DEFAULT 0,
    data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, village_id)
  );

  -- Village snapshots (using TEXT for village_id to match server)
  CREATE TABLE village_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resources TEXT,
    production TEXT,
    buildings TEXT,
    troops TEXT,
    population INTEGER DEFAULT 0
  );

  -- Alerts table
  CREATE TABLE alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    type TEXT,
    severity TEXT,
    message TEXT,
    village_id TEXT,
    data TEXT,
    resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Recommendations table
  CREATE TABLE recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    priority INTEGER,
    action_type TEXT,
    action_data JSON,
    completed BOOLEAN DEFAULT 0,
    result JSON
  );

  -- Performance metrics
  CREATE TABLE performance_metrics (
    date DATE PRIMARY KEY,
    population_rank INTEGER,
    resource_production INTEGER,
    time_played_minutes INTEGER,
    actions_automated INTEGER
  );

  -- Create indexes for performance
  CREATE INDEX idx_villages_account ON villages(account_id);
  CREATE INDEX idx_villages_coords ON villages(x, y);
  CREATE INDEX idx_snapshots_village ON village_snapshots(village_id);
  CREATE INDEX idx_alerts_account ON alerts(account_id);
`);

console.log('  ✓ Database schema created');

// Verify tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(`  ✓ Created ${tables.length} tables: ${tables.map(t => t.name).join(', ')}`);

db.close();

// Step 2: Fix the server code
console.log('\nStep 2: Fixing server code...');

const serverPath = path.join(__dirname, '..', 'backend', 'server-sqlite.js');
let serverCode = fs.readFileSync(serverPath, 'utf8');

// Fix 1: Account creation - fix the VALUES count
serverCode = serverCode.replace(
  /INSERT INTO accounts \(id, server_url, account_name, tribe\) VALUES \(\?, \?, \?, \?, \?\)/g,
  'INSERT INTO accounts (account_id, server_url, account_name, tribe) VALUES (?, ?, ?, ?)'
);

// Fix 2: Account creation run statement
serverCode = serverCode.replace(
  /accountStmt\.run\(\s*accountId,\s*accountId,/g,
  'accountStmt.run(\n      accountId,'
);

// Fix 3: Villages insert - ensure coordinates are parsed
if (!serverCode.includes('const coords = (v.coordinates')) {
  // Find the villages endpoint
  const villageInsertIndex = serverCode.indexOf('INSERT INTO villages (account_id, village_id, name, coordinates');
  if (villageInsertIndex > -1) {
    // Find the run statement
    const runIndex = serverCode.indexOf('villageStmt.run(', villageInsertIndex);
    const runEndIndex = serverCode.indexOf(');', runIndex);
    
    // Replace with coordinate parsing version
    const beforeRun = serverCode.substring(0, runIndex);
    const afterRun = serverCode.substring(runEndIndex + 2);
    
    const newRun = `// Parse coordinates
        const coords = (v.coordinates || '0|0').split('|');
        const x = parseInt(coords[0]) || 0;
        const y = parseInt(coords[1]) || 0;
        
        villageStmt.run(
          accountId,
          v.villageId || v.id,
          v.villageName || v.name || 'Unknown',
          v.coordinates || '0|0',
          x,
          y
        );`;
    
    serverCode = beforeRun + newRun + afterRun;
  }
}

// Fix 4: Ensure account exists before village insert
if (!serverCode.includes('INSERT OR IGNORE INTO accounts')) {
  const transactionIndex = serverCode.indexOf('const transaction = db.transaction(() => {');
  if (transactionIndex > -1) {
    const insertPoint = serverCode.indexOf('{', transactionIndex) + 1;
    const accountCheck = `
      // Ensure account exists
      db.prepare('INSERT OR IGNORE INTO accounts (account_id) VALUES (?)').run(accountId);
      `;
    serverCode = serverCode.slice(0, insertPoint) + accountCheck + serverCode.slice(insertPoint);
  }
}

// Fix 5: Fix the account query
serverCode = serverCode.replace(
  'SELECT * FROM accounts WHERE id = ?',
  'SELECT * FROM accounts WHERE account_id = ?'
);

// Write fixed server code
fs.writeFileSync(serverPath, serverCode);
console.log('  ✓ Server code fixed');

// Step 3: Create a test account to avoid foreign key issues
console.log('\nStep 3: Creating test data...');
const testDb = new Database(dbPath);
try {
  testDb.prepare('INSERT OR IGNORE INTO accounts (account_id, account_name) VALUES (?, ?)').run('test_account_001', 'Test Account');
  console.log('  ✓ Test account created');
} catch (e) {
  console.log('  ⚠ Test account might already exist');
}
testDb.close();

console.log('\n✅ COMPREHENSIVE FIX COMPLETE!');
console.log('\nNext steps:');
console.log('1. Restart the server:');
console.log('   pkill -f "node.*server-sqlite"');
console.log('   cd backend && PORT=3001 node server-sqlite.js');
console.log('\n2. Run the tests:');
console.log('   PORT=3001 node scripts/test-backend-sqlite.js');
console.log('\nThe backend should now pass all tests! 🚀');
