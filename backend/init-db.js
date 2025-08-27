#!/usr/bin/env node

/**
 * TravianAssistant V3 - Database Initialization
 * Creates SQLite database with proper schema
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'travian.db');
const SCHEMA_PATH = path.join(__dirname, 'database', 'schema.sql');

console.log('🏗️  TravianAssistant V3 - Database Setup');
console.log('========================================');

// Create database
console.log(`📦 Creating database at: ${DB_PATH}`);
const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

try {
  // Read and execute schema
  console.log('📋 Reading schema...');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`🔧 Executing ${statements.length} SQL statements...`);
  
  db.transaction(() => {
    for (const statement of statements) {
      try {
        db.exec(statement);
        console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        console.error(`❌ Failed to execute:`, statement);
        throw error;
      }
    }
  })();
  
  // Verify tables were created
  const tables = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ).all();
  
  console.log('\n📊 Created tables:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   ✓ ${table.name} (${count.count} rows)`);
  });
  
  // Insert initial data
  console.log('\n📝 Inserting initial data...');
  
  // Add a system message to chat history
  const stmt = db.prepare(`
    INSERT INTO chat_history (role, content, session_id) 
    VALUES (?, ?, ?)
  `);
  
  stmt.run(
    'system',
    'TravianAssistant V3 initialized. Ready to provide strategic guidance.',
    'init'
  );
  
  console.log('✅ Database initialization complete!');
  console.log('\n🎯 Next steps:');
  console.log('   1. Run: npm run server');
  console.log('   2. Extension will connect to http://localhost:3000');
  console.log('   3. Map data will auto-sync at 6am ET daily');
  
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
} finally {
  db.close();
}
