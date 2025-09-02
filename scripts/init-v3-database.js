#!/usr/bin/env node

/**
 * Initialize TravianAssistant V3 Database
 * Creates all necessary tables and loads default game data
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use environment variable or default path
const DB_PATH = process.env.DB_PATH || './db/travian.db';

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('🗄️  Initializing database at:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create all tables (matching server.js schema)
console.log('📊 Creating database schema...');

db.exec(`
  -- Drop existing tables to ensure clean schema
  DROP TABLE IF EXISTS villages;
  DROP TABLE IF EXISTS user_villages;
  DROP TABLE IF EXISTS game_events;
  DROP TABLE IF EXISTS recommendations;
  DROP TABLE IF EXISTS buildings;
  DROP TABLE IF EXISTS troops;
  DROP TABLE IF EXISTS quests;
  DROP TABLE IF EXISTS settlement_tracking;
  
  -- Villages from map.sql
  CREATE TABLE villages (
    id INTEGER PRIMARY KEY,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    tid INTEGER,
    vid INTEGER UNIQUE,
    village TEXT,
    uid INTEGER,
    player TEXT,
    aid INTEGER,
    alliance TEXT,
    population INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(x, y)
  );
  
  -- User's village data (from scraping)
  CREATE TABLE user_villages (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    village_id TEXT NOT NULL,
    village_name TEXT,
    x INTEGER,
    y INTEGER,
    population INTEGER,
    resources TEXT,
    production TEXT,
    buildings TEXT,
    troops TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Game events and recommendations
  CREATE TABLE game_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE
  );
  
  -- AI recommendations
  CREATE TABLE recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority INTEGER,
    action_type TEXT,
    action_data TEXT,
    completed BOOLEAN DEFAULT FALSE,
    result TEXT
  );
  
  -- Static game data tables
  CREATE TABLE buildings (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    max_level INTEGER,
    requirements TEXT,
    costs TEXT,
    benefits TEXT,
    tribe_specific BOOLEAN DEFAULT FALSE
  );
  
  CREATE TABLE troops (
    id TEXT PRIMARY KEY,
    tribe TEXT,
    name TEXT,
    type TEXT,
    attack INTEGER,
    defense_infantry INTEGER,
    defense_cavalry INTEGER,
    speed INTEGER,
    capacity INTEGER,
    consumption INTEGER,
    training_time INTEGER,
    costs TEXT
  );
  
  CREATE TABLE quests (
    id TEXT PRIMARY KEY,
    category TEXT,
    name TEXT,
    requirements TEXT,
    rewards TEXT,
    order_index INTEGER
  );
  
  -- Settlement tracking for V2 focus
  CREATE TABLE settlement_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    cp_current INTEGER DEFAULT 0,
    cp_production INTEGER DEFAULT 0,
    settlers_count INTEGER DEFAULT 0,
    resources_hourly TEXT,
    estimated_settlement_time TIMESTAMP,
    phase TEXT DEFAULT 'FOUNDATION',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Database schema created');

// Load default game data
console.log('📥 Loading default game data...');

const buildingStmt = db.prepare(`
  INSERT OR REPLACE INTO buildings (id, name, category, max_level, requirements, costs, benefits, tribe_specific)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Resource fields
const resourceFields = [
  { id: 'woodcutter', name: 'Woodcutter', category: 'resource', maxLevel: 20 },
  { id: 'clay_pit', name: 'Clay Pit', category: 'resource', maxLevel: 20 },
  { id: 'iron_mine', name: 'Iron Mine', category: 'resource', maxLevel: 20 },
  { id: 'cropland', name: 'Cropland', category: 'resource', maxLevel: 20 }
];

// Infrastructure buildings
const infrastructureBuildings = [
  { id: 'main_building', name: 'Main Building', category: 'infrastructure', maxLevel: 20 },
  { id: 'warehouse', name: 'Warehouse', category: 'infrastructure', maxLevel: 20 },
  { id: 'granary', name: 'Granary', category: 'infrastructure', maxLevel: 20 },
  { id: 'cranny', name: 'Cranny', category: 'infrastructure', maxLevel: 10 },
  { id: 'residence', name: 'Residence', category: 'infrastructure', maxLevel: 20 },
  { id: 'palace', name: 'Palace', category: 'infrastructure', maxLevel: 20 },
  { id: 'academy', name: 'Academy', category: 'military', maxLevel: 20 },
  { id: 'smithy', name: 'Smithy', category: 'military', maxLevel: 20 },
  { id: 'marketplace', name: 'Marketplace', category: 'infrastructure', maxLevel: 20 },
  { id: 'embassy', name: 'Embassy', category: 'infrastructure', maxLevel: 20 },
  { id: 'barracks', name: 'Barracks', category: 'military', maxLevel: 20 },
  { id: 'stable', name: 'Stable', category: 'military', maxLevel: 20 },
  { id: 'workshop', name: 'Workshop', category: 'military', maxLevel: 20 },
  { id: 'town_hall', name: 'Town Hall', category: 'infrastructure', maxLevel: 20 }
];

// Insert all buildings
[...resourceFields, ...infrastructureBuildings].forEach(building => {
  buildingStmt.run(
    building.id,
    building.name,
    building.category,
    building.maxLevel,
    '{}',
    '{}',
    '{}',
    0
  );
});

console.log(`✅ Loaded ${resourceFields.length + infrastructureBuildings.length} buildings`);

// Load Egyptian troops as default
const troopStmt = db.prepare(`
  INSERT OR REPLACE INTO troops (id, tribe, name, type, attack, defense_infantry, defense_cavalry, speed, capacity, consumption, training_time, costs)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const egyptianTroops = [
  { id: 'slave_militia', name: 'Slave Militia', type: 'infantry', attack: 10, defInf: 30, defCav: 20, speed: 7, capacity: 20, consumption: 1, time: 160 },
  { id: 'ash_warden', name: 'Ash Warden', type: 'infantry', attack: 30, defInf: 55, defCav: 40, speed: 6, capacity: 45, consumption: 1, time: 260 },
  { id: 'khopesh_warrior', name: 'Khopesh Warrior', type: 'infantry', attack: 65, defInf: 50, defCav: 20, speed: 7, capacity: 50, consumption: 1, time: 340 },
  { id: 'sopdu_explorer', name: 'Sopdu Explorer', type: 'cavalry', attack: 0, defInf: 20, defCav: 10, speed: 16, capacity: 0, consumption: 2, time: 420 },
  { id: 'anhur_guard', name: 'Anhur Guard', type: 'cavalry', attack: 50, defInf: 65, defCav: 35, speed: 10, capacity: 110, consumption: 2, time: 660 },
  { id: 'resheph_chariot', name: 'Resheph Chariot', type: 'cavalry', attack: 110, defInf: 80, defCav: 40, speed: 10, capacity: 80, consumption: 3, time: 900 },
  { id: 'ram', name: 'Ram', type: 'siege', attack: 30, defInf: 80, defCav: 50, speed: 4, capacity: 0, consumption: 3, time: 4200 },
  { id: 'catapult', name: 'Stone Catapult', type: 'siege', attack: 50, defInf: 100, defCav: 110, speed: 3, capacity: 0, consumption: 6, time: 5400 },
  { id: 'nomarch', name: 'Nomarch', type: 'chief', attack: 40, defInf: 50, defCav: 50, speed: 4, capacity: 0, consumption: 5, time: 24000 },
  { id: 'settler', name: 'Settler', type: 'settler', attack: 10, defInf: 40, defCav: 30, speed: 5, capacity: 3000, consumption: 1, time: 5300 }
];

egyptianTroops.forEach(troop => {
  troopStmt.run(
    troop.id,
    'egyptian',
    troop.name,
    troop.type,
    troop.attack,
    troop.defInf,
    troop.defCav,
    troop.speed,
    troop.capacity,
    troop.consumption,
    troop.time,
    '{}'
  );
});

console.log(`✅ Loaded ${egyptianTroops.length} Egyptian troops`);

// Create indices for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_villages_coords ON villages(x, y);
  CREATE INDEX IF NOT EXISTS idx_user_villages_account ON user_villages(account_id);
  CREATE INDEX IF NOT EXISTS idx_recommendations_active ON recommendations(completed, priority);
  CREATE INDEX IF NOT EXISTS idx_settlement_account ON settlement_tracking(account_id);
`);

console.log('✅ Created database indices');

// Close database
db.close();

console.log('');
console.log('🎉 Database initialization complete!');
console.log(`📁 Database location: ${DB_PATH}`);
console.log('');
console.log('Next steps:');
console.log('1. Run "npm start" to start the server');
console.log('2. Visit http://localhost:3000 to verify');
