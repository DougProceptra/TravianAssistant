const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'backend', 'server-sqlite.js');
let serverCode = fs.readFileSync(serverPath, 'utf8');

// Fix the account creation endpoint
serverCode = serverCode.replace(
  `INSERT INTO accounts (id, server_url, account_name, tribe)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id)`,
  `INSERT INTO accounts (account_id, server_url, account_name, tribe)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(account_id)`
);

fs.writeFileSync(serverPath, serverCode);
console.log('✅ Account endpoint fixed');
