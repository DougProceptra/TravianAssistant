const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('════════════════════════════════════════════════════════');
console.log('  COMPREHENSIVE TRAVIANASSISTANT ANALYSIS');
console.log('════════════════════════════════════════════════════════\n');

// 1. Check Database Schema
console.log('📊 DATABASE SCHEMA ANALYSIS\n');
const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const schemaInfo = {};

for (const table of tables) {
  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
  const indexes = db.prepare(`PRAGMA index_list(${table.name})`).all();
  
  schemaInfo[table.name] = {
    columns: columns.map(c => ({
      name: c.name,
      type: c.type,
      notNull: c.notnull === 1,
      defaultValue: c.dflt_value,
      primaryKey: c.pk > 0
    })),
    foreignKeys,
    indexes
  };
  
  console.log(`Table: ${table.name}`);
  console.log('  Columns:');
  columns.forEach(c => {
    const constraints = [];
    if (c.pk > 0) constraints.push('PRIMARY KEY');
    if (c.notnull === 1) constraints.push('NOT NULL');
    if (c.dflt_value) constraints.push(`DEFAULT ${c.dflt_value}`);
    console.log(`    - ${c.name} (${c.type}) ${constraints.join(', ')}`);
  });
  if (foreignKeys.length > 0) {
    console.log('  Foreign Keys:');
    foreignKeys.forEach(fk => {
      console.log(`    - ${fk.from} -> ${fk.table}(${fk.to})`);
    });
  }
  console.log('');
}

db.close();

// 2. Analyze Server Endpoints
console.log('🔌 SERVER ENDPOINT ANALYSIS\n');
const serverPath = path.join(__dirname, '..', 'backend', 'server-sqlite.js');
const serverCode = fs.readFileSync(serverPath, 'utf8');

// Find all SQL statements
const sqlStatements = [];
const sqlRegex = /db\.prepare\(['"`](.*?)['"`]\)/gs;
let match;
while ((match = sqlRegex.exec(serverCode)) !== null) {
  sqlStatements.push({
    sql: match[1].replace(/\s+/g, ' ').trim(),
    position: match.index
  });
}

// Group by table
const tableOperations = {};
for (const stmt of sqlStatements) {
  const tableMatch = stmt.sql.match(/(?:INSERT INTO|UPDATE|SELECT.*FROM|DELETE FROM)\s+(\w+)/i);
  if (tableMatch) {
    const table = tableMatch[1];
    if (!tableOperations[table]) tableOperations[table] = [];
    tableOperations[table].push(stmt.sql);
  }
}

console.log('SQL Operations by Table:');
for (const [table, operations] of Object.entries(tableOperations)) {
  console.log(`\nTable: ${table}`);
  operations.forEach((op, i) => {
    console.log(`  ${i + 1}. ${op.substring(0, 80)}${op.length > 80 ? '...' : ''}`);
  });
}

// 3. Analyze Test Expectations
console.log('\n\n📝 TEST EXPECTATIONS ANALYSIS\n');
const testPath = path.join(__dirname, 'test-backend-sqlite.js');
const testCode = fs.readFileSync(testPath, 'utf8');

// Extract TEST_VILLAGE structure
const testVillageMatch = testCode.match(/const TEST_VILLAGE = ({[\s\S]*?});/);
if (testVillageMatch) {
  console.log('TEST_VILLAGE structure:');
  const testVillage = testVillageMatch[1];
  console.log(testVillage);
}

// 4. Find Mismatches
console.log('\n\n⚠️  IDENTIFIED MISMATCHES\n');

const issues = [];

// Check villages table issues
const villagesSchema = schemaInfo.villages;
if (villagesSchema) {
  const columnNames = villagesSchema.columns.map(c => c.name);
  
  // Check what server expects vs what exists
  const serverExpects = {
    'account_id': true,
    'village_id': true,
    'name': true,
    'coordinates': true,
    'x': true,
    'y': true
  };
  
  for (const [col, required] of Object.entries(serverExpects)) {
    if (!columnNames.includes(col)) {
      issues.push(`Missing column: villages.${col}`);
    }
  }
  
  // Check NOT NULL constraints
  const notNullCols = villagesSchema.columns.filter(c => c.notNull && !c.primaryKey);
  notNullCols.forEach(col => {
    if (!['account_id', 'village_id'].includes(col.name)) {
      issues.push(`Column ${col.name} is NOT NULL but server might not provide value`);
    }
  });
}

// Check foreign key constraints
for (const [table, info] of Object.entries(schemaInfo)) {
  if (info.foreignKeys.length > 0) {
    info.foreignKeys.forEach(fk => {
      issues.push(`Foreign key: ${table}.${fk.from} -> ${fk.table}(${fk.to}) - ensure parent exists first`);
    });
  }
}

if (issues.length > 0) {
  console.log('Issues found:');
  issues.forEach(issue => console.log(`  ❌ ${issue}`));
} else {
  console.log('  ✅ No obvious mismatches found');
}

console.log('\n\n════════════════════════════════════════════════════════');
console.log('  ANALYSIS COMPLETE');
console.log('════════════════════════════════════════════════════════');
