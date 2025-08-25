#!/usr/bin/env node

/**
 * Travian Game Data Inspector
 * Run this on your local machine while logged into Travian
 * It will inspect game pages and output data structure for database design
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const GAME_URL = 'https://lusobr.x2.lusobrasileiro.travian.com';
const OUTPUT_FILE = path.join(__dirname, 'travian-data-analysis.json');

// Pages to inspect for essential data
const ESSENTIAL_PAGES = [
  { url: '/village/statistics', name: 'Village Overview', category: 'essential' },
  { url: '/production.php', name: 'Resource Production', category: 'essential' },
  { url: '/build.php', name: 'Village Buildings', category: 'essential' },
  { url: '/build.php?id=39', name: 'Rally Point (Troops)', category: 'essential' },
  { url: '/build.php?id=16', name: 'Rally Point (Movements)', category: 'essential' }
];

// Pages for supportive data
const SUPPORTIVE_PAGES = [
  { url: '/karte.php', name: 'Map', category: 'supportive' },
  { url: '/build.php?id=17', name: 'Marketplace', category: 'supportive' },
  { url: '/statistics.php', name: 'Player Statistics', category: 'supportive' },
  { url: '/alliance.php', name: 'Alliance Info', category: 'supportive' }
];

/**
 * Inspection functions to run in browser context
 */
const inspectionScript = `
  function inspectPage() {
    const result = {
      url: window.location.pathname + window.location.search,
      timestamp: new Date().toISOString(),
      tables: [],
      dataElements: {},
      forms: [],
      ajaxEndpoints: []
    };
    
    // Inspect all tables
    document.querySelectorAll('table').forEach((table, index) => {
      const tableInfo = {
        index: index,
        id: table.id || null,
        className: table.className || null,
        headers: [],
        sampleRow: [],
        rowCount: table.querySelectorAll('tbody tr').length
      };
      
      // Get headers
      const headers = table.querySelectorAll('thead th, thead td');
      if (headers.length === 0) {
        // Try first row as headers
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          firstRow.querySelectorAll('th, td').forEach(cell => {
            tableInfo.headers.push(cell.textContent.trim());
          });
        }
      } else {
        headers.forEach(h => tableInfo.headers.push(h.textContent.trim()));
      }
      
      // Get sample data row
      const dataRow = table.querySelector('tbody tr') || table.querySelectorAll('tr')[1];
      if (dataRow) {
        dataRow.querySelectorAll('td').forEach(cell => {
          tableInfo.sampleRow.push({
            text: cell.textContent.trim(),
            html: cell.innerHTML.substring(0, 200),
            classes: cell.className
          });
        });
      }
      
      result.tables.push(tableInfo);
    });
    
    // Inspect specific data elements
    const selectors = {
      // Resources
      wood: '#l1',
      clay: '#l2', 
      iron: '#l3',
      crop: '#l4',
      warehouseCapacity: '.warehouse .capacity',
      granaryCapacity: '.granary .capacity',
      
      // Village info
      villageName: '#villageNameField',
      villageList: '.villageList',
      coordinates: '.coordinatesWrapper',
      population: '.population',
      
      // Culture/Loyalty
      culturePoints: '.culture_points',
      loyalty: '.loyalty',
      
      // Troops
      troopTable: '.troop_details',
      movements: '.in_attack, .in_raid',
      
      // Buildings
      buildingList: '.buildingSlot',
      constructionQueue: '.buildQueue'
    };
    
    for (const [key, selector] of Object.entries(selectors)) {
      const element = document.querySelector(selector);
      if (element) {
        result.dataElements[key] = {
          found: true,
          text: element.textContent.trim(),
          html: element.innerHTML.substring(0, 200),
          selector: selector
        };
      } else {
        result.dataElements[key] = {
          found: false,
          selector: selector
        };
      }
    }
    
    // Find all forms (for understanding game actions)
    document.querySelectorAll('form').forEach(form => {
      result.forms.push({
        action: form.action,
        method: form.method,
        id: form.id,
        className: form.className,
        inputCount: form.querySelectorAll('input').length
      });
    });
    
    // Check for AJAX endpoints in scripts
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.textContent);
    const ajaxPatterns = [
      /fetch\\(['"]([^'"]+)['"]/g,
      /\\.ajax\\(.*url:\\s*['"]([^'"]+)['"]/g,
      /XMLHttpRequest.*open\\(.*['"]([^'"]+)['"]/g
    ];
    
    scripts.forEach(script => {
      if (script) {
        ajaxPatterns.forEach(pattern => {
          const matches = script.matchAll(pattern);
          for (const match of matches) {
            if (match[1] && !result.ajaxEndpoints.includes(match[1])) {
              result.ajaxEndpoints.push(match[1]);
            }
          }
        });
      }
    });
    
    return result;
  }
  
  inspectPage();
`;

