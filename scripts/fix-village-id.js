const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
const db = new Database(dbPath);

console.log('Fixing village_id column...');

// Check current columns
const tableInfo = db.prepare("PRAGMA table_info(villages)").all();
console.log('Current columns:', tableInfo.map(c => c.name).join(', '));

// Add missing village_id column if it doesn't exist
const hasVillageId = tableInfo.some(col => col.name === 'village_id');

if (!hasVillageId) {
  console.log('Adding village_id column...');
  db.exec('ALTER TABLE villages ADD COLUMN village_id TEXT');
  console.log('Column added');
} else {
  console.log('village_id column already exists');
}

db.close();
console.log('Done');
