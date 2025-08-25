const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
const db = new Database(dbPath);

console.log('Adding coordinates column...');

try {
  db.exec('ALTER TABLE villages ADD COLUMN coordinates TEXT');
  console.log('✅ coordinates column added');
} catch (error) {
  if (error.message.includes('duplicate column')) {
    console.log('Column already exists');
  } else {
    console.error('Error:', error.message);
  }
}

db.close();
console.log('Done');
