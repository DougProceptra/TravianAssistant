const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'backend', 'server-sqlite.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Fix the INSERT statement to use 'name' instead of 'village_name'
content = content.replace(
  'INSERT INTO villages (account_id, village_id, village_name, coordinates)',
  'INSERT INTO villages (account_id, village_id, name, coordinates)'
);

// Also need to handle the ON CONFLICT properly
content = content.replace(
  'INSERT INTO villages (id, account_id, village_id, name, coordinates)',
  'INSERT INTO villages (account_id, village_id, name, coordinates)'
);

fs.writeFileSync(serverPath, content);
console.log('✅ Server column names fixed');
