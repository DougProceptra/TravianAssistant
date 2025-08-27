-- TravianAssistant Database Schema V2
-- Based on actual game inspection

-- ============================================
-- CORE TABLES (What we can actually get)
-- ============================================

-- Villages (from /village/statistics)
CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  -- Population must be fetched per village, not from overview
  population INTEGER DEFAULT 0,
  -- Merchants shown in overview
  merchants_free INTEGER DEFAULT 0,
  merchants_total INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Resources (from stockBar on each village page)
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

-- Production (from /production.php per village)
CREATE TABLE IF NOT EXISTS production (
  village_id TEXT PRIMARY KEY,
  wood_per_hour INTEGER DEFAULT 0,
  clay_per_hour INTEGER DEFAULT 0,
  iron_per_hour INTEGER DEFAULT 0,
  crop_per_hour INTEGER DEFAULT 0,
  crop_consumption INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (village_id) REFERENCES villages(id)
);

-- Resource Fields (from /production.php)
CREATE TABLE IF NOT EXISTS resource_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 18),
  field_type TEXT NOT NULL, -- woodcutter, claypit, ironmine, cropland
  level INTEGER DEFAULT 0,
  FOREIGN KEY (village_id) REFERENCES villages(id),
  UNIQUE(village_id, position)
);

-- Buildings (from /build.php village center)
CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  slot_id INTEGER NOT NULL CHECK(slot_id BETWEEN 19 AND 40),
  building_type TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  FOREIGN KEY (village_id) REFERENCES villages(id),
  UNIQUE(village_id, slot_id)
);

-- Troops (from /build.php?id=39 rally point)
CREATE TABLE IF NOT EXISTS troops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  in_village INTEGER DEFAULT 0,
  FOREIGN KEY (village_id) REFERENCES villages(id),
  UNIQUE(village_id, unit_type)
);
