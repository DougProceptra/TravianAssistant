const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'backend', 'server-sqlite.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Find the INSERT statement and add x, y columns
const oldInsert = 'INSERT INTO villages (account_id, village_id, name, coordinates)';
const newInsert = 'INSERT INTO villages (account_id, village_id, name, coordinates, x, y)';
content = content.replace(oldInsert, newInsert);

// Find the VALUES and add x, y parsing
const oldValues = `VALUES (?, ?, ?, ?)`;
const newValues = `VALUES (?, ?, ?, ?, ?, ?)`;
content = content.replace(oldValues, newValues);

// Find the run statement and add coordinate parsing
const oldRun = `villageStmt.run(
          accountId,
          v.villageId || v.id,
          v.villageName || v.name || 'Unknown',
          v.coordinates || ''
        );`;

const newRun = `const coords = (v.coordinates || '0|0').split('|');
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

content = content.replace(oldRun, newRun);

// Also update the ON CONFLICT to include x and y
content = content.replace(
  'ON CONFLICT(account_id, village_id) DO UPDATE SET\n            name = excluded.name,\n            coordinates = excluded.coordinates',
  'ON CONFLICT(account_id, village_id) DO UPDATE SET\n            name = excluded.name,\n            coordinates = excluded.coordinates,\n            x = excluded.x,\n            y = excluded.y'
);

fs.writeFileSync(serverPath, content);
console.log('✅ Coordinate parsing added to server');
