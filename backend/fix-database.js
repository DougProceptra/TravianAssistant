#!/usr/bin/env node

/**
 * Database Fix Script
 * Recreates the correct schema that was working in Session 3
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TravianAssistant Database Schema...\n');

// Backup existing database if it exists
const dbPath = path.join(__dirname, 'travian.db');
if (fs.existsSync(dbPath)) {
  const backupPath = path.join(__dirname, `travian.backup.${Date.now()}.db`);
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backed up existing database to: ${backupPath}`);
  
  // Remove the corrupted database
  fs.unlinkSync(dbPath);
  console.log('✅ Removed corrupted database');
}

// Create new database with correct schema
const db = new Database(dbPath);

console.log('📝 Creating correct schema from Session 3...\n');

// This is the EXACT schema from the working server-sqlite.js
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    server_url TEXT NOT NULL,
    account_name TEXT,
    tribe TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS villages (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    village_id TEXT NOT NULL,
    name TEXT NOT NULL,
    coordinates TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    is_capital INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE(account_id, village_id)
  );
  
  CREATE TABLE IF NOT EXISTS village_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resources TEXT NOT NULL,
    production TEXT NOT NULL,
    buildings TEXT,
    troops TEXT,
    population INTEGER,
    FOREIGN KEY (village_id) REFERENCES villages(id)
  );
  
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    village_id TEXT,
    data TEXT,
    resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );
  
  CREATE INDEX IF NOT EXISTS idx_snapshots_village ON village_snapshots(village_id);
  CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON village_snapshots(timestamp);
  CREATE INDEX IF NOT EXISTS idx_alerts_account ON alerts(account_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
`);

console.log('✅ Tables created successfully');

// Verify the schema
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('\n📋 Created tables:');
tables.forEach(t => console.log(`   - ${t.name}`));

// Check villages table structure
const villageColumns = db.prepare("PRAGMA table_info(villages)").all();
console.log('\n📋 Villages table columns:');
villageColumns.forEach(col => {
  console.log(`   - ${col.name} (${col.type})${col.pk ? ' [PRIMARY KEY]' : ''}`);
});

// Insert test data to verify everything works
console.log('\n🧪 Testing with sample data...');

try {
  // Insert test account
  db.prepare(`
    INSERT INTO accounts (id, server_url, account_name, tribe)
    VALUES ('test_account', 'https://test.travian.com', 'TestPlayer', 'Egyptians')
  `).run();
  
  // Insert test village with ALL required fields
  db.prepare(`
    INSERT INTO villages (id, account_id, village_id, name, coordinates, x, y)
    VALUES ('test_account_village_001', 'test_account', 'village_001', 'Test Village', '0|0', 0, 0)
  `).run();
  
  console.log('✅ Test data inserted successfully');
  
  // Clean up test data
  db.prepare('DELETE FROM villages WHERE account_id = ?').run('test_account');
  db.prepare('DELETE FROM accounts WHERE id = ?').run('test_account');
  console.log('✅ Test data cleaned up');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

db.close();

console.log('\n========================================');
console.log('✅ DATABASE FIXED SUCCESSFULLY!');
console.log('========================================');
console.log('\nThe database schema has been restored to the working state from Session 3.');
console.log('\nNext steps:');
console.log('1. Restart the backend server:');
console.log('   cd backend && npm run server:sqlite');
console.log('\n2. Run the test script to verify:');
console.log('   node scripts/test-backend-sqlite.js');
console.log('\n3. The backend should now work correctly with the extension');