/**
 * Manual inspection instructions
 */
function generateManualInstructions() {
  console.log(`
==============================================
MANUAL INSPECTION INSTRUCTIONS
==============================================

Since we need you to be logged into your Travian account,
please run these commands manually in Chrome DevTools:

1. Open Chrome and log into Travian
2. Press F12 to open DevTools
3. Go to Console tab
4. Navigate to each page and run this code:

----------------------------------------
${inspectionScript}
----------------------------------------

5. Copy the output and save to a file
6. Repeat for each important page:
   - /village/statistics (Village Overview)
   - /production.php (Resources)
   - /build.php (Buildings)
   - /build.php?id=39 (Rally Point)
   
7. Send the results back for analysis

==============================================
  `);
}

/**
 * Generate SQL schema based on discovered data
 */
function generateSchema(analysisData) {
  let schema = `-- TravianAssistant Complete Database Schema
-- Generated: ${new Date().toISOString()}
-- Based on game inspection data

-- ============================================
-- ESSENTIAL TABLES (Core Gameplay)
-- ============================================

-- Player's account information
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  server_url TEXT NOT NULL,
  player_name TEXT,
  tribe TEXT CHECK(tribe IN ('Romans', 'Teutons', 'Gauls', 'Egyptians', 'Huns')),
  alliance_id INTEGER,
  population_rank INTEGER,
  alliance_rank INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Villages owned by the player
CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  population INTEGER DEFAULT 0,
  is_capital BOOLEAN DEFAULT FALSE,
  culture_points INTEGER DEFAULT 0,
  loyalty INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  UNIQUE(account_id, x, y)
);

-- Current resource levels
CREATE TABLE IF NOT EXISTS resources (
  village_id TEXT PRIMARY KEY,
  wood INTEGER DEFAULT 0,
  clay INTEGER DEFAULT 0,
  iron INTEGER DEFAULT 0,
  crop INTEGER DEFAULT 0,
  warehouse_capacity INTEGER DEFAULT 0,
  granary_capacity INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- Resource production rates
CREATE TABLE IF NOT EXISTS production (
  village_id TEXT PRIMARY KEY,
  wood_per_hour INTEGER DEFAULT 0,
  clay_per_hour INTEGER DEFAULT 0,
  iron_per_hour INTEGER DEFAULT 0,
  crop_per_hour INTEGER DEFAULT 0,
  crop_consumption INTEGER DEFAULT 0,
  net_crop INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- Buildings in each village
CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  slot_id INTEGER NOT NULL CHECK(slot_id BETWEEN 1 AND 40),
  building_type TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  is_upgrading BOOLEAN DEFAULT FALSE,
  upgrade_finish_time TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id),
  UNIQUE(village_id, slot_id)
);

-- Troops in villages
CREATE TABLE IF NOT EXISTS troops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  in_village INTEGER DEFAULT 0,
  in_training INTEGER DEFAULT 0,
  in_transit INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id),
  UNIQUE(village_id, unit_type)
);

-- Troop movements
CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_village_id TEXT,
  to_x INTEGER NOT NULL,
  to_y INTEGER NOT NULL,
  movement_type TEXT CHECK(movement_type IN ('attack', 'raid', 'reinforce', 'trade', 'return')),
  arrival_time TIMESTAMP NOT NULL,
  troop_data JSON,
  resources_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_village_id) REFERENCES villages(id)
);

-- ============================================
-- SUPPORTIVE TABLES (Strategic Information)
-- ============================================

-- Other players' villages from map scanning
CREATE TABLE IF NOT EXISTS map_villages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  village_name TEXT,
  player_name TEXT,
  player_id INTEGER,
  alliance_name TEXT,
  population INTEGER,
  tribe TEXT,
  last_scanned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y)
);

-- Oases near villages
CREATE TABLE IF NOT EXISTS oases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  type TEXT,
  bonus_type TEXT,
  bonus_percentage INTEGER,
  occupied_by TEXT,
  animals JSON,
  last_scanned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y)
);

-- Market prices and trades
CREATE TABLE IF NOT EXISTS market_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT,
  offer_type TEXT CHECK(offer_type IN ('buy', 'sell')),
  offering_resource TEXT,
  offering_amount INTEGER,
  seeking_resource TEXT,
  seeking_amount INTEGER,
  ratio REAL,
  merchant_count INTEGER,
  max_delivery_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- Hero information
CREATE TABLE IF NOT EXISTS hero (
  account_id TEXT PRIMARY KEY,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  health_percentage INTEGER DEFAULT 100,
  attack_bonus INTEGER DEFAULT 0,
  defense_bonus INTEGER DEFAULT 0,
  resources_bonus INTEGER DEFAULT 0,
  current_village_id TEXT,
  is_traveling BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (current_village_id) REFERENCES villages(id)
);

-- Alliance information
CREATE TABLE IF NOT EXISTS alliance_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alliance_id INTEGER,
  player_name TEXT,
  population INTEGER,
  village_count INTEGER,
  rank INTEGER,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ANALYSIS TABLES (Calculated/Derived Data)
-- ============================================

-- Historical snapshots for trend analysis
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  population INTEGER,
  resources JSON,
  production JSON,
  troops JSON,
  buildings JSON,
  FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- Strategic targets identified
CREATE TABLE IF NOT EXISTS targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  target_type TEXT CHECK(target_type IN ('farm', 'conquer', 'chief', 'raid')),
  priority INTEGER,
  estimated_resources INTEGER,
  estimated_defense INTEGER,
  distance REAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y)
);

-- Farming list
CREATE TABLE IF NOT EXISTS farm_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id INTEGER,
  village_id TEXT,
  last_attack TIMESTAMP,
  attack_interval INTEGER, -- minutes
  average_haul INTEGER,
  losses_acceptable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (target_id) REFERENCES targets(id),
  FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_villages_account ON villages(account_id);
CREATE INDEX idx_villages_coords ON villages(x, y);
CREATE INDEX idx_movements_arrival ON movements(arrival_time);
CREATE INDEX idx_map_villages_coords ON map_villages(x, y);
CREATE INDEX idx_map_villages_player ON map_villages(player_name);
CREATE INDEX idx_snapshots_village_time ON snapshots(village_id, timestamp);
CREATE INDEX idx_targets_priority ON targets(priority DESC);
`;

  return schema;
}

// Main execution
if (require.main === module) {
  console.log('Travian Data Inspector');
  console.log('======================');
  console.log('');
  console.log('This tool needs to be run manually in the browser.');
  console.log('');
  
  generateManualInstructions();
  
  // Generate initial schema
  const schema = generateSchema({});
  
  // Save schema to file
  fs.writeFileSync(
    path.join(__dirname, 'travian-schema.sql'),
    schema,
    'utf8'
  );
  
  console.log('');
  console.log('Initial schema saved to: travian-schema.sql');
  console.log('');
  console.log('After you collect the inspection data, we can refine the schema');
  console.log('to match the exact data structure of the game.');
}

module.exports = {
  inspectionScript,
  generateSchema
};
