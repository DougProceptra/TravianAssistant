#!/usr/bin/env node

/**
 * TravianAssistant V3 - Database Initialization
 * Creates all required tables for game data and player tracking
 * Run: node scripts/init-v3-database.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'travian-v3.db');
console.log(`📁 Initializing database at: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Drop existing tables for clean start
console.log('🗑️  Dropping existing tables...');
const tables = ['game_events', 'recommendations', 'performance_metrics', 
                'game_data_buildings', 'game_data_troops', 'game_data_mechanics',
                'villages', 'player_snapshots', 'chat_history'];

tables.forEach(table => {
  try {
    db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  } catch (e) {
    console.log(`   Warning: ${e.message}`);
  }
});

// Create schema
console.log('📊 Creating V3 schema...');

// Core game tracking
db.exec(`
  -- Villages from map.sql
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

  -- Game events for tracking all actions
  CREATE TABLE IF NOT EXISTS game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data JSON NOT NULL,
    village_id INTEGER,
    processed BOOLEAN DEFAULT FALSE
  );

  -- AI recommendations
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority INTEGER,
    action_type TEXT,
    action_data JSON,
    reasoning TEXT,
    completed BOOLEAN DEFAULT FALSE,
    result JSON
  );

  -- Performance tracking
  CREATE TABLE IF NOT EXISTS performance_metrics (
    date DATE PRIMARY KEY,
    population_rank INTEGER,
    resource_production INTEGER,
    time_played_minutes INTEGER,
    actions_automated INTEGER,
    data JSON
  );
`);

// Static game data tables (for Egyptians T4.6)
db.exec(`
  -- Building data
  CREATE TABLE IF NOT EXISTS game_data_buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_version TEXT NOT NULL DEFAULT 'T4.6',
    server_speed INTEGER NOT NULL DEFAULT 2,
    tribe TEXT NOT NULL DEFAULT 'egyptians',
    building_name TEXT NOT NULL,
    building_id INTEGER,
    level INTEGER NOT NULL,
    wood_cost INTEGER DEFAULT 0,
    clay_cost INTEGER DEFAULT 0,
    iron_cost INTEGER DEFAULT 0,
    crop_cost INTEGER DEFAULT 0,
    time_seconds INTEGER,
    population INTEGER DEFAULT 0,
    culture_points INTEGER DEFAULT 0,
    effect_description TEXT,
    effect_value REAL,
    max_level INTEGER DEFAULT 20,
    UNIQUE(server_version, server_speed, tribe, building_name, level)
  );

  -- Troop data
  CREATE TABLE IF NOT EXISTS game_data_troops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_version TEXT NOT NULL DEFAULT 'T4.6',
    server_speed INTEGER NOT NULL DEFAULT 2,
    tribe TEXT NOT NULL DEFAULT 'egyptians',
    unit_name TEXT NOT NULL,
    unit_id INTEGER,
    attack INTEGER,
    defense_infantry INTEGER,
    defense_cavalry INTEGER,
    speed_fields_per_hour INTEGER,
    carry_capacity INTEGER,
    upkeep_per_hour INTEGER,
    training_time_seconds INTEGER,
    wood_cost INTEGER DEFAULT 0,
    clay_cost INTEGER DEFAULT 0,
    iron_cost INTEGER DEFAULT 0,
    crop_cost INTEGER DEFAULT 0,
    training_building TEXT,
    UNIQUE(server_version, server_speed, tribe, unit_name)
  );

  -- Game mechanics (CP, celebrations, etc)
  CREATE TABLE IF NOT EXISTS game_data_mechanics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_version TEXT NOT NULL DEFAULT 'T4.6',
    server_speed INTEGER NOT NULL DEFAULT 2,
    mechanic_type TEXT NOT NULL,
    mechanic_key TEXT NOT NULL,
    mechanic_value TEXT NOT NULL,
    description TEXT,
    UNIQUE(server_version, server_speed, mechanic_type, mechanic_key)
  );

  -- Player snapshots for tracking progress
  CREATE TABLE IF NOT EXISTS player_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    villages JSON,
    resources JSON,
    troops JSON,
    buildings JSON,
    research JSON,
    hero JSON,
    data JSON
  );

  -- Chat history for AI context
  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT DEFAULT 'default',
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    game_state JSON
  );
`);

// Create indexes for performance
console.log('🔍 Creating indexes...');
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_buildings_lookup 
    ON game_data_buildings(server_version, server_speed, tribe, building_name, level);
  
  CREATE INDEX IF NOT EXISTS idx_troops_lookup 
    ON game_data_troops(server_version, server_speed, tribe, unit_name);
  
  CREATE INDEX IF NOT EXISTS idx_mechanics_lookup 
    ON game_data_mechanics(server_version, server_speed, mechanic_type);
  
  CREATE INDEX IF NOT EXISTS idx_villages_coords 
    ON villages(x, y);
  
  CREATE INDEX IF NOT EXISTS idx_recommendations_pending 
    ON recommendations(completed, priority);
  
  CREATE INDEX IF NOT EXISTS idx_chat_session 
    ON chat_history(session_id, timestamp);
`);

// Insert initial game data for Egyptians
console.log('🎮 Inserting Egyptian game data...');

// Basic resource fields (simplified for MVP)
const resourceFields = [
  { name: 'cropland', maxLevel: 18, baseProduction: 3 },
  { name: 'woodcutter', maxLevel: 18, baseProduction: 3 },
  { name: 'clay_pit', maxLevel: 18, baseProduction: 3 },
  { name: 'iron_mine', maxLevel: 18, baseProduction: 3 }
];

const insertBuilding = db.prepare(`
  INSERT OR REPLACE INTO game_data_buildings 
  (building_name, level, wood_cost, clay_cost, iron_cost, crop_cost, 
   time_seconds, population, culture_points, effect_value, max_level)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Insert sample building data (would be complete in production)
resourceFields.forEach(field => {
  for (let level = 1; level <= 5; level++) {
    const baseCost = 40 * Math.pow(1.67, level - 1);
    const costs = {
      wood: field.name === 'woodcutter' ? Math.round(baseCost * 1.5) : Math.round(baseCost),
      clay: field.name === 'clay_pit' ? Math.round(baseCost * 1.5) : Math.round(baseCost),
      iron: field.name === 'iron_mine' ? Math.round(baseCost * 1.5) : Math.round(baseCost),
      crop: Math.round(baseCost * 0.7)
    };
    
    insertBuilding.run(
      field.name,
      level,
      costs.wood,
      costs.clay,
      costs.iron,
      costs.crop,
      Math.round(1080 * Math.pow(1.67, level - 1) / 2), // 2x speed
      level === 1 ? 2 : 1,
      level,
      field.baseProduction * Math.pow(1.1634, level),
      field.maxLevel
    );
  }
});

// Insert Egyptian troops data
const egyptianTroops = [
  { name: 'slave_militia', attack: 10, def_inf: 30, def_cav: 20, speed: 7, carry: 20, upkeep: 1 },
  { name: 'ash_warden', attack: 30, def_inf: 55, def_cav: 40, speed: 6, carry: 45, upkeep: 1 },
  { name: 'khopesh_warrior', attack: 65, def_inf: 50, def_cav: 50, speed: 7, carry: 65, upkeep: 1 }
];

const insertTroop = db.prepare(`
  INSERT OR REPLACE INTO game_data_troops
  (unit_name, attack, defense_infantry, defense_cavalry, 
   speed_fields_per_hour, carry_capacity, upkeep_per_hour,
   wood_cost, clay_cost, iron_cost, crop_cost, training_time_seconds)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

egyptianTroops.forEach(troop => {
  insertTroop.run(
    troop.name,
    troop.attack,
    troop.def_inf,
    troop.def_cav,
    troop.speed,
    troop.carry,
    troop.upkeep,
    100, 130, 160, 70, // Sample costs
    900 / 2 // 2x speed
  );
});

// Insert game mechanics
const insertMechanic = db.prepare(`
  INSERT OR REPLACE INTO game_data_mechanics
  (mechanic_type, mechanic_key, mechanic_value, description)
  VALUES (?, ?, ?, ?)
`);

insertMechanic.run('culture_points', 'requirement_2nd_village', '500', 'CP needed for 2nd village');
insertMechanic.run('culture_points', 'requirement_3rd_village', '1000', 'CP needed for 3rd village');
insertMechanic.run('celebration', 'small_cost_multiplier', '6400', 'Resource cost for small celebration');
insertMechanic.run('celebration', 'small_cp_reward', '500', 'CP gained from small celebration');

// Verify installation
const counts = db.prepare(`
  SELECT 
    (SELECT COUNT(*) FROM game_data_buildings) as buildings,
    (SELECT COUNT(*) FROM game_data_troops) as troops,
    (SELECT COUNT(*) FROM game_data_mechanics) as mechanics
`).get();

console.log('\n✅ Database initialized successfully!');
console.log('📊 Data loaded:');
console.log(`   - ${counts.buildings} building levels`);
console.log(`   - ${counts.troops} troop types`);
console.log(`   - ${counts.mechanics} game mechanics`);
console.log(`\n📁 Database location: ${dbPath}`);
console.log('🚀 Ready for V3 operations!\n');

db.close();
