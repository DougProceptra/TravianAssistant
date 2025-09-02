#!/usr/bin/env node

/**
 * TravianAssistant Backend Server
 * Runs on Replit, manages game data, and coordinates with Chrome Extension
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces for Replit

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize SQLite database
const DB_PATH = process.env.DB_PATH || './travian.db';
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

console.log('🚀 TravianAssistant Backend Starting...');
console.log(`📁 Database: ${DB_PATH}`);

// Create tables if they don't exist
function initializeDatabase() {
  console.log('📊 Initializing database schema...');
  
  // Core game state tables
  db.exec(`
    -- Villages from map.sql
    CREATE TABLE IF NOT EXISTS villages (
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
    CREATE TABLE IF NOT EXISTS user_villages (
      id TEXT PRIMARY KEY, -- accountId_villageId
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
    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      data TEXT NOT NULL,
      processed BOOLEAN DEFAULT FALSE
    );

    -- AI recommendations
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      priority INTEGER,
      action_type TEXT,
      action_data TEXT,
      completed BOOLEAN DEFAULT FALSE,
      result TEXT
    );

    -- Static game data tables
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      max_level INTEGER,
      requirements TEXT,
      costs TEXT,
      benefits TEXT,
      tribe_specific BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS troops (
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

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      category TEXT,
      name TEXT,
      requirements TEXT,
      rewards TEXT,
      order_index INTEGER
    );
  `);
  
  console.log('✅ Database schema initialized');
}

// Load game data if not already loaded
async function loadGameData() {
  const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get().count;
  
  if (buildingCount === 0) {
    console.log('📥 Loading game data...');
    
    // Check if game data files exist
    const gameDataPath = path.join(__dirname, 'data', 'game-data.json');
    if (fs.existsSync(gameDataPath)) {
      const gameData = JSON.parse(fs.readFileSync(gameDataPath, 'utf8'));
      
      // Load buildings
      if (gameData.buildings) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO buildings (id, name, category, max_level, requirements, costs, benefits, tribe_specific)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const building of gameData.buildings) {
          stmt.run(
            building.id,
            building.name,
            building.category,
            building.maxLevel || 20,
            JSON.stringify(building.requirements || {}),
            JSON.stringify(building.costs || {}),
            JSON.stringify(building.benefits || {}),
            building.tribeSpecific ? 1 : 0
          );
        }
        console.log(`✅ Loaded ${gameData.buildings.length} buildings`);
      }
      
      // Load troops
      if (gameData.troops) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO troops (id, tribe, name, type, attack, defense_infantry, defense_cavalry, speed, capacity, consumption, training_time, costs)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const troop of gameData.troops) {
          stmt.run(
            troop.id,
            troop.tribe,
            troop.name,
            troop.type,
            troop.attack,
            troop.defenseInfantry,
            troop.defenseCavalry,
            troop.speed,
            troop.capacity,
            troop.consumption,
            troop.trainingTime,
            JSON.stringify(troop.costs || {})
          );
        }
        console.log(`✅ Loaded ${gameData.troops.length} troops`);
      }
      
      // Load quests
      if (gameData.quests) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO quests (id, category, name, requirements, rewards, order_index)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const quest of gameData.quests) {
          stmt.run(
            quest.id,
            quest.category,
            quest.name,
            JSON.stringify(quest.requirements || {}),
            JSON.stringify(quest.rewards || {}),
            quest.orderIndex || 0
          );
        }
        console.log(`✅ Loaded ${gameData.quests.length} quests`);
      }
    } else {
      console.log('⚠️ Game data file not found. Creating minimal default data...');
      
      // Insert minimal default data
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO buildings (id, name, category, max_level, requirements, costs, benefits, tribe_specific)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Basic resource fields
      stmt.run('woodcutter', 'Woodcutter', 'resource', 20, '{}', '{}', '{}', 0);
      stmt.run('clay_pit', 'Clay Pit', 'resource', 20, '{}', '{}', '{}', 0);
      stmt.run('iron_mine', 'Iron Mine', 'resource', 20, '{}', '{}', '{}', 0);
      stmt.run('cropland', 'Cropland', 'resource', 20, '{}', '{}', '{}', 0);
      
      console.log('✅ Created default building data');
    }
  } else {
    console.log(`✅ Game data already loaded (${buildingCount} buildings)`);
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db.open ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Root endpoint - show a nice landing page
app.get('/', (req, res) => {
  const stats = {
    villages: db.prepare('SELECT COUNT(*) as count FROM villages').get().count,
    userVillages: db.prepare('SELECT COUNT(*) as count FROM user_villages').get().count,
    buildings: db.prepare('SELECT COUNT(*) as count FROM buildings').get().count,
    troops: db.prepare('SELECT COUNT(*) as count FROM troops').get().count,
    recommendations: db.prepare('SELECT COUNT(*) as count FROM recommendations').get().count
  };
  
  // Send an HTML response for better visibility in Replit preview
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TravianAssistant Backend</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        h1 { color: #333; }
        .status { 
          background: #4CAF50; 
          color: white; 
          padding: 10px; 
          border-radius: 5px; 
          display: inline-block;
        }
        .stats {
          background: white;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .endpoint {
          background: #f0f0f0;
          padding: 5px 10px;
          margin: 5px 0;
          border-radius: 3px;
          font-family: monospace;
        }
        .instructions {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1>🏰 TravianAssistant Backend Server</h1>
      <div class="status">✅ Server is running!</div>
      
      <div class="stats">
        <h2>📊 Database Statistics</h2>
        <ul>
          <li>Villages (from map.sql): ${stats.villages}</li>
          <li>User Villages (scraped): ${stats.userVillages}</li>
          <li>Buildings loaded: ${stats.buildings}</li>
          <li>Troops loaded: ${stats.troops}</li>
          <li>AI Recommendations: ${stats.recommendations}</li>
        </ul>
      </div>
      
      <div class="stats">
        <h2>🔌 API Endpoints</h2>
        <div class="endpoint">GET /health</div>
        <div class="endpoint">GET /api/game-data</div>
        <div class="endpoint">POST /api/map</div>
        <div class="endpoint">POST /api/village</div>
        <div class="endpoint">GET /api/villages/:accountId</div>
        <div class="endpoint">POST /api/recommendation</div>
        <div class="endpoint">GET /api/recommendations</div>
      </div>
      
      <div class="instructions">
        <h3>📝 Next Steps:</h3>
        <ol>
          <li>Copy this Replit URL: <strong>${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'Check your Replit URL above'}</strong></li>
          <li>Update the Chrome extension's BACKEND_URL</li>
          <li>Visit a Travian page to start collecting data</li>
        </ol>
      </div>
      
      <div style="margin-top: 30px; color: #666;">
        <small>Version 3.0.0 | Uptime: ${Math.round(process.uptime())} seconds</small>
      </div>
    </body>
    </html>
  `);
});

// JSON API endpoint for compatibility
app.get('/api/status', (req, res) => {
  const stats = {
    villages: db.prepare('SELECT COUNT(*) as count FROM villages').get().count,
    userVillages: db.prepare('SELECT COUNT(*) as count FROM user_villages').get().count,
    buildings: db.prepare('SELECT COUNT(*) as count FROM buildings').get().count,
    troops: db.prepare('SELECT COUNT(*) as count FROM troops').get().count,
    recommendations: db.prepare('SELECT COUNT(*) as count FROM recommendations').get().count
  };
  
  res.json({
    message: 'TravianAssistant Backend Server',
    version: '3.0.0',
    status: 'operational',
    stats,
    endpoints: [
      'GET /health',
      'POST /api/map',
      'POST /api/village',
      'GET /api/villages/:accountId',
      'GET /api/game-data',
      'POST /api/recommendation',
      'GET /api/recommendations'
    ]
  });
});

// Import map.sql data
app.post('/api/map', (req, res) => {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'No SQL data provided' });
    }
    
    console.log('📍 Importing map.sql data...');
    
    // Parse and execute the SQL
    const statements = sql.split(';').filter(s => s.trim());
    let imported = 0;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO villages (x, y, tid, vid, village, uid, player, aid, alliance, population)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const statement of statements) {
      if (statement.includes('INSERT INTO')) {
        // Extract values from INSERT statement
        const match = statement.match(/VALUES\s*\((.*?)\)/);
        if (match) {
          const values = match[1].split(',').map(v => {
            v = v.trim();
            if (v === 'NULL') return null;
            if (v.startsWith("'") && v.endsWith("'")) {
              return v.slice(1, -1).replace(/''/g, "'");
            }
            return parseInt(v);
          });
          
          if (values.length >= 10) {
            stmt.run(...values.slice(0, 10));
            imported++;
          }
        }
      }
    }
    
    console.log(`✅ Imported ${imported} villages from map.sql`);
    res.json({ success: true, imported });
    
  } catch (error) {
    console.error('❌ Map import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save scraped village data
app.post('/api/village', (req, res) => {
  try {
    const { accountId, village } = req.body;
    
    if (!accountId || !village) {
      return res.status(400).json({ error: 'Missing accountId or village data' });
    }
    
    const id = `${accountId}_${village.id || 'unknown'}`;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_villages (
        id, account_id, village_id, village_name, x, y, population,
        resources, production, buildings, troops, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      id,
      accountId,
      village.id || 'unknown',
      village.name,
      village.coordinates?.x || 0,
      village.coordinates?.y || 0,
      village.population || 0,
      JSON.stringify(village.resources || {}),
      JSON.stringify(village.production || {}),
      JSON.stringify(village.buildings || []),
      JSON.stringify(village.troops || [])
    );
    
    console.log(`✅ Saved village data for ${village.name}`);
    res.json({ success: true, id });
    
  } catch (error) {
    console.error('❌ Village save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user villages
app.get('/api/villages/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    
    const villages = db.prepare(`
      SELECT * FROM user_villages 
      WHERE account_id = ? 
      ORDER BY last_updated DESC
    `).all(accountId);
    
    // Parse JSON fields
    const parsed = villages.map(v => ({
      ...v,
      resources: JSON.parse(v.resources || '{}'),
      production: JSON.parse(v.production || '{}'),
      buildings: JSON.parse(v.buildings || '[]'),
      troops: JSON.parse(v.troops || '[]')
    }));
    
    res.json({
      accountId,
      villages: parsed,
      count: parsed.length
    });
    
  } catch (error) {
    console.error('❌ Get villages error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get game data (buildings, troops, etc.)
app.get('/api/game-data', (req, res) => {
  try {
    const buildings = db.prepare('SELECT * FROM buildings').all().map(b => ({
      ...b,
      requirements: JSON.parse(b.requirements || '{}'),
      costs: JSON.parse(b.costs || '{}'),
      benefits: JSON.parse(b.benefits || '{}'),
      tribe_specific: b.tribe_specific === 1
    }));
    
    const troops = db.prepare('SELECT * FROM troops').all().map(t => ({
      ...t,
      costs: JSON.parse(t.costs || '{}')
    }));
    
    const quests = db.prepare('SELECT * FROM quests ORDER BY order_index').all().map(q => ({
      ...q,
      requirements: JSON.parse(q.requirements || '{}'),
      rewards: JSON.parse(q.rewards || '{}')
    }));
    
    res.json({
      buildings,
      troops,
      quests,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Get game data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save AI recommendation
app.post('/api/recommendation', (req, res) => {
  try {
    const { priority, actionType, actionData } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO recommendations (priority, action_type, action_data)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(
      priority || 5,
      actionType,
      JSON.stringify(actionData || {})
    );
    
    res.json({ success: true, id: result.lastInsertRowid });
    
  } catch (error) {
    console.error('❌ Save recommendation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent recommendations
app.get('/api/recommendations', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const onlyActive = req.query.active === 'true';
    
    let query = 'SELECT * FROM recommendations';
    if (onlyActive) {
      query += ' WHERE completed = FALSE';
    }
    query += ' ORDER BY timestamp DESC, priority ASC LIMIT ?';
    
    const recommendations = db.prepare(query).all(limit).map(r => ({
      ...r,
      action_data: JSON.parse(r.action_data || '{}'),
      result: r.result ? JSON.parse(r.result) : null,
      completed: r.completed === 1
    }));
    
    res.json(recommendations);
    
  } catch (error) {
    console.error('❌ Get recommendations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server - bind to 0.0.0.0 for Replit
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  
  // Try to detect Replit URL
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    console.log(`📱 Replit URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  } else if (process.env.REPLIT_URL) {
    console.log(`📱 Replit URL: ${process.env.REPLIT_URL}`);
  } else {
    console.log(`📱 For external access, check your Replit preview window`);
  }
  
  // Initialize database and load game data
  initializeDatabase();
  loadGameData();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM received, closing server...');
  server.close(() => {
    db.close();
    console.log('👋 Server closed');
  });
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT received, closing server...');
  server.close(() => {
    db.close();
    console.log('👋 Server closed');
  });
});
