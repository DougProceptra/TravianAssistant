-- TravianAssistant Complete Database Schema
-- Generated: 2025-08-25T19:31:42.148Z

-- ============================================
-- ESSENTIAL TABLES (Core Gameplay)
-- ============================================

-- Player's account
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  server_url TEXT NOT NULL,
  player_name TEXT,
  tribe TEXT CHECK(tribe IN ('Romans', 'Teutons', 'Gauls', 'Egyptians', 'Huns')),
  alliance_id INTEGER,
  population_rank INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Villages owned by player
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

-- Current resources
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

-- Production rates
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

-- Buildings
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

-- Troops
CREATE TABLE IF NOT EXISTS troops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  in_village INTEGER DEFAULT 0,
  in_training INTEGER DEFAULT 0,
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
  FOREIGN KEY (from_village_id) REFERENCES villages(id)
);

-- ============================================
-- SUPPORTIVE TABLES (Strategic Information)
-- ============================================

-- Other players' villages (from map)
CREATE TABLE IF NOT EXISTS map_villages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  village_name TEXT,
  player_name TEXT,
  alliance_name TEXT,
  population INTEGER,
  last_scanned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y)
);

-- Oases
CREATE TABLE IF NOT EXISTS oases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  type TEXT,
  bonus_percentage INTEGER,
  occupied_by TEXT,
  last_scanned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(x, y)
);

-- Market offers
CREATE TABLE IF NOT EXISTS market_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT,
  offer_type TEXT CHECK(offer_type IN ('buy', 'sell')),
  offering_resource TEXT,
  offering_amount INTEGER,
  seeking_resource TEXT,
  seeking_amount INTEGER,
  ratio REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- Farming targets
CREATE TABLE IF NOT EXISTS farm_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  village_id TEXT,
  last_attack TIMESTAMP,
  average_haul INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (village_id) REFERENCES villages(id),
  UNIQUE(x, y, village_id)
);

-- Create indexes
CREATE INDEX idx_villages_account ON villages(account_id);
CREATE INDEX idx_villages_coords ON villages(x, y);
CREATE INDEX idx_movements_arrival ON movements(arrival_time);
CREATE INDEX idx_map_villages_coords ON map_villages(x, y);
