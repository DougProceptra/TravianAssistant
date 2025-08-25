const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'backend', 'server-sqlite.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Fix the INSERT statement - remove the 'id' field
content = content.replace(
  `INSERT INTO villages (id, account_id, village_id, name, coordinates)
          VALUES (?, ?, ?, ?, ?)`,
  `INSERT INTO villages (account_id, village_id, village_name, coordinates)
          VALUES (?, ?, ?, ?)`
);

// Fix the values being passed - remove villageDbId from the first position
content = content.replace(
  `villageStmt.run(
          villageDbId,
          accountId,
          v.villageId || v.id,
          v.villageName || v.name || 'Unknown',
          v.coordinates || ''
        );`,
  `villageStmt.run(
          accountId,
          v.villageId || v.id,
          v.villageName || v.name || 'Unknown',
          v.coordinates || ''
        );`
);

fs.writeFileSync(serverPath, content);
console.log('✅ Server code fixed');
