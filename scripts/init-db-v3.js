const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use existing database location
const dbPath = path.join(__dirname, '..', 'backend', 'travian.db');
console.log('📁 Using database at:', dbPath);

// Open database (already exists)
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better performance
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log('🔨 Creating V3 database schema...');

// V3 Schema - optimized for game start and AI recommendations
const v3Schema = `
  -- Core villages table (from map.sql)
  CREATE TABLE IF NOT EXISTS villages (
    id INTEGER PRIMARY KEY,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    vid INTEGER UNIQUE,
    name TEXT,
    player_id INTEGER,
    population INTEGER,
    data JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(x, y)
  );

  -- Players table
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    alliance_id INTEGER,
    population INTEGER,
    villages INTEGER,
    data JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Alliances table
  CREATE TABLE IF NOT EXISTS alliances (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    tag TEXT,
    members INTEGER,
    data JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Game events tracking
  CREATE TABLE IF NOT EXISTS game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    data JSON NOT NULL,
    village_id INTEGER,
    processed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (village_id) REFERENCES villages(vid)
  );

  -- AI recommendations (V3 core feature)
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority INTEGER,
    action_type TEXT,
    action_data JSON,
    completed BOOLEAN DEFAULT FALSE,
    result JSON,
    ai_confidence REAL,
    phase TEXT
  );

  -- Performance metrics
  CREATE TABLE IF NOT EXISTS performance_metrics (
    date DATE PRIMARY KEY,
    population_rank INTEGER,
    resource_production INTEGER,
    time_played_minutes INTEGER,
    actions_automated INTEGER,
    settler_eta_hours INTEGER,
    data JSON
  );

  -- User villages (your own villages with detailed data)
  CREATE TABLE IF NOT EXISTS user_villages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vid INTEGER UNIQUE,
    name TEXT,
    x INTEGER,
    y INTEGER,
    resources JSON,
    buildings JSON,
    troops JSON,
    production JSON,
    queues JSON,
    is_capital BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vid) REFERENCES villages(vid)
  );
  
  -- Game start optimization table (V3 special)
  CREATE TABLE IF NOT EXISTS game_start_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_start_time TIMESTAMP,
    current_phase TEXT,
    hours_elapsed INTEGER,
    cp_accumulated INTEGER,
    next_settlement_eta TIMESTAMP,
    strategy_notes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_villages_player ON villages(player_id);
  CREATE INDEX IF NOT EXISTS idx_villages_coords ON villages(x, y);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON game_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_events_type ON game_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);
  CREATE INDEX IF NOT EXISTS idx_recommendations_phase ON recommendations(phase);
`;

// Execute schema
const statements = v3Schema.split(';');
let successCount = 0;
let errorCount = 0;

statements.forEach(statement => {
  const trimmed = statement.trim();
  if (trimmed) {
    try {
      db.exec(trimmed);
      successCount++;
    } catch (err) {
      console.error('⚠️ Error executing:', trimmed.substring(0, 50) + '...');
      console.error('   ', err.message);
      errorCount++;
    }
  }
});

console.log(`✅ Schema execution complete: ${successCount} successful, ${errorCount} errors`);

// Show table info
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log('\n📊 Database tables:');
tables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  console.log(`  - ${table.name}: ${count.count} records`);
});

// Insert initial game start configuration
const initGameStart = db.prepare(`
  INSERT OR REPLACE INTO game_start_progress 
  (id, server_start_time, current_phase, hours_elapsed, cp_accumulated, strategy_notes)
  VALUES (1, datetime('now', '-1 day'), 'initial', 24, 0, json('{"tribe":"Egyptians","strategy":"Top-5 settler"}'))
`);

try {
  initGameStart.run();
  console.log('\n🎮 Game start tracker initialized');
} catch (err) {
  console.error('Could not initialize game start tracker:', err.message);
}

db.close();
console.log('\n✨ Database V3 schema ready!');
