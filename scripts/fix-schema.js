const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
const db = new Database(dbPath);

console.log('🔧 Fixing database schema...');

// Check current schema
const tables = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='villages'").get();
console.log('Current villages table schema:', tables?.sql || 'Not found');

// Add missing account_id column if it doesn't exist
try {
  // Check if column exists
  const tableInfo = db.prepare("PRAGMA table_info(villages)").all();
  const hasAccountId = tableInfo.some(col => col.name === 'account_id');
  
  if (!hasAccountId) {
    console.log('Adding account_id column...');
    db.exec('ALTER TABLE villages ADD COLUMN account_id TEXT');
    db.exec('UPDATE villages SET account_id = player_id WHERE player_id IS NOT NULL');
    console.log('✅ Column added successfully');
  } else {
    console.log('✅ account_id column already exists');
  }
  
  // Verify
  const newInfo = db.prepare("PRAGMA table_info(villages)").all();
  console.log('Columns:', newInfo.map(c => c.name).join(', '));
  
} catch (error) {
  console.error('Error:', error.message);
}

db.close();
console.log('✅ Schema fix complete');
