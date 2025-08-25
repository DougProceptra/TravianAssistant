const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
const db = new Database(dbPath);

const tables = ['villages', 'village_snapshots', 'accounts'];

for (const table of tables) {
  console.log(`\n=== ${table} ===`);
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  columns.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
}

db.close();
