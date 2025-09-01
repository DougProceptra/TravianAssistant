#!/usr/bin/env node

/**
 * CRITICAL: Import All Extracted Game Data into Backend Database
 * This connects all the Kirilloid data we extracted to the backend server
 * Run this BEFORE testing tomorrow!
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🚀 IMPORTING GAME MECHANICS DATA INTO BACKEND');
console.log('=' .repeat(60));

// Database connection
const dbPath = path.join(__dirname, '..', 'travian.db');
console.log(`📁 Database: ${dbPath}`);
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
console.log('\n📊 Creating game data tables...');
db.exec(`
  -- Buildings data table
  CREATE TABLE IF NOT EXISTS game_data_buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_version TEXT DEFAULT 'T4.6',
    server_speed INTEGER DEFAULT 1,
    building_name TEXT NOT NULL,
    building_id INTEGER,
    level INTEGER NOT NULL,
    wood_cost INTEGER,
    clay_cost INTEGER,
    iron_cost INTEGER,
    crop_cost INTEGER,
    time_seconds INTEGER,
    population INTEGER,
    culture_points INTEGER,
    effect_value REAL,
    effect_description TEXT,
    UNIQUE(server_version, server_speed, building_name, level)
  );

  -- Troops data table
  CREATE TABLE IF NOT EXISTS game_data_troops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_version TEXT DEFAULT 'T4.6',
    server_speed INTEGER DEFAULT 1,
    tribe TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    unit_id INTEGER,
    attack INTEGER,
    defense_infantry INTEGER,
    defense_cavalry INTEGER,
    speed_fields_per_hour INTEGER,
    carry_capacity INTEGER,
    upkeep_per_hour INTEGER,
    training_time_seconds INTEGER,
    wood_cost INTEGER,
    clay_cost INTEGER,
    iron_cost INTEGER,
    crop_cost INTEGER,
    UNIQUE(server_version, server_speed, tribe, unit_name)
  );

  -- Game mechanics table
  CREATE TABLE IF NOT EXISTS game_data_mechanics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_version TEXT DEFAULT 'T4.6',
    server_speed INTEGER DEFAULT 1,
    mechanic_type TEXT NOT NULL,
    mechanic_key TEXT NOT NULL,
    mechanic_value TEXT,
    data JSON,
    UNIQUE(server_version, server_speed, mechanic_type, mechanic_key)
  );
`);

// Clear existing data for fresh import
console.log('\n🗑️ Clearing old data...');
db.exec(`
  DELETE FROM game_data_buildings;
  DELETE FROM game_data_troops;
  DELETE FROM game_data_mechanics;
`);

// ==================== IMPORT BUILDINGS ====================
console.log('\n🏗️ Importing building data...');

try {
  // Try to load the complete buildings data
  const buildingFiles = [
    'data/buildings/travian_complete_buildings_data.json',
    'data/buildings/travian_buildings_SS1X.json',
    'data/buildings/travian_special_server_buildings.json'
  ];
  
  let buildingData = null;
  for (const file of buildingFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`  📂 Loading: ${file}`);
      buildingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      break;
    }
  }
  
  if (!buildingData) {
    console.error('❌ No building data files found!');
  } else {
    const buildStmt = db.prepare(`
      INSERT OR REPLACE INTO game_data_buildings (
        server_version, server_speed, building_name, building_id, level,
        wood_cost, clay_cost, iron_cost, crop_cost,
        time_seconds, population, culture_points, effect_value, effect_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let buildingCount = 0;
    
    // Handle different data formats
    if (buildingData.buildings) {
      // Format 1: { buildings: { buildingName: { levels: [...] } } }
      for (const [buildingName, buildingInfo] of Object.entries(buildingData.buildings)) {
        if (buildingInfo.levels && Array.isArray(buildingInfo.levels)) {
          for (const level of buildingInfo.levels) {
            buildStmt.run(
              'T4.6',
              1, // 1x speed for tomorrow's server
              buildingName,
              buildingInfo.id || null,
              level.level || 0,
              level.costs?.wood || 0,
              level.costs?.clay || 0,
              level.costs?.iron || 0,
              level.costs?.crop || 0,
              level.time || level.time_seconds || 0,
              level.population || level.pop || 0,
              level.culture_points || level.cp || 0,
              level.effect_value || null,
              level.effect_description || level.effect || null
            );
            buildingCount++;
          }
        }
      }
    } else if (Array.isArray(buildingData)) {
      // Format 2: Array of building objects
      for (const building of buildingData) {
        buildStmt.run(
          building.server_version || 'T4.6',
          building.server_speed || 1,
          building.building_name,
          building.building_id || null,
          building.level,
          building.wood_cost || 0,
          building.clay_cost || 0,
          building.iron_cost || 0,
          building.crop_cost || 0,
          building.time_seconds || 0,
          building.population || 0,
          building.culture_points || 0,
          building.effect_value || null,
          building.effect_description || null
        );
        buildingCount++;
      }
    }
    
    console.log(`  ✅ Imported ${buildingCount} building levels`);
  }
} catch (error) {
  console.error('❌ Error importing buildings:', error.message);
}

// ==================== IMPORT TROOPS ====================
console.log('\n⚔️ Importing troop data...');

try {
  // Load troops data
  const troopFile = path.join(__dirname, '..', 'data', 'troops-complete-t46.js');
  let troopData = null;
  
  if (fs.existsSync(troopFile)) {
    console.log(`  📂 Loading: troops-complete-t46.js`);
    // Since it's a .js file, we need to handle it differently
    const troopContent = fs.readFileSync(troopFile, 'utf8');
    // Extract the data from the JS file
    const match = troopContent.match(/const\s+TROOPS_DATA\s*=\s*(\{[\s\S]*\});/);
    if (match) {
      troopData = eval('(' + match[1] + ')');
    }
  }
  
  // Also check for JSON troops data
  const troopJsonPath = path.join(__dirname, '..', 'data', 'troops', 'complete-troops.json');
  if (!troopData && fs.existsSync(troopJsonPath)) {
    troopData = JSON.parse(fs.readFileSync(troopJsonPath, 'utf8'));
  }
  
  if (troopData) {
    const troopStmt = db.prepare(`
      INSERT OR REPLACE INTO game_data_troops (
        server_version, server_speed, tribe, unit_name, unit_id,
        attack, defense_infantry, defense_cavalry,
        speed_fields_per_hour, carry_capacity, upkeep_per_hour,
        training_time_seconds, wood_cost, clay_cost, iron_cost, crop_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let troopCount = 0;
    
    // Handle different data formats
    for (const [tribe, units] of Object.entries(troopData)) {
      if (typeof units === 'object') {
        for (const [unitName, unitData] of Object.entries(units)) {
          if (unitData && typeof unitData === 'object') {
            troopStmt.run(
              'T4.6',
              1,
              tribe,
              unitName,
              unitData.id || null,
              unitData.attack || 0,
              unitData.defense_infantry || unitData.def_i || 0,
              unitData.defense_cavalry || unitData.def_c || 0,
              unitData.speed || 0,
              unitData.carry || unitData.carry_capacity || 0,
              unitData.upkeep || 0,
              unitData.training_time || unitData.time || 0,
              unitData.wood || unitData.costs?.wood || 0,
              unitData.clay || unitData.costs?.clay || 0,
              unitData.iron || unitData.costs?.iron || 0,
              unitData.crop || unitData.costs?.crop || 0
            );
            troopCount++;
          }
        }
      }
    }
    
    console.log(`  ✅ Imported ${troopCount} troop types`);
  } else {
    console.error('❌ No troop data found!');
  }
} catch (error) {
  console.error('❌ Error importing troops:', error.message);
}

// ==================== ADD CRITICAL GAME MECHANICS ====================
console.log('\n🎮 Adding game mechanics...');

const mechanicsStmt = db.prepare(`
  INSERT OR REPLACE INTO game_data_mechanics (
    server_version, server_speed, mechanic_type, mechanic_key, mechanic_value
  ) VALUES (?, ?, ?, ?, ?)
`);

// Culture points for settlements
const culturePoints = {
  'village_2': '500',
  'village_3': '1000',
  'village_4': '2000',
  'village_5': '3000',
  'village_6': '5000',
  'village_7': '8000',
  'village_8': '12000',
  'village_9': '18000',
  'village_10': '27000'
};

for (const [key, value] of Object.entries(culturePoints)) {
  mechanicsStmt.run('T4.6', 1, 'culture_points', key, value);
}

// Server speed modifiers
const speedModifiers = {
  '1x': '1.0',
  '2x': '0.5',
  '3x': '0.33',
  '5x': '0.2'
};

for (const [key, value] of Object.entries(speedModifiers)) {
  mechanicsStmt.run('T4.6', 1, 'speed_modifier', key, value);
}

console.log('  ✅ Added game mechanics');

// ==================== VALIDATE CRITICAL DATA ====================
console.log('\n🔍 Validating critical early game data...');

// Check Main Building Level 6 for T4 1x (should match validation requirements)
const validation = db.prepare(`
  SELECT * FROM game_data_buildings 
  WHERE building_name LIKE '%Main Building%' 
  AND level = 6 
  AND server_speed = 1
`).get();

if (validation) {
  console.log('\n  📊 Main Building Level 6 (T4 1x):');
  console.log(`     Wood: ${validation.wood_cost}`);
  console.log(`     Clay: ${validation.clay_cost}`);
  console.log(`     Iron: ${validation.iron_cost}`);
  console.log(`     Crop: ${validation.crop_cost}`);
  console.log(`     Time: ${validation.time_seconds} seconds`);
  
  // For 2x speed, costs are same but time is halved
  console.log('\n  📊 For 2x speed: Same costs, time = ' + Math.floor(validation.time_seconds / 2) + ' seconds');
} else {
  console.error('❌ WARNING: Could not validate Main Building data!');
}

// ==================== CREATE HELPER FUNCTIONS ====================
console.log('\n🔧 Creating helper functions in database...');

// Add a view for easy building queries
db.exec(`
  CREATE VIEW IF NOT EXISTS v_buildings_current AS
  SELECT * FROM game_data_buildings 
  WHERE server_version = 'T4.6' 
  AND server_speed = 1
  ORDER BY building_name, level;
`);

// Add a view for troops
db.exec(`
  CREATE VIEW IF NOT EXISTS v_troops_current AS
  SELECT * FROM game_data_troops
  WHERE server_version = 'T4.6'
  AND server_speed = 1
  ORDER BY tribe, unit_name;
`);

// ==================== FINAL STATISTICS ====================
const stats = {
  buildings: db.prepare('SELECT COUNT(*) as count FROM game_data_buildings').get().count,
  troops: db.prepare('SELECT COUNT(*) as count FROM game_data_troops').get().count,
  mechanics: db.prepare('SELECT COUNT(*) as count FROM game_data_mechanics').get().count
};

console.log('\n' + '=' .repeat(60));
console.log('✅ IMPORT COMPLETE!');
console.log('=' .repeat(60));
console.log(`📊 Database Statistics:`);
console.log(`   Buildings: ${stats.buildings} entries`);
console.log(`   Troops: ${stats.troops} entries`);
console.log(`   Mechanics: ${stats.mechanics} entries`);
console.log(`\n🎯 Ready for Europe 4 server testing tomorrow!`);

// Close database
db.close();

// ==================== INSTRUCTIONS ====================
console.log('\n📝 NEXT STEPS:');
console.log('1. Update backend/server.js to use this data');
console.log('2. Add API endpoints for querying game data');
console.log('3. Update AI prompts to reference precise values');
console.log('4. Test with: SELECT * FROM game_data_buildings WHERE building_name LIKE "%Main%" AND level = 1;');
