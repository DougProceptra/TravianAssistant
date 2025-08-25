#!/usr/bin/env node

/**
 * Travian Game Data Inspector V2
 * Based on actual game structure discovered
 */

const fs = require('fs');
const path = require('path');

console.log(`
==============================================
TRAVIAN DATA INSPECTOR V2
==============================================

Based on initial inspection, we found that /village/statistics
only shows village names, coordinates, and merchants.

We need to inspect OTHER pages for complete data:

==============================================
CRITICAL PAGES TO INSPECT
==============================================

1. PRODUCTION PAGE: /production.php
   - Should have resource fields and production rates
   
2. INDIVIDUAL VILLAGE: /build.php (while in a village)
   - Buildings and their levels
   
3. RALLY POINT: /build.php?id=39
   - Troop counts and movements
   
4. CURRENT VILLAGE RESOURCES: (any village page)
   - Check #stockBar for current resources

==============================================
ENHANCED INSPECTION CODE
==============================================
`);

const enhancedInspectionCode = `
// Enhanced Travian Data Inspector V2
(function() {
  const result = {
    url: window.location.pathname + window.location.search,
    timestamp: new Date().toISOString(),
    pageType: 'unknown',
    tables: [],
    resources: {},
    buildings: [],
    troops: [],
    dataElements: {}
  };
  
  // Determine page type
  if (window.location.pathname.includes('production')) {
    result.pageType = 'production';
  } else if (window.location.pathname.includes('build.php')) {
    if (window.location.search.includes('id=39')) {
      result.pageType = 'rally_point';
    } else if (window.location.search.includes('id=')) {
      result.pageType = 'building';
    } else {
      result.pageType = 'village_center';
    }
  } else if (window.location.pathname.includes('statistics')) {
    result.pageType = 'overview';
  }
  
  // Get current resources from stockBar (available on most pages)
  const stockBar = {
    wood: document.querySelector('#l1')?.textContent?.trim() || '0',
    clay: document.querySelector('#l2')?.textContent?.trim() || '0',
    iron: document.querySelector('#l3')?.textContent?.trim() || '0',
    crop: document.querySelector('#l4')?.textContent?.trim() || '0',
    cropConsumption: document.querySelector('.cropConsumption')?.textContent?.trim() || '0',
    warehouse: document.querySelector('.warehouse .capacity')?.textContent?.trim() || '0',
    granary: document.querySelector('.granary .capacity')?.textContent?.trim() || '0'
  };
  result.resources.current = stockBar;
  
  // Get production if on production page
  if (result.pageType === 'production') {
    const production = {};
    document.querySelectorAll('.production').forEach((elem, i) => {
      const resourceTypes = ['wood', 'clay', 'iron', 'crop'];
      if (resourceTypes[i]) {
        production[resourceTypes[i]] = elem.textContent?.trim() || '0';
      }
    });
    result.resources.production = production;
    
    // Get resource fields
    document.querySelectorAll('.resourceWrapper').forEach(wrapper => {
      const level = wrapper.querySelector('.level')?.textContent?.trim();
      const type = wrapper.className.match(/gid(\\d+)/)?.[1];
      if (level && type) {
        result.buildings.push({
          type: 'resource_field',
          gid: type,
          level: level
        });
      }
    });
  }
  
  // Get buildings if on village center
  if (result.pageType === 'village_center') {
    document.querySelectorAll('area[href*="build.php?id="]').forEach(area => {
      const buildingId = area.href.match(/id=(\\d+)/)?.[1];
      const title = area.title || area.alt || '';
      if (buildingId) {
        result.buildings.push({
          slot: buildingId,
          name: title
        });
      }
    });
    
    // Also check for building levels
    document.querySelectorAll('.building').forEach(building => {
      const level = building.querySelector('.level')?.textContent?.trim();
      const slot = building.className.match(/a(\\d+)/)?.[1];
      if (level && slot) {
        const existing = result.buildings.find(b => b.slot === slot);
        if (existing) {
          existing.level = level;
        }
      }
    });
  }
  
  // Get troops if on rally point
  if (result.pageType === 'rally_point') {
    document.querySelectorAll('.troop_details').forEach(detail => {
      const troopInfo = {
        type: detail.className,
        units: []
      };
      detail.querySelectorAll('.unit').forEach(unit => {
        const num = unit.textContent?.trim();
        const type = unit.className.match(/u(\\d+)/)?.[1];
        if (num && type) {
          troopInfo.units.push({ type: type, count: num });
        }
      });
      result.troops.push(troopInfo);
    });
  }
  
  // Get all tables (fallback for any page)
  document.querySelectorAll('table').forEach((table, index) => {
    if (table.id === 'btamhy' || table.id === 'bbwmbb') return; // Skip extension tables
    
    const tableInfo = {
      index: index,
      id: table.id || null,
      className: table.className || null,
      headers: [],
      sampleRows: [],
      rowCount: table.querySelectorAll('tbody tr').length
    };
    
    // Get headers
    const headers = table.querySelectorAll('thead th, thead td');
    headers.forEach(h => tableInfo.headers.push(h.textContent.trim()));
    
    // Get first 3 data rows as samples
    const rows = table.querySelectorAll('tbody tr');
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const rowData = [];
      rows[i].querySelectorAll('td').forEach(cell => {
        rowData.push(cell.textContent.trim());
      });
      tableInfo.sampleRows.push(rowData);
    }
    
    result.tables.push(tableInfo);
  });
  
  // Additional specific selectors to check
  const additionalSelectors = {
    villageName: '#villageNameField',
    population: '.inhabitants',
    culturePoints: '.culture_points',
    loyalty: '.loyalty',
    movements: '.troop_movements',
    heroStatus: '.heroStatus',
    allianceInfo: '.allianceInfo'
  };
  
  for (const [key, selector] of Object.entries(additionalSelectors)) {
    const element = document.querySelector(selector);
    result.dataElements[key] = element ? element.textContent.trim() : 'NOT FOUND';
  }
  
  console.log('=== TRAVIAN DATA STRUCTURE V2 ===');
  console.log('Page Type:', result.pageType);
  console.log(JSON.stringify(result, null, 2));
  return result;
})();
`;

console.log(enhancedInspectionCode);

console.log(`
==============================================

INSTRUCTIONS:
1. Copy the code above
2. Navigate to each of these pages in your game:
   - /production.php (Resources/Production)
   - /build.php (Village center)
   - /build.php?id=39 (Rally Point)
3. Run the inspection code on each page
4. Save the output from each page

This will give us the complete data structure!
==============================================
`);

// Update schema based on findings
const updatedSchema = `-- TravianAssistant Database Schema V2
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
`;

fs.writeFileSync(
  path.join(__dirname, '..', 'backend', 'travian-schema-v2.sql'),
  updatedSchema,
  'utf8'
);

console.log(`
Updated schema saved to: backend/travian-schema-v2.sql

Key findings from initial inspection:
- /village/statistics only has village names, coords, merchants
- Need to visit each village for resources/production
- Need /production.php for production rates
- Need /build.php for buildings
- Need rally point for troops
`);
