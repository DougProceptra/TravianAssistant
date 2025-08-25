const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
const db = new Database(dbPath);

console.log('🔧 Fixing table constraints...');

try {
  // Check current table structure
  const tableInfo = db.prepare("PRAGMA table_info(villages)").all();
  console.log('Columns:', tableInfo.map(c => c.name).join(', '));
  
  // Create a unique index on account_id + village_id
  console.log('Creating unique constraint...');
  try {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_villages_account_village ON villages(account_id, village_id)');
    console.log('✅ Unique constraint created');
  } catch (e) {
    console.log('Constraint might already exist:', e.message);
  }
  
  // Also ensure we have the primary columns
  const hasPrimary = tableInfo.some(col => col.pk > 0);
  console.log('Has primary key:', hasPrimary);
  
} catch (error) {
  console.error('Error:', error.message);
}

db.close();
console.log('✅ Constraint fix complete');
