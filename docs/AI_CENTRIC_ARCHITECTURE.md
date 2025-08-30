# Simplified Data Architecture for AI-Centric System
*Updated: August 30, 2025*

## Core Principle: Claude is the Brain

The AI agent handles ALL calculations, optimizations, and decision-making. We just provide raw data.

## Simplified Data Flow

```
1. Static Game Data (SQLite tables) → Claude reads when needed
2. Dynamic Game State (from browser) → Claude analyzes in real-time  
3. Claude's Recommendations → Display in existing extension
```

## What Changes from Previous Plan

### ❌ NO LONGER NEEDED:
- Complex TypeScript data access layer
- Calculation functions (ROI, build time, etc.)
- Caching mechanisms
- Multiple API endpoints
- Separate recommendation engine
- JSON file management

### ✅ WHAT WE KEEP (Simplified):
- Puppeteer extraction on Replit
- SQLite database for ALL data (both static and dynamic)
- Simple SQL queries for Claude

## SQLite Database Structure

```sql
-- Static game mechanics data (populated by Puppeteer extraction)
CREATE TABLE IF NOT EXISTS game_data_buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_version TEXT NOT NULL,  -- 'T4'
  server_speed INTEGER NOT NULL, -- 1 or 2
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
  UNIQUE(server_version, server_speed, building_name, level)
);

CREATE TABLE IF NOT EXISTS game_data_troops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_version TEXT NOT NULL,
  server_speed INTEGER NOT NULL,
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
  wood_cost INTEGER DEFAULT 0,
  clay_cost INTEGER DEFAULT 0,
  iron_cost INTEGER DEFAULT 0,
  crop_cost INTEGER DEFAULT 0,
  training_building TEXT,
  UNIQUE(server_version, server_speed, tribe, unit_name)
);

CREATE TABLE IF NOT EXISTS game_data_mechanics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_version TEXT NOT NULL,
  server_speed INTEGER NOT NULL,
  mechanic_type TEXT NOT NULL, -- 'culture_points', 'celebration', 'oasis', etc.
  mechanic_key TEXT NOT NULL,
  mechanic_value TEXT NOT NULL, -- JSON string for complex values
  description TEXT,
  UNIQUE(server_version, server_speed, mechanic_type, mechanic_key)
);

-- Index for fast lookups
CREATE INDEX idx_buildings_lookup ON game_data_buildings(server_version, server_speed, building_name, level);
CREATE INDEX idx_troops_lookup ON game_data_troops(server_version, server_speed, tribe, unit_name);
CREATE INDEX idx_mechanics_lookup ON game_data_mechanics(server_version, server_speed, mechanic_type);
```

## Puppeteer Data Extraction to SQLite

```javascript
// /scripts/extract-to-sqlite.js
const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../backend/travian.db'));

async function extractAndStore(browser, serverConfig) {
  const page = await browser.newPage();
  await page.goto(serverConfig.url, { waitUntil: 'networkidle2' });
  
  // Extract building data
  const buildings = await page.evaluate(() => {
    // Get data from Kirilloid's JavaScript variables
    return window.buildings || [];
  });
  
  // Insert into SQLite
  const insertBuilding = db.prepare(`
    INSERT OR REPLACE INTO game_data_buildings 
    (server_version, server_speed, building_name, level, 
     wood_cost, clay_cost, iron_cost, crop_cost, 
     time_seconds, population, culture_points, effect_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const building of buildings) {
    for (const level of building.levels) {
      insertBuilding.run(
        serverConfig.version,
        serverConfig.speed,
        building.name,
        level.level,
        level.costs.wood,
        level.costs.clay,
        level.costs.iron,
        level.costs.crop,
        level.time,
        level.population,
        level.culture_points,
        level.effect
      );
    }
  }
  
  console.log(`✓ Stored ${buildings.length} buildings for ${serverConfig.name}`);
}
```

## Simple Data Access for Claude

```javascript
// /backend/game-data-service.js
const Database = require('better-sqlite3');
const db = new Database('./travian.db');

// Simple queries - no calculations, just data retrieval
const queries = {
  getBuilding: db.prepare(`
    SELECT * FROM game_data_buildings 
    WHERE server_version = ? AND server_speed = ? 
    AND building_name = ? AND level = ?
  `),
  
  getTroop: db.prepare(`
    SELECT * FROM game_data_troops
    WHERE server_version = ? AND server_speed = ?
    AND tribe = ? AND unit_name = ?
  `),
  
  getMechanic: db.prepare(`
    SELECT mechanic_value FROM game_data_mechanics
    WHERE server_version = ? AND server_speed = ?
    AND mechanic_type = ? AND mechanic_key = ?
  `)
};

// API endpoint for Claude
app.get('/api/game-data/query', (req, res) => {
  const { type, ...params } = req.query;
  
  if (type === 'building') {
    const data = queries.getBuilding.get(
      params.server || 'T4',
      params.speed || 2,
      params.building,
      params.level
    );
    res.json(data);
  }
  // Similar for troops and mechanics
});
```

## Integration with Existing AI Agent

```javascript
// In your existing AI agent extension
async function enhanceClaudeContext(gameState) {
  // Claude can query the database directly through prompts
  const enhancedPrompt = {
    systemContext: `You are a Travian strategy expert with access to a SQLite database 
                    containing exact game mechanics. You can query:
                    - game_data_buildings: all building costs, times, effects
                    - game_data_troops: all unit stats and costs
                    - game_data_mechanics: culture points, celebrations, etc.
                    
                    Current server: T4 ${gameState.serverSpeed}x speed`,
    
    currentState: gameState,
    
    instructions: `Analyze this game state. Query the database for:
                   1. Building upgrade costs and times
                   2. Calculate ROI for each possible upgrade
                   3. Consider resource balance and production rates
                   4. Account for culture point accumulation
                   5. Provide specific, actionable recommendations`,
    
    databaseAccess: {
      connectionString: "sqlite://travian.db",
      availableTables: ["game_data_buildings", "game_data_troops", "game_data_mechanics"],
      exampleQueries: [
        "SELECT * FROM game_data_buildings WHERE building_name='main_building' AND level=6",
        "SELECT * FROM game_data_troops WHERE tribe='romans' AND unit_name='legionnaire'"
      ]
    }
  };
  
  // Send to Claude
  const recommendations = await callClaude(enhancedPrompt);
  
  // Display in existing extension UI
  displayRecommendations(recommendations);
}
```

## What This Means for Implementation

### Advantages of SQLite over JSON:
1. **Already integrated** - We have SQLite setup and working
2. **Efficient queries** - Indexed lookups are instant
3. **Single source of truth** - All data in one database
4. **Easier updates** - Can update individual records without rewriting files
5. **Better for Claude** - Can teach Claude SQL queries for complex analysis

### Implementation Steps (2.5 hours total):
1. **Create tables** for game data (15 min)
2. **Extract with Puppeteer** and insert to SQLite (1 hour)
3. **Add simple query endpoints** (30 min)
4. **Test with Claude** (30 min)
5. **Integrate with existing agent** (15 min)

## Example Claude Analysis Using SQLite

```sql
-- Claude can run queries like:
SELECT 
  building_name,
  level,
  (wood_cost + clay_cost + iron_cost + crop_cost) as total_cost,
  time_seconds,
  effect_value,
  ROUND(total_cost / (effect_value * 24.0), 2) as roi_hours
FROM game_data_buildings
WHERE 
  server_version = 'T4' AND 
  server_speed = 2 AND
  building_name IN (
    SELECT DISTINCT building_name 
    FROM current_village_buildings 
    WHERE level < max_level
  )
ORDER BY roi_hours ASC
LIMIT 5;
```

Claude's response:
```markdown
## Optimal Build Queue Analysis

Based on database analysis of T4 2x mechanics:

### Next 3 Upgrades (Best ROI)
1. **Cropland #7 → Level 3**
   - Total cost: 275 resources
   - Time: 8 minutes (520 seconds with MB bonus)
   - ROI: 2.3 hours
   - SQL verified: `SELECT * FROM game_data_buildings WHERE building_name='cropland' AND level=3`

2. **Woodcutter #1 → Level 4**
   - Total cost: 385 resources
   - Time: 14 minutes
   - ROI: 3.1 hours
   
[Claude continues with strategic analysis...]
```

## Benefits of SQLite + AI Approach

1. **Unified Storage**: Dynamic game data + static mechanics in one DB
2. **Claude's SQL Power**: Can write complex queries for analysis
3. **Performance**: Indexed queries < 1ms
4. **Maintainability**: Standard SQL, easy to update
5. **Flexibility**: Claude can discover patterns we didn't anticipate

## Migration from Current Schema

```sql
-- Our existing tables (keep these):
-- villages, resources, production, buildings, troops

-- Add new tables for static game data:
-- game_data_buildings, game_data_troops, game_data_mechanics

-- Claude queries both:
-- Dynamic data: SELECT * FROM villages WHERE ...
-- Static data: SELECT * FROM game_data_buildings WHERE ...
```

## Next Steps

1. **Create game_data tables** in existing SQLite database (15 min)
2. **Set up Puppeteer on Replit** with chromium (30 min)
3. **Extract and insert** T4 1x and 2x data (1 hour)
4. **Test queries** to verify data integrity (15 min)
5. **Give Claude access** to query the database (30 min)

**Total: ~2.5 hours**

---

*This approach leverages our existing SQLite infrastructure while keeping Claude as the intelligence layer. No complex calculations in code - just data storage and Claude's analytical power.*